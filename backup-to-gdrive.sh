#!/bin/bash
set -e

# Configuration
BACKUP_DIR="$HOME/pms-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DB_CONTAINER="pms_postgres"
DB_USER="pms"
DB_NAME="pms"
GDRIVE_REMOTE="gdrive:PMS_Backups"
RETENTION_DAYS=7

echo "=========================================================="
echo "[$(date)] 🚀 Starting Daily Database Backup to Google Drive..."
echo "=========================================================="

# Check if rclone remote 'gdrive' exists
if ! rclone listremotes 2>/dev/null | grep -q "^gdrive:$"; then
  echo "❌ Error: 'gdrive' remote is not configured in rclone yet."
  echo "👉 Run './setup-gdrive-auth.sh' or 'rclone config' first to link your Google Drive account."
  exit 1
fi

# 1. Create local backup directory
mkdir -p "$BACKUP_DIR"

# 2. Export and compress PostgreSQL database
BACKUP_FILE="$BACKUP_DIR/pms_backup_$TIMESTAMP.sql.gz"
echo "📦 Dumping PostgreSQL database from container '$DB_CONTAINER'..."
sudo -n docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
echo "✅ Local database dump created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# 3. Upload backup file to Google Drive
echo "☁️ Uploading backup to Google Drive ($GDRIVE_REMOTE)..."
rclone copy "$BACKUP_FILE" "$GDRIVE_REMOTE"
echo "✅ Google Drive upload complete!"

# 4. Prune Google Drive backups older than 7 days
echo "🧹 Pruning Google Drive backups older than $RETENTION_DAYS days..."
rclone delete --min-age "${RETENTION_DAYS}d" "$GDRIVE_REMOTE" 2>/dev/null || true
echo "✅ Cloud cleanup complete!"

# 5. Prune local backup files older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;
echo "✅ Local cleanup complete!"

echo "=========================================================="
echo "[$(date)] 🎉 Nightly backup process finished successfully!"
echo "=========================================================="
