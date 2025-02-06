# Configure required providers for security features
terraform {
  required_providers {
    railway = {
      source  = "terraform-provider-railway/railway" # version: ~> 0.3.0
    }
    tls = {
      source  = "hashicorp/tls" # version: ~> 4.0.0
    }
  }
}

# Security-related local variables
locals {
  domain_name = "${var.environment}.profiles-gallery.railway.app"
  
  # Security headers configuration as per technical specifications
  security_headers = {
    "Strict-Transport-Security"  = "max-age=31536000; includeSubDomains"
    "Content-Security-Policy"    = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    "X-Frame-Options"           = "DENY"
    "X-Content-Type-Options"    = "nosniff"
    "Referrer-Policy"          = "strict-origin-when-cross-origin"
    "Permissions-Policy"        = "camera=(), microphone=(), geolocation=()"
  }
}

# TLS certificate configuration for secure communication
resource "railway_tls_certificate" "app_cert" {
  project_id           = var.project_id
  domain              = local.domain_name
  type                = "managed"
  min_protocol_version = "TLSv1.3"
}

# Security policy configuration for the application
resource "railway_security_policy" "app_policy" {
  project_id = var.project_id
  name       = "${var.environment}-security-policy"
  headers    = local.security_headers

  cors_configuration {
    allowed_origins = ["https://*.railway.app"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers = ["Authorization", "Content-Type"]
    max_age_seconds = 3600
  }
}

# Web Application Firewall (WAF) rules
resource "railway_waf_rules" "app_waf" {
  project_id = var.project_id
  name       = "${var.environment}-waf-rules"

  rules = [
    {
      name     = "rate-limit"
      priority = 1
      action   = "block"
      rate_limit = {
        requests_per_minute = 100
        burst              = 50
      }
    },
    {
      name     = "ip-blacklist"
      priority = 2
      action   = "block"
      ip_rate_limit = {
        limit               = 1000
        time_window_seconds = 3600
      }
    }
  ]
}

# Network security group for database access
resource "railway_security_group" "db_security" {
  project_id = var.project_id
  name       = "${var.environment}-db-security"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Internal network only
  }
}

# Network security group for Redis access
resource "railway_security_group" "redis_security" {
  project_id = var.project_id
  name       = "${var.environment}-redis-security"

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Internal network only
  }
}

# Export security configuration for other modules
output "security_configuration" {
  value = {
    tls_certificate_arn = railway_tls_certificate.app_cert.arn
    security_headers    = local.security_headers
  }
  description = "Security configuration outputs for use in other modules"
}

# Configure encryption at rest for sensitive data
resource "railway_encryption" "data_encryption" {
  project_id = var.project_id
  name       = "${var.environment}-encryption"
  
  encryption_configuration {
    kms_key_id = "railway-managed"
    algorithm  = "AES256"
  }
}

# DDoS protection configuration
resource "railway_ddos_protection" "app_protection" {
  project_id = var.project_id
  name       = "${var.environment}-ddos-protection"
  
  protection_configuration {
    enabled = true
    mode    = "automatic"
  }
}