# Configure Railway CDN for static asset delivery and global performance optimization
locals {
  cdn_name = "linkedin-profiles-gallery-cdn"
}

# Main CDN configuration
resource "railway_cdn" "main" {
  project_id = railway_project.main.id
  name       = local.cdn_name
  enabled    = var.cdn_enabled

  settings {
    # Enable edge caching for improved global performance
    edge_caching = true
    
    # Enable compression for reduced bandwidth usage
    compression = true
    
    # Configure cache control headers
    cache_control {
      # 1 year cache for static assets
      max_age    = 31536000
      s_max_age  = 31536000
    }
    
    # Allow all origins as per technical specification
    allowed_origins = ["*"]
    
    # Define cacheable file types
    file_types = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/css",
      "text/javascript",
      "application/javascript"
    ]
  }
}

# CDN caching rules for different asset types
resource "railway_cdn_rule" "cache_rules" {
  cdn_id = railway_cdn.main.id

  rules = [
    {
      # Static assets (CSS, JS, etc)
      path = "/static/*"
      cache_control = {
        max_age    = 31536000  # 1 year
        s_max_age  = 31536000
      }
    },
    {
      # General assets (fonts, icons, etc)
      path = "/assets/*"
      cache_control = {
        max_age    = 31536000  # 1 year
        s_max_age  = 31536000
      }
    },
    {
      # Profile images with shorter cache duration
      path = "/profiles/images/*"
      cache_control = {
        max_age    = 86400     # 1 day
        s_max_age  = 86400
      }
    }
  ]
}