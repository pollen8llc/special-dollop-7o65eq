# Configure Railway provider for Redis service provisioning
terraform {
  required_providers {
    railway = {
      source  = "terraform-provider-railway"
      version = "~> 0.3.0"
    }
  }
}

# Local variables for Redis configuration
locals {
  redis_name = "${var.environment}-redis-cache"
  redis_tags = {
    Environment = var.environment
    Service     = "redis-cache"
    ManagedBy   = "terraform"
  }
}

# Redis cache service provisioning
resource "railway_service" "redis_cache" {
  project_id   = var.project_id
  name         = local.redis_name
  service_type = "redis"
  environment  = var.environment
  memory_mb    = var.redis_memory

  # Redis configuration and optimization settings
  env_vars = {
    # LRU eviction policy for optimal memory management
    REDIS_MAX_MEMORY_POLICY = "allkeys-lru"
    # Number of samples for LRU algorithm
    REDIS_MAX_MEMORY_SAMPLES = "5"
    # Maximum memory utilization percentage
    REDIS_MAXMEMORY_PERCENT = "95"
  }

  tags = local.redis_tags
}

# Redis monitoring plugin configuration
resource "railway_plugin" "redis_monitoring" {
  project_id  = var.project_id
  service_id  = railway_service.redis_cache.id
  plugin_type = "redis-insights"
  environment = var.environment
}

# Output Redis connection details (marked as sensitive)
output "redis_host" {
  value       = railway_service.redis_cache.host
  description = "Redis service hostname"
  sensitive   = true
}

output "redis_port" {
  value       = railway_service.redis_cache.port
  description = "Redis service port"
  sensitive   = true
}

output "redis_url" {
  value       = "redis://${railway_service.redis_cache.host}:${railway_service.redis_cache.port}"
  description = "Redis connection URL"
  sensitive   = true
}