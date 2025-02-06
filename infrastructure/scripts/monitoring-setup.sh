#!/bin/bash

# LinkedIn Profiles Gallery Monitoring Setup Script
# Version: 1.0.0
# Description: Automates the setup and configuration of the monitoring stack
# Dependencies: docker-compose v2.20.0

# Global variables
MONITORING_DIR="/opt/monitoring"
LOG_FILE="/var/log/monitoring-setup.log"
ENV_FILE=".env"

# Logging function
log() {
    local level=$1
    shift
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# Check prerequisites with enhanced validation
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check root/sudo privileges
    if [ "$(id -u)" != "0" ]; then
        log "ERROR" "This script must be run as root or with sudo privileges"
        return 1
    }

    # Check Docker version
    if ! docker --version | grep -qE "20\.[0-9]+\.[0-9]+" ; then
        log "ERROR" "Docker version 20.10.0 or higher is required"
        return 1
    }

    # Check Docker daemon status
    if ! systemctl is-active --quiet docker; then
        log "ERROR" "Docker daemon is not running"
        return 1
    }

    # Check docker-compose version
    if ! docker-compose --version | grep -qE "2\.[2-9][0-9]\.[0-9]+" ; then
        log "ERROR" "docker-compose version 2.20.0 or higher is required"
        return 1
    }

    # Check port availability
    local ports=(9090 9093 9094 3000)
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log "ERROR" "Port $port is already in use"
            return 1
        fi
    done

    # Check disk space (minimum 10GB)
    local available_space=$(df -BG "$MONITORING_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        log "ERROR" "Insufficient disk space. Minimum 10GB required"
        return 1
    }

    # Check network connectivity
    if ! ping -c 1 docker.io &> /dev/null; then
        log "ERROR" "No network connectivity to Docker Hub"
        return 1
    }

    log "INFO" "Prerequisites check completed successfully"
    return 0
}

# Setup directory structure with enhanced security
setup_directories() {
    log "INFO" "Setting up directory structure..."

    # Create base monitoring directory
    mkdir -p "$MONITORING_DIR"/{prometheus,grafana,alertmanager}/{data,config,backup} \
             "$MONITORING_DIR/logs" \
             "$MONITORING_DIR/ssl" \
             "$MONITORING_DIR/dashboards"

    # Set secure permissions
    chmod 750 "$MONITORING_DIR"
    chmod -R 750 "$MONITORING_DIR"/{prometheus,grafana,alertmanager}
    chmod 700 "$MONITORING_DIR/ssl"

    # Setup log rotation
    cat > /etc/logrotate.d/monitoring << EOF
$LOG_FILE {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 root root
}
EOF

    # Initialize version control
    if [ ! -d "$MONITORING_DIR/.git" ]; then
        git init "$MONITORING_DIR"
        echo "logs/" > "$MONITORING_DIR/.gitignore"
        echo "*.log" >> "$MONITORING_DIR/.gitignore"
        git -C "$MONITORING_DIR" add .
        git -C "$MONITORING_DIR" commit -m "Initial monitoring setup"
    fi

    log "INFO" "Directory setup completed"
    return 0
}

# Configure monitoring components with enhanced security
configure_monitoring() {
    log "INFO" "Configuring monitoring components..."

    # Generate secure passwords
    GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_SECRET_KEY=$(openssl rand -base64 32)

    # Create environment file
    cat > "$MONITORING_DIR/$ENV_FILE" << EOF
GRAFANA_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD
GRAFANA_SECRET_KEY=$GRAFANA_SECRET_KEY
GRAFANA_ROOT_URL=https://monitoring.railway.app
SMTP_HOST=${SMTP_HOST:-smtp.railway.app}
SMTP_USERNAME=${SMTP_USERNAME:-monitoring@railway.app}
SMTP_PASSWORD=${SMTP_PASSWORD:-changeme}
ALERT_FROM_EMAIL=${ALERT_FROM_EMAIL:-monitoring@railway.app}
ALERT_TO_EMAIL=${ALERT_TO_EMAIL:-team@railway.app}
ALERT_CRITICAL_EMAIL=${ALERT_CRITICAL_EMAIL:-oncall@railway.app}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-changeme}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_DB=${POSTGRES_DB:-linkedin_profiles}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PASSWORD=${REDIS_PASSWORD:-changeme}
EOF

    # Copy configuration files
    cp prometheus.yml "$MONITORING_DIR/prometheus/config/"
    cp grafana.yml "$MONITORING_DIR/grafana/config/"
    cp alertmanager.yml "$MONITORING_DIR/alertmanager/config/"
    cp docker-compose.yml "$MONITORING_DIR/"

    # Set secure permissions for config files
    chmod 640 "$MONITORING_DIR"/$ENV_FILE
    chmod 640 "$MONITORING_DIR"/prometheus/config/*
    chmod 640 "$MONITORING_DIR"/grafana/config/*
    chmod 640 "$MONITORING_DIR"/alertmanager/config/*

    log "INFO" "Monitoring configuration completed"
    return 0
}

# Start monitoring stack with health checks
start_monitoring() {
    log "INFO" "Starting monitoring stack..."

    # Pull Docker images with version verification
    docker-compose -f "$MONITORING_DIR/docker-compose.yml" pull

    # Verify image signatures
    for image in $(docker-compose -f "$MONITORING_DIR/docker-compose.yml" config | grep "image:" | awk '{print $2}'); do
        if ! docker trust inspect "$image" &> /dev/null; then
            log "WARNING" "Image signature verification failed for $image"
        fi
    done

    # Start services
    docker-compose -f "$MONITORING_DIR/docker-compose.yml" up -d

    # Health checks
    local services=(prometheus:9090 grafana:3000 alertmanager:9093)
    for service in "${services[@]}"; do
        local host=${service%:*}
        local port=${service#*:}
        for i in {1..30}; do
            if curl -s "http://localhost:$port/-/healthy" &> /dev/null; then
                log "INFO" "$host is healthy"
                break
            fi
            if [ "$i" -eq 30 ]; then
                log "ERROR" "$host failed health check"
                return 1
            fi
            sleep 2
        done
    done

    log "INFO" "Monitoring stack started successfully"
    return 0
}

# Setup logging with enhanced features
setup_logging() {
    log "INFO" "Setting up logging..."

    # Configure structured logging
    mkdir -p /var/log/monitoring
    touch "$LOG_FILE"
    chmod 640 "$LOG_FILE"

    # Setup log aggregation
    cat > "$MONITORING_DIR/promtail.yaml" << EOF
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: monitoring
    static_configs:
      - targets:
          - localhost
        labels:
          job: monitoring
          __path__: /var/log/monitoring/*.log
EOF

    log "INFO" "Logging setup completed"
    return 0
}

# Main execution
main() {
    log "INFO" "Starting monitoring setup..."

    check_prerequisites || exit 1
    setup_directories || exit 1
    configure_monitoring || exit 1
    setup_logging || exit 1
    start_monitoring || exit 1

    log "INFO" "Monitoring setup completed successfully"
    
    # Print access information
    echo "=== Monitoring Stack Access Information ==="
    echo "Grafana: http://localhost:3000 (admin:$GRAFANA_ADMIN_PASSWORD)"
    echo "Prometheus: http://localhost:9090"
    echo "Alertmanager: http://localhost:9093"
    echo "Configuration directory: $MONITORING_DIR"
    echo "Log file: $LOG_FILE"
}

# Execute main function
main "$@"