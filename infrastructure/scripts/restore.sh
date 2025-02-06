#!/bin/bash

# LinkedIn Profiles Gallery - Database Restoration Script
# Version: 1.0.0
# Handles automated PostgreSQL database restoration with Railway platform integration
# Requires: postgresql-client-14, gnupg-2.2

set -euo pipefail
IFS=$'\n\t'

# Global configuration
BACKUP_DIR="/var/backups/linkedin-profiles"
GPG_RECIPIENT="backup-key@linkedin-profiles.com"
RESTORE_LOG="/var/log/linkedin-profiles/restore.log"
RAILWAY_PROJECT="linkedin-profiles-gallery"
MAX_CONNECTIONS=100
RESTORE_TIMEOUT=3600

# Initialize logging
function log_restore_status() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local level="$1"
    local message="$2"
    local metadata="${3:-}"
    
    echo "[${timestamp}] ${level}: ${message} ${metadata}" >> "${RESTORE_LOG}"
    
    # Forward critical errors to system logger
    if [[ "${level}" == "ERROR" ]]; then
        logger -p local0.err -t "restore.sh" "${message}"
    fi
}

# Verify all required dependencies and permissions
function check_dependencies() {
    log_restore_status "INFO" "Checking dependencies and permissions"
    
    # Check required tools
    local required_tools=("pg_restore" "gpg" "railway")
    for tool in "${required_tools[@]}"; do
        if ! command -v "${tool}" &> /dev/null; then
            log_restore_status "ERROR" "Required tool not found: ${tool}"
            return 1
        fi
    done
    
    # Verify PostgreSQL client version
    local pg_version=$(pg_restore --version | grep -oP '\d+\.\d+')
    if (( $(echo "${pg_version} < 14.0" | bc -l) )); then
        log_restore_status "ERROR" "PostgreSQL client version must be 14.0 or higher"
        return 1
    fi
    
    # Check backup directory
    if [[ ! -d "${BACKUP_DIR}" ]]; then
        log_restore_status "ERROR" "Backup directory not found: ${BACKUP_DIR}"
        return 1
    fi
    
    # Verify GPG key availability
    if ! gpg --list-keys "${GPG_RECIPIENT}" &> /dev/null; then
        log_restore_status "ERROR" "GPG key not found for: ${GPG_RECIPIENT}"
        return 1
    }
    
    # Validate Railway authentication
    if ! railway whoami &> /dev/null; then
        log_restore_status "ERROR" "Railway authentication failed"
        return 1
    }
    
    log_restore_status "INFO" "All dependencies verified successfully"
    return 0
}

# Decrypt backup file securely
function decrypt_backup() {
    local input_file="$1"
    local output_file="$2"
    
    log_restore_status "INFO" "Decrypting backup file: ${input_file}"
    
    # Verify backup file exists and is readable
    if [[ ! -f "${input_file}" ]]; then
        log_restore_status "ERROR" "Backup file not found: ${input_file}"
        return 1
    fi
    
    # Verify backup file checksum
    if [[ -f "${input_file}.sha256" ]]; then
        if ! sha256sum -c "${input_file}.sha256"; then
            log_restore_status "ERROR" "Backup file checksum verification failed"
            return 1
        fi
    fi
    
    # Decrypt backup file
    if ! gpg --decrypt --recipient "${GPG_RECIPIENT}" \
            --output "${output_file}" "${input_file}"; then
        log_restore_status "ERROR" "Backup file decryption failed"
        return 1
    fi
    
    # Verify decrypted file
    if [[ ! -f "${output_file}" ]]; then
        log_restore_status "ERROR" "Decrypted file not created"
        return 1
    fi
    
    log_restore_status "INFO" "Backup decryption completed successfully"
    return 0
}

# Execute database restoration
function restore_database() {
    local backup_file="$1"
    
    log_restore_status "INFO" "Starting database restoration from: ${backup_file}"
    
    # Get database connection details from Railway
    local database_url=$(railway variables get DATABASE_URL)
    if [[ -z "${database_url}" ]]; then
        log_restore_status "ERROR" "Failed to get DATABASE_URL from Railway"
        return 1
    fi
    
    # Extract database name from URL
    local db_name=$(echo "${database_url}" | grep -oP '(?<=/)[^?]+$')
    
    # Configure restoration parameters
    local pg_restore_opts=(
        "--clean"                # Clean existing objects
        "--if-exists"           # Don't error if objects don't exist
        "--no-owner"            # Don't set ownership
        "--no-privileges"       # Don't set privileges
        "--no-comments"         # Skip comments
        "--jobs=4"             # Parallel restoration
        "--verbose"            # Detailed output
    )
    
    # Terminate existing connections
    if ! psql "${database_url}" -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '${db_name}' 
        AND pid <> pg_backend_pid();" &> /dev/null; then
        log_restore_status "WARN" "Failed to terminate existing connections"
    fi
    
    # Execute restoration with timeout
    if ! timeout "${RESTORE_TIMEOUT}" pg_restore "${pg_restore_opts[@]}" \
            --dbname "${database_url}" "${backup_file}"; then
        log_restore_status "ERROR" "Database restoration failed"
        return 1
    fi
    
    log_restore_status "INFO" "Database restoration completed successfully"
    return 0
}

# Validate restored database
function validate_restore() {
    log_restore_status "INFO" "Validating restored database"
    
    local database_url=$(railway variables get DATABASE_URL)
    
    # Check database connectivity
    if ! psql "${database_url}" -c "SELECT 1;" &> /dev/null; then
        log_restore_status "ERROR" "Database connectivity check failed"
        return 1
    fi
    
    # Validate core tables
    local required_tables=("users" "profiles" "experiences")
    for table in "${required_tables[@]}"; do
        if ! psql "${database_url}" -c "SELECT COUNT(*) FROM ${table};" &> /dev/null; then
            log_restore_status "ERROR" "Required table missing or invalid: ${table}"
            return 1
        fi
    done
    
    # Verify indexes
    if ! psql "${database_url}" -c "
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public';" &> /dev/null; then
        log_restore_status "ERROR" "Index validation failed"
        return 1
    fi
    
    # Check foreign key constraints
    if ! psql "${database_url}" -c "
        SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY';" &> /dev/null; then
        log_restore_status "ERROR" "Foreign key constraint validation failed"
        return 1
    fi
    
    log_restore_status "INFO" "Database validation completed successfully"
    return 0
}

# Main execution flow
function main() {
    local backup_file="$1"
    local temp_dir=$(mktemp -d)
    local decrypted_file="${temp_dir}/backup.sql"
    
    log_restore_status "INFO" "Starting database restoration process"
    
    # Cleanup on exit
    trap 'rm -rf "${temp_dir}"' EXIT
    
    # Execute restoration process
    if ! check_dependencies; then
        log_restore_status "ERROR" "Dependency check failed"
        exit 1
    fi
    
    if ! decrypt_backup "${backup_file}" "${decrypted_file}"; then
        log_restore_status "ERROR" "Backup decryption failed"
        exit 1
    fi
    
    if ! restore_database "${decrypted_file}"; then
        log_restore_status "ERROR" "Database restoration failed"
        exit 1
    fi
    
    if ! validate_restore; then
        log_restore_status "ERROR" "Database validation failed"
        exit 1
    fi
    
    log_restore_status "INFO" "Database restoration completed successfully"
    exit 0
}

# Script entry point
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

main "$1"