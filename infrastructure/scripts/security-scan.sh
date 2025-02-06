#!/bin/bash

# LinkedIn Profiles Gallery Security Scanner
# Version: 1.0.0
# Performs comprehensive security scanning of containers, dependencies and infrastructure

# Set strict error handling
set -euo pipefail
IFS=$'\n\t'

# Global variables
SCAN_OUTPUT_DIR=${SCAN_OUTPUT_DIR:-"/tmp/security-scan-results"}
SEVERITY_THRESHOLD=${SEVERITY_THRESHOLD:-"HIGH"}
SCAN_CACHE_DIR=${SCAN_CACHE_DIR:-"/tmp/security-scan-cache"}
MAX_PARALLEL_SCANS=${MAX_PARALLEL_SCANS:-"4"}
REPORT_FORMAT=${REPORT_FORMAT:-"html,json,pdf"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check prerequisites and setup environment
check_prerequisites() {
    echo "Checking prerequisites..."

    # Verify trivy installation
    if ! command -v trivy &> /dev/null; then
        echo "Error: trivy is not installed"
        return 1
    fi

    # Verify snyk installation and auth
    if ! command -v snyk &> /dev/null; then
        echo "Error: snyk is not installed"
        return 1
    fi

    # Verify Docker daemon
    if ! docker info &> /dev/null; then
        echo "Error: Docker daemon not running"
        return 1
    }

    # Create output directories
    mkdir -p "${SCAN_OUTPUT_DIR}"/{containers,dependencies,infrastructure}
    mkdir -p "${SCAN_CACHE_DIR}"

    # Update vulnerability databases
    trivy image --download-db-only
    snyk config set org="${SNYK_ORG_ID}"

    return 0
}

# Scan container images
scan_container() {
    local container_name=$1
    local container_tag=$2
    local output_file="${SCAN_OUTPUT_DIR}/containers/${container_name}_${TIMESTAMP}"

    echo "Scanning container: ${container_name}:${container_tag}"

    # Trivy container scan
    trivy image \
        --cache-dir "${SCAN_CACHE_DIR}" \
        --severity "${SEVERITY_THRESHOLD},CRITICAL" \
        --format "template" \
        --template "@contrib/html.tpl" \
        --output "${output_file}.html" \
        "${container_name}:${container_tag}"

    # Snyk container scan
    snyk container test \
        "${container_name}:${container_tag}" \
        --severity-threshold="${SEVERITY_THRESHOLD}" \
        --json-file-output="${output_file}.json"

    return $?
}

# Scan project dependencies
scan_dependencies() {
    local project_path=$1
    local output_file="${SCAN_OUTPUT_DIR}/dependencies/deps_${TIMESTAMP}"

    echo "Scanning dependencies in: ${project_path}"

    # Scan backend dependencies
    (cd "${project_path}/src/backend" && \
        snyk test \
            --all-projects \
            --severity-threshold="${SEVERITY_THRESHOLD}" \
            --json-file-output="${output_file}_backend.json")

    # Scan web dependencies
    (cd "${project_path}/src/web" && \
        snyk test \
            --all-projects \
            --severity-threshold="${SEVERITY_THRESHOLD}" \
            --json-file-output="${output_file}_web.json")

    return $?
}

# Scan infrastructure components
scan_infrastructure() {
    local compose_file=$1
    local output_file="${SCAN_OUTPUT_DIR}/infrastructure/infra_${TIMESTAMP}"

    echo "Scanning infrastructure defined in: ${compose_file}"

    # Scan Docker Compose configuration
    trivy config \
        --severity "${SEVERITY_THRESHOLD},CRITICAL" \
        --format "template" \
        --template "@contrib/html.tpl" \
        --output "${output_file}.html" \
        "${compose_file}"

    # Scan Kubernetes manifests if present
    if [ -d "./k8s" ]; then
        trivy config \
            --severity "${SEVERITY_THRESHOLD},CRITICAL" \
            --format "template" \
            --template "@contrib/html.tpl" \
            --output "${output_file}_k8s.html" \
            "./k8s"
    fi

    return $?
}

# Generate comprehensive security report
generate_report() {
    local output_dir="${SCAN_OUTPUT_DIR}/report_${TIMESTAMP}"
    mkdir -p "${output_dir}"

    echo "Generating security assessment report..."

    # Aggregate all scan results
    {
        echo "# Security Assessment Report - $(date)"
        echo "## Summary"
        echo
        echo "### Container Scan Results"
        jq -s '.' "${SCAN_OUTPUT_DIR}"/containers/*.json > "${output_dir}/container_summary.json"
        
        echo "### Dependency Scan Results"
        jq -s '.' "${SCAN_OUTPUT_DIR}"/dependencies/*.json > "${output_dir}/dependency_summary.json"
        
        echo "### Infrastructure Scan Results"
        cat "${SCAN_OUTPUT_DIR}"/infrastructure/*.html > "${output_dir}/infrastructure_summary.html"
        
        echo "## Recommendations"
        # Add remediation recommendations based on findings
    } > "${output_dir}/report.md"

    # Convert to requested formats
    if [[ "${REPORT_FORMAT}" == *"pdf"* ]]; then
        pandoc "${output_dir}/report.md" -o "${output_dir}/report.pdf"
    fi

    return 0
}

# Main execution
main() {
    local project_root=$1

    # Check prerequisites
    check_prerequisites || exit 1

    # Scan containers
    scan_container "linkedin-profiles-backend" "latest"
    scan_container "linkedin-profiles-web" "latest"

    # Scan dependencies
    scan_dependencies "${project_root}"

    # Scan infrastructure
    scan_infrastructure "${project_root}/infrastructure/docker/monitoring/docker-compose.yml"

    # Generate report
    generate_report

    echo "Security scan completed. Reports available in: ${SCAN_OUTPUT_DIR}"
}

# Execute main if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [ "$#" -ne 1 ]; then
        echo "Usage: $0 PROJECT_ROOT_PATH"
        exit 1
    fi
    main "$1"
fi