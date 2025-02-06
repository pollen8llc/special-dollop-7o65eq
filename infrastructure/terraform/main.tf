# Configure required providers
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    railway = {
      source  = "terraform-provider-railway/railway"
      version = "~> 0.3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9.0"
    }
  }
}

# Local variables
locals {
  project_name = "linkedin-profiles-gallery"
  environment  = var.environment
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "linkedin-profiles-gallery"
  }
}

# Railway infrastructure module
module "railway_infrastructure" {
  source = "./railway.tf"

  environment       = var.environment
  api_token        = var.railway_api_token
  web_server_cpu   = var.web_server_cpu
  web_server_memory = var.web_server_memory
}

# PostgreSQL database module
module "postgresql_database" {
  source = "./postgresql.tf"

  project_id       = module.railway_infrastructure.project_id
  environment      = var.environment
  database_cpu     = var.database_cpu
  database_memory  = var.database_memory
  database_storage = var.database_storage

  depends_on = [module.railway_infrastructure]
}

# Redis cache module
module "redis_cache" {
  source = "./redis.tf"

  project_id    = module.railway_infrastructure.project_id
  environment   = var.environment
  redis_memory  = var.redis_memory

  depends_on = [module.railway_infrastructure]
}

# CDN configuration module
module "cdn_configuration" {
  source = "./cdn.tf"

  project_id  = module.railway_infrastructure.project_id
  environment = var.environment
  enabled     = var.cdn_enabled

  depends_on = [module.railway_infrastructure]
}

# Monitoring module
module "monitoring" {
  source = "./monitoring.tf"

  project_id      = module.railway_infrastructure.project_id
  environment     = var.environment
  web_service_id  = module.railway_infrastructure.web_service_id

  depends_on = [
    module.railway_infrastructure,
    module.postgresql_database,
    module.redis_cache
  ]
}

# Security module
module "security" {
  source = "./security.tf"

  project_id  = module.railway_infrastructure.project_id
  environment = var.environment

  depends_on = [module.railway_infrastructure]
}

# Output values
output "railway_project_id" {
  description = "The ID of the Railway project"
  value       = module.railway_infrastructure.project_id
}

output "web_service_id" {
  description = "The ID of the web service"
  value       = module.railway_infrastructure.web_service_id
}

output "database_connection_string" {
  description = "PostgreSQL database connection string"
  value       = module.postgresql_database.connection_string
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis cache connection string"
  value       = module.redis_cache.connection_string
  sensitive   = true
}

output "cdn_domain" {
  description = "CDN domain name"
  value       = module.cdn_configuration.cdn_domain
}

# Lifecycle management
resource "time_sleep" "wait_for_services" {
  depends_on = [
    module.railway_infrastructure,
    module.postgresql_database,
    module.redis_cache,
    module.cdn_configuration
  ]

  create_duration = "30s"
}

# Health check
resource "null_resource" "health_check" {
  depends_on = [time_sleep.wait_for_services]

  provisioner "local-exec" {
    command = <<-EOT
      curl -f https://${module.railway_infrastructure.web_service_id}.railway.app/health || exit 1
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}