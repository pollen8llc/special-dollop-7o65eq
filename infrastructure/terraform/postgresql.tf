# Local variables for PostgreSQL configuration
locals {
  postgresql_version = "14"
}

# Railway PostgreSQL database resource
resource "railway_plugin" "postgresql" {
  project_id  = railway_project.main.id
  name        = "postgresql"
  plugin_type = "postgresql"
  version     = local.postgresql_version

  # Resource allocation as per technical specifications
  resources {
    cpu     = var.database_cpu     # 2 CPU cores
    memory  = var.database_memory  # 1GB RAM
    storage = var.database_storage # 100GB storage
  }

  # Backup configuration for data retention and disaster recovery
  backup {
    enabled           = true
    retention_period  = "7d"  # 7 days retention as per data management strategy
    schedule         = "0 0 * * *"  # Daily backup at midnight
  }

  # PostgreSQL performance and connection parameters
  parameters {
    # Connection limits
    max_connections = 100

    # Memory configuration
    shared_buffers       = "256MB"  # 25% of available memory
    work_mem            = "4MB"     # Per-operation memory
    maintenance_work_mem = "64MB"   # Maintenance operations memory
    effective_cache_size = "768MB"  # Available system memory estimate

    # Write-ahead log settings
    synchronous_commit  = "on"      # Ensures data durability
    checkpoint_timeout  = "5min"    # Maximum time between checkpoints
    max_wal_size       = "1GB"     # Maximum WAL size before checkpoint
  }

  # Monitoring configuration for performance tracking
  monitoring {
    enabled            = true
    metrics_retention  = "30d"  # 30 days metrics retention
  }
}

# Export database connection details
output "postgresql_connection_string" {
  value       = railway_plugin.postgresql.connection_string
  sensitive   = true
  description = "PostgreSQL database connection string"
}

output "postgresql_id" {
  value       = railway_plugin.postgresql.id
  description = "PostgreSQL database instance ID"
}