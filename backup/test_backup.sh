#!/bin/sh

echo "Setting up test environment..."

# Setup mock AWS CLI
mkdir -p /tmp/mock_bin
cat << 'EOF' > /tmp/mock_bin/aws
#!/bin/sh
if [ "$1" = "s3" ] && [ "$2" = "cp" ]; then
  echo "Mock upload $3 to $4"
  echo "$4" >> /tmp/mock_s3_uploads.txt
elif [ "$1" = "s3" ] && [ "$2" = "ls" ]; then
  # Return some fake files
  echo "2023-01-01 12:00:00 1234 vaccichain_20200101_000000.db"
  echo "2023-01-01 12:00:00 1234 vaccichain_20230101_000000.db"
  echo "2023-01-01 12:00:00 1234 vaccichain_20990101_000000.db"
elif [ "$1" = "s3" ] && [ "$2" = "rm" ]; then
  echo "Mock delete $3"
  echo "$3" >> /tmp/mock_s3_deletes.txt
fi
EOF
chmod +x /tmp/mock_bin/aws

# Ensure we use our mock `aws`
export PATH="/tmp/mock_bin:$PATH"

# Set necessary environment variables
export S3_BUCKET_NAME="my-test-bucket"
export RETENTION_DAYS=30

# Create dummy DB file
mkdir -p /tmp/data
touch /tmp/data/vaccichain.db
export DB_FILE_PATH="/tmp/data/vaccichain.db"

echo "Running backup.sh..."
# Run the script
./backup.sh

# Verify
echo "Asserting deletions..."
if grep -q "vaccichain_20200101_000000.db" /tmp/mock_s3_deletes.txt && grep -q "vaccichain_20230101_000000.db" /tmp/mock_s3_deletes.txt; then
  echo "✅ Old files deleted successfully."
else
  echo "❌ Test failed: old files were not deleted."
  exit 1
fi

if grep -q "vaccichain_20990101_000000.db" /tmp/mock_s3_deletes.txt; then
  echo "❌ Test failed: new file was deleted incorrectly."
  exit 1
else
  echo "✅ New file correctly retained."
fi

# Cleanup
rm -rf /tmp/mock_bin /tmp/data /tmp/mock_s3_deletes.txt /tmp/mock_s3_uploads.txt
echo "✅ All tests passed successfully!"
