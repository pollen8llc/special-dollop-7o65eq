# Configure Terraform settings and required providers
terraform {
  # Require Terraform version 1.0.0 or higher as per infrastructure requirements
  required_version = ">= 1.0.0"

  # Define required providers with version constraints for stability
  required_providers {
    # Primary provider for Railway platform infrastructure management
    railway = {
      source  = "terraform-provider-railway"
      version = "~> 0.3.0"
    }

    # Random provider for generating unique resource identifiers
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5.0"
    }

    # Time provider for managing resource timing operations
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9.0"
    }
  }
}

# Configure Railway provider with secure authentication
provider "railway" {
  # Use Railway API token from variables for secure authentication
  api_token = var.railway_api_token
}

# Configure random provider for generating unique identifiers
provider "random" {
  # No additional configuration needed
}

# Configure time provider for resource timing operations
provider "time" {
  # No additional configuration needed
}