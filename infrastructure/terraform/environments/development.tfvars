# Development Environment Configuration
environment = "development"

# Web Server Resource Allocations
# As per technical specifications section 2.5.1, development web server
# requires 1 CPU core and 512MB RAM minimum
web_server_cpu    = 1
web_server_memory = 512

# Database Resource Allocations
# As per technical specifications section 2.5.1, database requires
# 2 CPU cores and 1GB RAM minimum
database_cpu     = 2
database_memory  = 1024
database_storage = 10240  # 10GB storage for development environment

# Redis Cache Resource Allocations
# As per technical specifications section 2.5.1, cache requires
# 256MB RAM minimum
redis_memory = 256

# CDN Configuration
# Enable CDN for static asset delivery even in development
# as per section 8.2 Cloud Services specifications
cdn_enabled = true