#!/bin/sh
set -e

# Default variables
DB_FILE=${DB_FILE_PATH:-"/data/vaccichain.db"}
BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/vaccichain_${TIMESTAMP}.db"
S3_BUCKET=${S3_BUCKET_NAME:-""}
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "Starting backup process at $(date)..."

if [ -z "$S3_BUCKET" ]; then
  echo "Error: S3_BUCKET_NAME is not set."
  exit 1
fi

if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file $DB_FILE not found."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# 1. Create a copy of the database
echo "Creating backup of $DB_FILE..."
cp "$DB_FILE" "$BACKUP_FILE"

# 2. Upload to S3
echo "Uploading $BACKUP_FILE to s3://$S3_BUCKET/..."
aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/vaccichain_${TIMESTAMP}.db"

# 3. Clean up old backups on S3 (Retention policy)
# Calculate the cutoff date. We use GNU/Alpine date manipulation.
if date --help 2>&1 | grep -q "BusyBox"; then
  # Alpine/BusyBox date
  CUTOFF_DATE=$(date -d "@$(($(date +%s) - $RETENTION_DAYS * 86400))" +%Y%m%d_%H%M%S)
elif date --help 2>&1 | grep -q "GNU"; then
  # GNU date
  CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d_%H%M%S)
else
  # Fallback for BSD/macOS (not expected in Alpine Docker, but good practice)
  CUTOFF_DATE=$(date -v-${RETENTION_DAYS}d +%Y%m%d_%H%M%S)
fi

echo "Cleaning up backups older than $RETENTION_DAYS days (before vaccichain_${CUTOFF_DATE}.db)..."

# List files in S3 bucket and delete those older than CUTOFF_DATE
# Note: we disable set -e here because if grep finds nothing it will exit with 1
set +e
BACKUP_FILES=$(aws s3 ls "s3://$S3_BUCKET/" | awk '{print $4}' | grep '^vaccichain_.*\.db$')
set -e

if [ -n "$BACKUP_FILES" ]; then
  echo "$BACKUP_FILES" | while read -r filename; do
    # Extract timestamp from filename (vaccichain_YYYYMMDD_HHMMSS.db)
    file_timestamp=$(echo "$filename" | sed -E 's/^vaccichain_([0-9]{8}_[0-9]{6})\.db$/\1/')
    
    if [ "$file_timestamp" \< "$CUTOFF_DATE" ]; then
      echo "Deleting old backup: $filename"
      aws s3 rm "s3://$S3_BUCKET/$filename"
    fi
  done
else
  echo "No existing backups found to clean up."
fi

# Clean up local temp file
rm "$BACKUP_FILE"
echo "Backup process completed successfully."
