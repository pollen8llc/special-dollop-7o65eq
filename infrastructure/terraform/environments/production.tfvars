# Production environment identifier
environment = "production"

# Web server resource allocations
# 1 CPU core and 512MB RAM as per infrastructure requirements
web_server_cpu    = 1
web_server_memory = 512

# PostgreSQL database resource allocations
# 2 CPU cores, 1GB RAM, and 100GB storage for production workloads
database_cpu      = 2
database_memory   = 1024
database_storage  = 102400  # 100GB in MB

# Redis cache resource allocation
# 256MB RAM for session and query caching
redis_memory = 256

# Enable Railway CDN for static asset delivery
cdn_enabled = true