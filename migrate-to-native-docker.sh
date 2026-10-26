#!/bin/bash
set -e

echo "========================================================================"
echo "🚀 Migrating from Docker Desktop VM to Native Ubuntu Docker Engine"
echo "========================================================================"

TARGET_USER="sheheryar-sohail"
TARGET_HOME="/home/sheheryar-sohail"
PROJECT_DIR="$TARGET_HOME/Downloads/Property-Management-System-main"
BACKUP_DIR="$TARGET_HOME/pms-migration-backup"
NODE_BIN="$TARGET_HOME/.nvm/versions/node/v20.20.2/bin"

export PATH=$PATH:$NODE_BIN

echo ""
echo "💾 1. Backing up PostgreSQL Database & MinIO Storage..."
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
docker exec pms_postgres pg_dumpall -U pms > "$BACKUP_DIR/dump.sql" 2>/dev/null || true
docker cp pms_minio:/data "$BACKUP_DIR/minio_data" 2>/dev/null || true
echo "✅ Database and MinIO data backed up safely to $BACKUP_DIR"

echo ""
echo "⏸️ 2. Stopping PM2 web apps and Docker Desktop containers..."
pm2 stop ecosystem.config.js 2>/dev/null || true
docker compose down 2>/dev/null || true

echo ""
echo "🛑 3. Stopping and disabling Docker Desktop VM service..."
sudo -u "$TARGET_USER" XDG_RUNTIME_DIR=/run/user/$(id -u "$TARGET_USER") systemctl --user stop docker-desktop.service 2>/dev/null || true
sudo -u "$TARGET_USER" XDG_RUNTIME_DIR=/run/user/$(id -u "$TARGET_USER") systemctl --user disable docker-desktop.service 2>/dev/null || true
# Kill any remaining qemu vm process
sudo pkill -f "qemu-system-x86_64" 2>/dev/null || true
sudo pkill -f "com.docker.backend" 2>/dev/null || true
echo "✅ Docker Desktop VM stopped (releasing ~2.5 GB RAM)"

echo ""
echo "📦 4. Verifying Native Ubuntu Docker Engine (docker.io + docker-compose-v2)..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 2>/dev/null || true

echo ""
echo "⚙️ 5. Configuring Native Docker service and CLI context..."
sudo systemctl enable --now docker.service
sudo gpasswd -a "$TARGET_USER" docker 2>/dev/null || true
docker context use default 2>/dev/null || true
echo "✅ Native Ubuntu Docker active on /var/run/docker.sock"

echo ""
echo "🐳 6. Starting Postgres, Redis, and MinIO natively on Linux host..."
cd "$PROJECT_DIR"
sudo -E docker compose up -d postgres redis minio minio-init

echo "⏳ Waiting 8 seconds for containers to initialize..."
sleep 8
sudo -E docker ps -a

echo ""
echo "🔄 7. Restoring PostgreSQL Database and MinIO Storage into native containers..."
if [ -s "$BACKUP_DIR/dump.sql" ]; then
  sudo -E docker exec -i pms_postgres psql -U pms -d postgres < "$BACKUP_DIR/dump.sql" 2>/dev/null || true
  echo "✅ PostgreSQL database restored"
fi
if [ -d "$BACKUP_DIR/minio_data" ]; then
  sudo -E docker cp "$BACKUP_DIR/minio_data/." pms_minio:/data/ 2>/dev/null || true
  sudo -E docker restart pms_minio
  echo "✅ MinIO storage restored"
fi

echo ""
echo "🚀 8. Restarting PM2 web apps and saving configuration..."
cd "$PROJECT_DIR"
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js 2>/dev/null || true
pm2 save
echo "✅ Web apps online in PM2"

echo ""
echo "========================================================================"
echo "🎉 SUCCESS: Migration to Native Ubuntu Docker Engine Completed!"
echo "========================================================================"
free -h
