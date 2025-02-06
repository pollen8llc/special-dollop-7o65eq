# Output variables for LinkedIn Profiles Gallery infrastructure

# Project identifier output
output "project_id" {
  description = "Railway project identifier for infrastructure management and integration"
  value       = railway_project.main.id
  sensitive   = false

  precondition {
    condition     = railway_project.main.id != ""
    error_message = "Project ID must be valid and non-empty"
  }
}

# Database connection string output
output "database_url" {
  description = "Secure PostgreSQL database connection string for application database access"
  value       = railway_plugin.postgresql.connection_string
  sensitive   = true

  precondition {
    condition     = can(regex("^postgresql://", railway_plugin.postgresql.connection_string))
    error_message = "Invalid PostgreSQL connection string format"
  }
}

# Redis connection details output
output "redis_url" {
  description = "Secure Redis cache connection URL for application caching layer"
  value       = "redis://${railway_service.redis_cache.host}:${railway_service.redis_cache.port}"
  sensitive   = true

  precondition {
    condition     = railway_service.redis_cache.host != "" && railway_service.redis_cache.port != ""
    error_message = "Invalid Redis connection configuration"
  }
}

# Web service identifier output
output "web_service_id" {
  description = "Web application service identifier for deployment and service management"
  value       = railway_service.web.id
  sensitive   = false

  precondition {
    condition     = railway_service.web.id != ""
    error_message = "Web service ID must be valid and non-empty"
  }
}

# API service identifier output
output "api_service_id" {
  description = "Backend API service identifier for service management"
  value       = railway_service.api.id
  sensitive   = false

  precondition {
    condition     = railway_service.api.id != ""
    error_message = "API service ID must be valid and non-empty"
  }
}

# Web application domain output
output "web_domain" {
  description = "Primary domain for web application access"
  value       = railway_service.web.domains[0]
  sensitive   = false

  precondition {
    condition     = length(railway_service.web.domains) > 0
    error_message = "Web service must have at least one domain configured"
  }
}

# Database monitoring output
output "database_monitoring_endpoint" {
  description = "PostgreSQL database monitoring endpoint"
  value       = railway_plugin.postgresql.monitoring.endpoint
  sensitive   = false

  precondition {
    condition     = railway_plugin.postgresql.monitoring.enabled
    error_message = "Database monitoring must be enabled"
  }
}

# Environment identifier output
output "environment" {
  description = "Current deployment environment identifier"
  value       = var.environment
  sensitive   = false

  precondition {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

# Resource allocation outputs
output "web_resources" {
  description = "Web service resource allocation details"
  value = {
    cpu    = var.web_server_cpu
    memory = var.web_server_memory
  }
  sensitive = false

  precondition {
    condition     = var.web_server_cpu >= 1 && var.web_server_memory >= 512
    error_message = "Web service resources must meet minimum requirements"
  }
}

# Database resource outputs
output "database_resources" {
  description = "PostgreSQL database resource allocation details"
  value = {
    cpu     = var.database_cpu
    memory  = var.database_memory
    storage = var.database_storage
  }
  sensitive = false

  precondition {
    condition     = var.database_cpu >= 2 && var.database_memory >= 1024
    error_message = "Database resources must meet minimum requirements"
  }
}