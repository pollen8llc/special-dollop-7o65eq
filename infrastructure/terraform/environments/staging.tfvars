# Environment identifier for staging deployment
environment = "staging"

# Web server resource allocations for Remix application
web_server_cpu = 1       # 1 core as per technical specifications
web_server_memory = 512  # 512MB RAM minimum requirement

# PostgreSQL database resource allocations
database_cpu = 2         # 2 cores for optimal query performance
database_memory = 1024   # 1GB RAM for database operations
database_storage = 20480 # 20GB storage for profile data and indexes

# Redis cache configuration for performance optimization
redis_memory = 256       # 256MB for session and query caching

# CDN configuration for static asset delivery
cdn_enabled = true       # Enable Railway CDN for staging environment

# Auto-scaling configuration for staging environment
instance_count_min = 1   # Minimum 1 instance for high availability
instance_count_max = 5   # Maximum 5 instances for load handling