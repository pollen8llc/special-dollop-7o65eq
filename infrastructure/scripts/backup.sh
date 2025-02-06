#!/bin/bash

# LinkedIn Profiles Gallery - Database Backup Script
# Version: 1.0.0
# Implements automated PostgreSQL backups with Railway platform integration
# Requires: postgresql-client-14, gnupg-2.2, gzip-1.10

# Strict error handling
set -euo pipefail
IFS=$'\n\t'

# Global configuration
BACKUP_DIR="/var/backups/linkedin-profiles"
RETENTION_DAYS=7
GPG_RECIPIENT="backup-key@linkedin-profiles.com"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MIN_DISK_SPACE=5120  # 5GB in MB
LOG_FILE="/var/log/linkedin-profiles/backup.log"
RAILWAY_ENV="${RAILWAY_ENVIRONMENT:-development}"

# Logging function with Railway context
log_backup_status() {
    local level=$1
    local message=$2
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    echo "[${timestamp}] [${RAILWAY_ENV}] [${level}] ${message}" >> "${LOG_FILE}"
    
    # Output critical errors to stderr
    if [[ "${level}" == "ERROR" ]]; then
        echo "[${timestamp}] [${RAILWAY_ENV}] [${level}] ${message}" >&2
    fi
}

# Check all required dependencies and configurations
check_dependencies() {
    local missing_deps=0

    # Check required commands
    for cmd in pg_dump pg_restore gpg gzip; do
        if ! command -v "${cmd}" >/dev/null 2>&1; then
            log_backup_status "ERROR" "Required command not found: ${cmd}"
            missing_deps=1
        fi
    done

    # Verify PostgreSQL client version compatibility
    if pg_dump --version | grep -q "pg_dump (PostgreSQL) 14"; then
        log_backup_status "INFO" "PostgreSQL client version verified"
    else
        log_backup_status "ERROR" "Incompatible PostgreSQL client version"
        missing_deps=1
    fi

    # Check GPG configuration
    if ! gpg --list-keys "${GPG_RECIPIENT}" >/dev/null 2>&1; then
        log_backup_status "ERROR" "GPG recipient key not found: ${GPG_RECIPIENT}"
        missing_deps=1
    fi

    # Verify environment variables
    if [[ -z "${DATABASE_URL:-}" ]] || [[ -z "${DATABASE_DIRECT_URL:-}" ]]; then
        log_backup_status "ERROR" "Required database environment variables not set"
        missing_deps=1
    fi

    # Check backup directory
    if [[ ! -d "${BACKUP_DIR}" ]]; then
        if ! mkdir -p "${BACKUP_DIR}"; then
            log_backup_status "ERROR" "Failed to create backup directory: ${BACKUP_DIR}"
            missing_deps=1
        fi
    fi

    # Check available disk space
    local available_space
    available_space=$(df -m "${BACKUP_DIR}" | awk 'NR==2 {print $4}')
    if [[ "${available_space}" -lt "${MIN_DISK_SPACE}" ]]; then
        log_backup_status "ERROR" "Insufficient disk space. Required: ${MIN_DISK_SPACE}MB, Available: ${available_space}MB"
        missing_deps=1
    fi

    # Verify log directory exists and is writable
    local log_dir
    log_dir=$(dirname "${LOG_FILE}")
    if [[ ! -d "${log_dir}" ]]; then
        if ! mkdir -p "${log_dir}"; then
            log_backup_status "ERROR" "Failed to create log directory: ${log_dir}"
            missing_deps=1
        fi
    fi

    return "${missing_deps}"
}

# Create PostgreSQL backup
create_backup() {
    local output_file=$1
    local temp_file="${output_file}.tmp"
    local start_time
    start_time=$(date +%s)

    log_backup_status "INFO" "Starting database backup to ${output_file}"

    # Set Railway-specific PostgreSQL parameters
    export PGSSLMODE=require
    export PGCONNECT_TIMEOUT=30

    # Create backup using custom format
    if ! pg_dump --format=custom \
        --verbose \
        --no-owner \
        --no-acl \
        --compress=9 \
        --file="${temp_file}" \
        "${DATABASE_DIRECT_URL}"; then
        log_backup_status "ERROR" "Database backup failed"
        rm -f "${temp_file}"
        return 1
    fi

    # Verify backup file was created and has size > 0
    if [[ ! -s "${temp_file}" ]]; then
        log_backup_status "ERROR" "Backup file is empty or not created"
        rm -f "${temp_file}"
        return 1
    fi

    # Calculate backup checksum
    sha256sum "${temp_file}" > "${temp_file}.sha256"

    # Verify backup integrity
    if ! pg_restore --list "${temp_file}" >/dev/null 2>&1; then
        log_backup_status "ERROR" "Backup verification failed"
        rm -f "${temp_file}" "${temp_file}.sha256"
        return 1
    fi

    # Move verified backup to final location
    mv "${temp_file}" "${output_file}"
    mv "${temp_file}.sha256" "${output_file}.sha256"

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local size
    size=$(du -h "${output_file}" | cut -f1)

    log_backup_status "INFO" "Backup completed successfully. Size: ${size}, Duration: ${duration}s"
    return 0
}

# Compress and encrypt backup
compress_and_encrypt_backup() {
    local input_file=$1
    local output_file=$2
    local start_time
    start_time=$(date +%s)

    log_backup_status "INFO" "Starting compression and encryption of ${input_file}"

    # Compress backup
    if ! gzip -9 -c "${input_file}" > "${input_file}.gz"; then
        log_backup_status "ERROR" "Backup compression failed"
        return 1
    fi

    # Encrypt compressed backup
    if ! gpg --batch --yes --trust-model always \
        --recipient "${GPG_RECIPIENT}" \
        --output "${output_file}" \
        --encrypt "${input_file}.gz"; then
        log_backup_status "ERROR" "Backup encryption failed"
        rm -f "${input_file}.gz"
        return 1
    fi

    # Verify encrypted file exists and has size > 0
    if [[ ! -s "${output_file}" ]]; then
        log_backup_status "ERROR" "Encrypted backup file is empty or not created"
        rm -f "${input_file}.gz"
        return 1
    }

    # Calculate and store encrypted file checksum
    sha256sum "${output_file}" > "${output_file}.sha256"

    # Clean up intermediate files
    rm -f "${input_file}" "${input_file}.gz"

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local original_size
    original_size=$(du -h "${input_file}" | cut -f1)
    local encrypted_size
    encrypted_size=$(du -h "${output_file}" | cut -f1)

    log_backup_status "INFO" "Compression and encryption completed. Original: ${original_size}, Encrypted: ${encrypted_size}, Duration: ${duration}s"
    return 0
}

# Clean up old backups
cleanup_old_backups() {
    log_backup_status "INFO" "Starting cleanup of old backups"

    local count=0
    while IFS= read -r backup; do
        if [[ -f "${backup}" ]] && [[ -f "${backup}.sha256" ]]; then
            rm -f "${backup}" "${backup}.sha256"
            ((count++))
        fi
    done < <(find "${BACKUP_DIR}" -name "*.gpg" -mtime +"${RETENTION_DAYS}" -type f)

    log_backup_status "INFO" "Cleaned up ${count} old backup(s)"
}

# Main backup procedure
main() {
    local backup_file="${BACKUP_DIR}/linkedin_profiles_${TIMESTAMP}.backup"
    local encrypted_file="${backup_file}.gpg"

    log_backup_status "INFO" "Starting backup process in ${RAILWAY_ENV} environment"

    # Check dependencies and configuration
    if ! check_dependencies; then
        log_backup_status "ERROR" "Dependency check failed"
        exit 1
    fi

    # Create backup
    if ! create_backup "${backup_file}"; then
        log_backup_status "ERROR" "Backup creation failed"
        exit 1
    fi

    # Compress and encrypt backup
    if ! compress_and_encrypt_backup "${backup_file}" "${encrypted_file}"; then
        log_backup_status "ERROR" "Backup compression/encryption failed"
        exit 1
    fi

    # Clean up old backups
    cleanup_old_backups

    log_backup_status "INFO" "Backup process completed successfully"
    exit 0
}

# Execute main function
main