# Provider configuration for Railway platform
terraform {
  required_providers {
    railway = {
      source  = "terraform-provider-railway"
      version = "~> 0.3.0"
    }
  }
}

# Local variables for monitoring configuration
locals {
  monitoring_config = {
    prometheus_retention         = "15d"
    prometheus_scrape_interval   = "15s"
    prometheus_evaluation_interval = "15s"
    grafana_admin_password      = random_password.grafana_admin.result
    grafana_plugins             = "grafana-piechart-panel,grafana-worldmap-panel"
    alertmanager_resolve_timeout = "5m"
    alertmanager_slack_webhook  = var.slack_webhook_url
  }
}

# Random password generation for Grafana admin
resource "random_password" "grafana_admin" {
  length      = 16
  special     = true
  min_special = 2
  min_numeric = 2
  min_upper   = 2
  min_lower   = 2
}

# Prometheus service deployment
resource "railway_service" "prometheus" {
  name = "prometheus-${var.environment}"
  
  image = "prom/prometheus:v2.45.0"
  
  environment_variables = {
    PROMETHEUS_CONFIG_PATH       = "/etc/prometheus/prometheus.yml"
    PROMETHEUS_RETENTION_TIME    = local.monitoring_config.prometheus_retention
    PROMETHEUS_STORAGE_PATH      = "/prometheus"
    PROMETHEUS_WEB_LISTEN_ADDRESS = ":9090"
  }

  volumes = [
    {
      source = "prometheus.yml"
      target = "/etc/prometheus/prometheus.yml"
    },
    {
      source = "prometheus-data"
      target = "/prometheus"
    }
  ]

  ports = [
    {
      internal = 9090
      external = 9090
    }
  ]

  health_check = {
    path     = "/-/healthy"
    interval = "30s"
    timeout  = "10s"
    retries  = 3
  }
}

# Grafana service deployment
resource "railway_service" "grafana" {
  name = "grafana-${var.environment}"
  
  image = "grafana/grafana:9.5.0"
  
  environment_variables = {
    GF_SECURITY_ADMIN_PASSWORD = local.monitoring_config.grafana_admin_password
    GF_AUTH_ANONYMOUS_ENABLED  = "false"
    GF_INSTALL_PLUGINS        = local.monitoring_config.grafana_plugins
    GF_SERVER_ROOT_URL       = var.grafana_root_url
    GF_SMTP_ENABLED         = "true"
    GF_SMTP_HOST           = var.smtp_host
    GF_USERS_ALLOW_SIGN_UP = "false"
  }

  volumes = [
    {
      source = "grafana-data"
      target = "/var/lib/grafana"
    },
    {
      source = "grafana-provisioning"
      target = "/etc/grafana/provisioning"
    }
  ]

  ports = [
    {
      internal = 3000
      external = 3000
    }
  ]

  health_check = {
    path     = "/api/health"
    interval = "30s"
    timeout  = "10s"
    retries  = 3
  }
}

# AlertManager service deployment
resource "railway_service" "alertmanager" {
  name = "alertmanager-${var.environment}"
  
  image = "prom/alertmanager:v0.25.0"
  
  environment_variables = {
    ALERTMANAGER_CONFIG_PATH    = "/etc/alertmanager/alertmanager.yml"
    ALERTMANAGER_RESOLVE_TIMEOUT = local.monitoring_config.alertmanager_resolve_timeout
    ALERTMANAGER_SLACK_WEBHOOK  = local.monitoring_config.alertmanager_slack_webhook
  }

  volumes = [
    {
      source = "alertmanager.yml"
      target = "/etc/alertmanager/alertmanager.yml"
    },
    {
      source = "alertmanager-data"
      target = "/alertmanager"
    }
  ]

  ports = [
    {
      internal = 9093
      external = 9093
    }
  ]

  health_check = {
    path     = "/-/healthy"
    interval = "30s"
    timeout  = "10s"
    retries  = 3
  }
}

# Output definitions for service endpoints
output "prometheus_endpoint" {
  value       = "https://${railway_service.prometheus.name}.railway.app"
  description = "Prometheus service endpoint URL for metric collection"
}

output "grafana_endpoint" {
  value       = "https://${railway_service.grafana.name}.railway.app"
  description = "Grafana dashboard endpoint URL for visualization access"
}

output "alertmanager_endpoint" {
  value       = "https://${railway_service.alertmanager.name}.railway.app"
  description = "AlertManager service endpoint URL for alert management"
}