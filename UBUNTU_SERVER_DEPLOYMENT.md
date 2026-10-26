# 🚀 Ubuntu Server Deployment & Production Setup Guide
**Property Management System (PMS)**

> A complete, beginner-friendly, step-by-step deployment guide for running the Property Management System on an Ubuntu Server with a Custom Domain, **Dynamic IP (No Static IP required)** via Cloudflare Tunnel, PM2 process management, and automated Google Drive backups.

---

## 🌐 Dynamic IP Overview: How to Host on a Custom Domain Without a Static IP

Normally, running a web server requires a paid **Static IP** from your internet service provider (ISP). With a **Dynamic IP** (common for home & office internet), your IP address changes periodically, which breaks standard domain DNS records.

### The Solution: Cloudflare Tunnel (100% Free & Secure)
Instead of buying a static IP or opening router ports, we use **Cloudflare Tunnel (`cloudflared`)**:
* ✅ **No Static IP Needed:** Your server opens a secure outbound encrypted connection to Cloudflare. If your ISP changes your IP, the tunnel stays connected with zero downtime.
* ✅ **No Router Port Forwarding Needed:** Works behind firewalls and CGNAT (Carrier-Grade NAT).
* ✅ **Free SSL Certificates:** Automatically provisions and renews HTTPS (`https://www.yourdomain.com`).
* ✅ **DDoS Protection & Hides Server IP:** Protects your server against cyberattacks by concealing your actual IP address.

---

## 📌 Interactive Deployment Checklist

- [ ] **Phase 1:** Update Ubuntu & Install Base Utilities
- [ ] **Phase 2:** Clone Repository & Setup `.env` Files
- [ ] **Phase 3:** Start Database & Storage Containers (PostgreSQL, Redis, MinIO)
- [ ] **Phase 4:** Run Prisma Database Migrations & Seed Default Data
- [ ] **Phase 5:** Build Production Bundles (`@pms/api`, `@pms/worker`, `@pms/web`)
- [ ] **Phase 6:** Setup PM2 Process Manager & Reboot Autostart
- [ ] **Phase 7:** Link Custom Domain & Dynamic IP via Cloudflare Tunnel
- [ ] **Phase 8:** Enable Nightly Automated Google Drive Backups (7-Day Retention)
- [ ] **Phase 9:** Setup 1-Click Code Update Script (`update-live.sh`)

---

## 🛠️ Phase 1: Server Preparation & System Installation

### Step 1.1: Update System Packages
Open terminal on your Ubuntu server and run:

```bash
# Update repository package list and upgrade installed packages
sudo apt update && sudo apt upgrade -y

# Install essential command-line tools
sudo apt install -y curl git build-essential ca-certificates rclone ufw jq lsof
```

---

### Step 1.2: Install Docker & Docker Compose
```bash
# Install Docker engine and Docker Compose v2 plugin
sudo apt install -y docker.io docker-compose-v2

# Start Docker daemon and enable it on boot
sudo systemctl enable --now docker

# Add your current user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER

# Apply group changes immediately to current terminal session
newgrp docker
```

> [!TIP]
> **Verification:** Run `docker --version` and `docker compose version` to ensure Docker is installed properly.

---

### Step 1.3: Install Node.js 20 LTS, PNPM, and PM2
```bash
# Add NodeSource Node.js 20 LTS repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify Node.js installation (Must show v20.x.x)
node -v
npm -v

# Install PNPM (Package Manager) and PM2 (Process Manager) globally
sudo npm install -g pnpm pm2
```

---

### Step 1.4: Configure Server Firewall (UFW)
```bash
# Allow SSH access
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable
sudo ufw status
```

---

## 📂 Phase 2: Repository Cloning & Environment Setup

### Step 2.1: Clone Project Repository
Clone the codebase into your home folder (`~/pms`):

```bash
cd ~
git clone <YOUR_GIT_REPOSITORY_URL> pms
cd ~/pms
```

---

### Step 2.2: Create Environment (`.env`) Files

The system requires environment configuration files for the root workspace, API, Web app, and Worker.

#### 1️⃣ Root Workspace Environment File (`~/pms/.env`)
Run:
```bash
nano ~/pms/.env
```
Paste:
```env
# Database Connection
DATABASE_URL="postgresql://pms:pms@127.0.0.1:5432/pms?schema=public"

# Tenant & API Security
DEFAULT_TENANT_ID="t_local"
API_KEY="dev-key-local"
JWT_SECRET="super-secret-jwt-key-change-this-in-production-12345"

# Redis Cache & Queue
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

# MinIO S3 File Storage
STORAGE_MODE="s3"
S3_ENDPOINT="http://127.0.0.1:9000"
S3_BUCKET="pms-dev"
S3_ACCESS_KEY_ID="pms"
S3_SECRET_ACCESS_KEY="pms12345"
S3_REGION="us-east-1"
S3_FORCE_PATH_STYLE="true"

# Branding
BRAND_NAME="PMS"
BRAND_SUBTITLE="Property Management System"
```
*(Press `Ctrl + O`, `Enter` to save, and `Ctrl + X` to exit nano)*

---

#### 2️⃣ Backend API Environment File (`~/pms/apps/api/.env`)
Run:
```bash
nano ~/pms/apps/api/.env
```
Paste *(Replace `yourdomain.com` with your actual purchased domain name)*:
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL="postgresql://pms:pms@127.0.0.1:5432/pms?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
CORS_ORIGIN="https://www.yourdomain.com,https://yourdomain.com,http://localhost:3002"
JWT_SECRET="super-secret-jwt-key-change-this-in-production-12345"
```

---

#### 3️⃣ Web Frontend Environment File (`~/pms/apps/web/.env.production`)
Run:
```bash
nano ~/pms/apps/web/.env.production
```
Paste *(Replace `yourdomain.com` with your actual purchased domain name)*:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=dev-key-local
NEXT_PUBLIC_TENANT_ID=t_local
```

---

#### 4️⃣ Background Worker Environment File (`~/pms/apps/worker/.env`)
Run:
```bash
nano ~/pms/apps/worker/.env
```
Paste:
```env
NODE_ENV=production
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
DATABASE_URL="postgresql://pms:pms@127.0.0.1:5432/pms?schema=public"
CONCURRENCY_PDF=4
LOG_LEVEL=info
```

---

## 🐳 Phase 3: Launching Databases & Storage

### Step 3.1: Start Docker Infrastructure Containers
Launch PostgreSQL 16, Redis 7, and MinIO S3 storage:

```bash
cd ~/pms
docker compose up -d postgres redis minio minio-init
```

---

### Step 3.2: Verify Container Health Status
```bash
docker compose ps
```

> [!NOTE]
> **Expected Output:** All 3 containers should display `Up` or `running (healthy)`:
> - `pms_postgres` (Port 5432)
> - `pms_redis` (Port 6379)
> - `pms_minio` (Ports 9000 & 9001)

---

## 🗄️ Phase 4: Database Migrations & Seeding

### Step 4.1: Install Node Dependencies
```bash
cd ~/pms
pnpm install
```

### Step 4.2: Generate Prisma Client
```bash
pnpm run prisma:generate
```

### Step 4.3: Apply Database Migrations
```bash
pnpm --filter @pms/api prisma:migrate
```

### Step 4.4: Seed Default Admin User & Roles
```bash
pnpm --filter @pms/api prisma:seed
```

> [!IMPORTANT]
> **Default Account Credentials:**
> - **Email:** `admin@local.dev`
> - **Password:** `dummy`

---

## 🏗️ Phase 5: Production Building

Building production artifacts compiles TypeScript to optimized JavaScript, reducing RAM usage by ~50%.

```bash
cd ~/pms

# 1. Build NestJS Backend API
pnpm --filter @pms/api build

# 2. Build NestJS Background Worker
pnpm --filter @pms/worker build

# 3. Build Next.js Web Application
pnpm --filter @pms/web build
```

---

## ⚡ Phase 6: PM2 Process Management & Service Autostart

PM2 handles background process execution, automatic crash recovery, and reboot persistence.

### Step 6.1: Create PM2 Configuration File (`ecosystem.config.js`)
Run:
```bash
nano ~/pms/ecosystem.config.js
```

Paste the dynamic configuration below:
```javascript
const path = require('path');
const rootDir = __dirname;

module.exports = {
  apps: [
    {
      name: "pms-api",
      script: "apps/api/dist/main.js",
      cwd: rootDir,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0",
      },
      max_memory_restart: "500M"
    },
    {
      name: "pms-worker",
      script: "apps/worker/dist/main.js",
      cwd: rootDir,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "400M"
    },
    {
      name: "pms-web",
      script: "node_modules/next/dist/bin/next",
      args: "start apps/web -p 3002",
      cwd: rootDir,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      },
      max_memory_restart: "600M"
    }
  ]
};
```

---

### Step 6.2: Start Services & Verify Status
```bash
cd ~/pms
pm2 start ecosystem.config.js
pm2 status
```

---

### Step 6.3: Enable Auto-Start on Reboot & Passwordless Turn-On

To automatically configure your Ubuntu server so that it turns on **without asking for a login password**, and **automatically starts all web app services (PM2, Docker, and Cloudflare Tunnel)** without any manual intervention, run our automated 1-click setup script:

```bash
cd ~/Downloads/Property-Management-System-main
chmod +x setup-system-autostart-and-autologin.sh
sudo ./setup-system-autostart-and-autologin.sh
```

**What this script configures automatically:**
1. ✅ **Passwordless Server Turn-On:** Adds your user account to Ubuntu's `nopasswdlogin` group and enables GDM3 Automatic Login so you are logged into Desktop without typing a password.
2. ✅ **No Sleep / Screen Lock Password:** Disables GNOME screen lock and screensaver passwords so waking the server never prompts for a password.
3. ✅ **Sudo NOPASSWD:** Configures passwordless `sudo` so automated background tasks and startup scripts never fail or hang waiting for password input.
4. ✅ **PM2 Systemd Autostart:** Installs the PM2 systemd autostart service (`pm2-sheheryar-sohail.service`) and saves `pms-api`, `pms-worker`, and `pms-web` into `~/.pm2/dump.pm2`.
5. ✅ **Docker & Cloudflared Autostart:** Enables systemd services for Docker (`postgres`, `redis`, `minio`) and Cloudflare Tunnel (`cloudflared`) so they start on system boot.

---

## 🌐 Phase 7: Dynamic IP Custom Domain Setup (Step-by-Step)

Follow these steps to connect your domain (e.g. `yourdomain.com`) to your server without needing a static IP address.

### Step 7.1: Add Domain to Cloudflare (Free DNS & Proxy)
1. Sign up for a free account at **[Cloudflare.com](https://dash.cloudflare.com)**.
2. Click **Add a site**, enter your domain name (e.g., `yourdomain.com`), and choose the **Free** plan.
3. Cloudflare will scan existing records and provide you with **2 Cloudflare Nameservers** (e.g., `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`).

---

### Step 7.2: Update Nameservers at Your Domain Registrar
1. Log into the account where you purchased your domain name (Namecheap, GoDaddy, Hostinger, Porkbun, Google Domains, etc.).
2. Go to **DNS / Nameservers** settings for `yourdomain.com`.
3. Change Nameserver mode to **Custom DNS / Custom Nameservers**.
4. Paste the 2 Cloudflare Nameservers and click **Save**.
*(Note: DNS propagation usually completes within 5 to 15 minutes).*

---

### Step 7.3: Create Cloudflare Tunnel
1. In Cloudflare Dashboard, go to **Zero Trust** on the left menu.
2. Navigate to **Networks** -> **Tunnels** -> click **Create a Tunnel**.
3. Select **Cloudflared** as connector -> Click **Next**.
4. Name your tunnel: `pms-ubuntu-server` -> Click **Save tunnel**.

---

### Step 7.4: Install `cloudflared` Daemon on Ubuntu Server
Under **Choose an environment**, select **Debian / Ubuntu**.
Copy the command provided or run:

```bash
# Download cloudflared Debian package
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install package
sudo dpkg -i cloudflared.deb

# Install and run cloudflared system service with your unique tunnel token
sudo cloudflared service install <PASTE_YOUR_CLOUDFLARED_TOKEN_FROM_DASHBOARD>
```

Verify service is running:
```bash
sudo systemctl status cloudflared
```

---

### Step 7.5: Configure Domain Routing (Public Hostnames)
In the Cloudflare Tunnel dashboard, go to the **Public Hostname** tab and click **Add a public hostname** for each service:

#### Entry 1: Web App Frontend (`www.yourdomain.com`)
- **Subdomain:** `www`
- **Domain:** `yourdomain.com`
- **Type:** `HTTP`
- **URL:** `localhost:3002`

#### Entry 2: Web App Root Domain (`yourdomain.com`)
- **Subdomain:** *(Leave Blank or `@`)*
- **Domain:** `yourdomain.com`
- **Type:** `HTTP`
- **URL:** `localhost:3002`

#### Entry 3: Backend API Server (`api.yourdomain.com`)
- **Subdomain:** `api`
- **Domain:** `yourdomain.com`
- **Type:** `HTTP`
- **URL:** `localhost:3001`

#### Entry 4: MinIO S3 Object Storage (`storage.yourdomain.com` - Optional)
- **Subdomain:** `storage`
- **Domain:** `yourdomain.com`
- **Type:** `HTTP`
- **URL:** `localhost:9000`

Click **Save Hostname** for each route.

🎉 **Congratulations!** Your app is now live on `https://www.yourdomain.com` with free SSL encryption and automatic protection against dynamic IP changes!

---

## ☁️ Phase 8: Automated Nightly Backups to Google Drive

Automatically backup your PostgreSQL database to Google Drive every night with 7-day retention.

### Step 8.1: Authenticate Google Drive via `rclone`
Run configuration tool:
```bash
rclone config
```

Follow prompts:
1. Type `n` for **New remote**.
2. Name: `gdrive`
3. Select **Google Drive** from provider list.
4. Leave Client ID / Secret blank (press `Enter`).
5. Access Scope: Select `1` (Full access).
6. Auto-config: Select `N` (for headless server), copy authorization link to browser, sign in, and paste verification code back in terminal.

Verify Google Drive access:
```bash
rclone lsd gdrive:
```

---

### Step 8.2: Create Backup Script (`~/pms/backup-to-gdrive.sh`)
Create script file:
```bash
nano ~/pms/backup-to-gdrive.sh
```

Paste code:
```bash
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
echo "[$(date)] 🚀 Starting Daily Database Backup..."
echo "=========================================================="

# 1. Create local temp backup directory
mkdir -p "$BACKUP_DIR"

# 2. Export and compress PostgreSQL database
BACKUP_FILE="$BACKUP_DIR/pms_backup_$TIMESTAMP.sql.gz"
echo "📦 Dumping database from container '$DB_CONTAINER'..."
docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
echo "✅ Local dump created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# 3. Upload backup file to Google Drive
echo "☁️ Uploading to Google Drive ($GDRIVE_REMOTE)..."
rclone copy "$BACKUP_FILE" "$GDRIVE_REMOTE"
echo "✅ Google Drive upload complete!"

# 4. Prune Google Drive backups older than 7 days
echo "🧹 Pruning Google Drive backups older than $RETENTION_DAYS days..."
rclone delete --min-age "${RETENTION_DAYS}d" "$GDRIVE_REMOTE"
echo "✅ Cloud cleanup complete!"

# 5. Prune local temp files older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;
echo "✅ Local cleanup complete!"

echo "=========================================================="
echo "[$(date)] 🎉 Nightly backup process finished successfully!"
echo "=========================================================="
```

Make executable:
```bash
chmod +x ~/pms/backup-to-gdrive.sh
```

Test manually:
```bash
~/pms/backup-to-gdrive.sh
```

---

### Step 8.3: Schedule Cron Job (Daily @ 2:00 AM)
Open crontab:
```bash
crontab -e
```

Add line to bottom:
```cron
0 2 * * * $HOME/pms/backup-to-gdrive.sh >> $HOME/pms/backup.log 2>&1
```

---

### Step 8.4: Database Restore Guide
If you ever need to restore from a Google Drive backup:

```bash
# 1. Download backup file from Google Drive
rclone copy gdrive:PMS_Backups/pms_backup_2026-08-03_02-00-00.sql.gz ~/

# 2. Restore database into Docker Postgres container
gunzip -c ~/pms_backup_2026-08-03_02-00-00.sql.gz | docker exec -i pms_postgres psql -U pms -d pms

# 3. Restart API service
pm2 restart pms-api
```

---

## 🔄 Phase 9: 1-Click Code Update Script

Automate pulling latest changes from Git and re-deploying on your server.

### Step 9.1: Create Update Script (`~/pms/update-live.sh`)
Run:
```bash
nano ~/pms/update-live.sh
```

Paste:
```bash
#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Starting 1-Click Production Deployment"
echo "=========================================================="

cd "$HOME/pms"

echo "📥 1. Pulling latest code from Git..."
git pull origin main

echo "📦 2. Installing dependencies..."
pnpm install

echo "🗄️ 3. Running Prisma migrations..."
pnpm --filter @pms/api prisma:migrate

echo "🏗️ 4. Building Backend API & Web App..."
pnpm --filter @pms/api build
pnpm --filter @pms/worker build
pnpm --filter @pms/web build

echo "🔄 5. Restarting PM2 process manager..."
pm2 restart ecosystem.config.js

echo "=========================================================="
echo "✅ Production Deployment Complete!"
echo "=========================================================="
```

Make executable:
```bash
chmod +x ~/pms/update-live.sh
```

### Step 9.2: Running Updates
Whenever you push code changes from your development laptop to GitHub, run this command on your server:

```bash
cd ~/pms && ./update-live.sh
```

---

## 🛠️ Phase 10: Maintenance & Useful Commands

| Task | Command |
| :--- | :--- |
| **Check PM2 Live App Logs** | `pm2 logs` or `pm2 logs pms-api` |
| **Check PM2 Application Status** | `pm2 status` |
| **Restart All Node Apps** | `pm2 restart ecosystem.config.js` |
| **Check Docker Container Health** | `docker compose ps` |
| **View Postgres Logs** | `docker compose logs -f postgres` |
| **Check Cloudflare Tunnel Status** | `sudo systemctl status cloudflared` |
| **Run Manual Cloud Backup** | `~/pms/backup-to-gdrive.sh` |
| **View Daily Backup Log** | `cat ~/pms/backup.log` |
| **Check RAM & Disk Usage** | `free -h && df -h` |

---
*Document Version: 4.0 — Complete Dynamic IP & Custom Domain Ubuntu Deployment Guide*
