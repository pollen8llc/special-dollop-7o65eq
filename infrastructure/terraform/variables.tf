# Railway API token for authentication and infrastructure management
variable "railway_api_token" {
  type        = string
  sensitive   = true
  description = "Railway API token for authentication and infrastructure management"

  validation {
    condition     = length(var.railway_api_token) > 0
    error_message = "Railway API token must be provided"
  }
}

# Deployment environment selection
variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production)"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

# Web server resource allocations
variable "web_server_cpu" {
  type        = number
  default     = 1
  description = "Web server CPU allocation in cores as per technical specifications"

  validation {
    condition     = var.web_server_cpu >= 1
    error_message = "Web server CPU must be at least 1 core"
  }
}

variable "web_server_memory" {
  type        = number
  default     = 512
  description = "Web server memory allocation in MB for Remix application hosting"

  validation {
    condition     = var.web_server_memory >= 512
    error_message = "Web server memory must be at least 512MB"
  }
}

# PostgreSQL database resource allocations
variable "database_cpu" {
  type        = number
  default     = 2
  description = "PostgreSQL database CPU allocation in cores for profile data storage"

  validation {
    condition     = var.database_cpu >= 2
    error_message = "Database CPU must be at least 2 cores"
  }
}

variable "database_memory" {
  type        = number
  default     = 1024
  description = "PostgreSQL database memory allocation in MB for efficient query processing"

  validation {
    condition     = var.database_memory >= 1024
    error_message = "Database memory must be at least 1GB"
  }
}

variable "database_storage" {
  type        = number
  default     = 10240
  description = "PostgreSQL database storage allocation in MB for profile data and indexes"

  validation {
    condition     = var.database_storage >= 10240
    error_message = "Database storage must be at least 10GB"
  }
}

# Redis cache resource allocations
variable "redis_memory" {
  type        = number
  default     = 256
  description = "Redis cache memory allocation in MB for performance optimization"

  validation {
    condition     = var.redis_memory >= 256
    error_message = "Redis memory must be at least 256MB"
  }
}

# CDN configuration
variable "cdn_enabled" {
  type        = bool
  default     = true
  description = "Enable or disable Railway CDN for static asset delivery and performance optimization"
}