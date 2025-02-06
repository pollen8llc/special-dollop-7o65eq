# Configure Railway provider
terraform {
  required_providers {
    railway = {
      source  = "terraform-provider-railway/railway"
      version = "~> 0.3.0"
    }
  }
}

# Configure provider with API token
provider "railway" {
  api_token = var.railway_api_token
}

# Local variables for resource naming
locals {
  project_name = "linkedin-profiles-gallery-${var.environment}"
}

# Railway project configuration
resource "railway_project" "main" {
  name        = local.project_name
  description = "LinkedIn Profiles Gallery application infrastructure"
  environment = var.environment
  
  tags = {
    application = "linkedin-profiles-gallery"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Web frontend service
resource "railway_service" "web" {
  project_id = railway_project.main.id
  name       = "web-frontend"
  
  source {
    repo   = "src/web"
    branch = var.environment
  }
  
  instance_count {
    min = 1
    max = 10
  }
  
  resources {
    cpu    = 1
    memory = 512
  }
  
  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  
  auto_deploy = true
  domains     = ["${var.environment}.profiles-gallery.railway.app"]
}

# Backend API service
resource "railway_service" "api" {
  project_id = railway_project.main.id
  name       = "backend-api"
  
  source {
    repo   = "src/backend"
    branch = var.environment
  }
  
  instance_count {
    min = 1
    max = 10
  }
  
  resources {
    cpu    = 1
    memory = 512
  }
  
  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
  
  auto_deploy = true
}

# PostgreSQL database plugin
resource "railway_plugin" "postgresql" {
  project_id  = railway_project.main.id
  name        = "postgresql"
  plugin_type = "postgresql"
  version     = "14"
  
  resources {
    cpu    = 2
    memory = 1024
  }
  
  storage {
    size = 100
  }
  
  backup {
    enabled        = true
    retention_days = 7
  }
}

# Redis cache plugin
resource "railway_plugin" "redis" {
  project_id  = railway_project.main.id
  name        = "redis"
  plugin_type = "redis"
  version     = "6"
  
  resources {
    memory = 256
  }
  
  persistence {
    enabled = true
  }
}

# CDN plugin
resource "railway_plugin" "cdn" {
  project_id  = railway_project.main.id
  name        = "cdn"
  plugin_type = "cdn"
  enabled     = true
  
  configuration {
    origins = [railway_service.web.domains[0]]
    
    caching_rules {
      path_pattern = "/static/*"
      ttl          = 3600
    }
    
    caching_rules {
      path_pattern = "/assets/*"
      ttl          = 86400
    }
  }
}