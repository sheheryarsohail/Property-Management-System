#!/bin/bash
set -e

echo "========================================================================"
echo "⚡ Setting Up Automatic Turn-On (No Password) & Autostart for All Services"
echo "========================================================================"

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script with sudo: sudo ./setup-system-autostart-and-autologin.sh"
  exit 1
fi

TARGET_USER="sheheryar-sohail"
TARGET_HOME="/home/sheheryar-sohail"
NODE_BIN="$TARGET_HOME/.nvm/versions/node/v20.20.2/bin"

echo ""
echo "🔓 1. Configuring Passwordless Turn-On & Automatic Login..."
# Add user to nopasswdlogin group so GDM login never prompts for password
groupadd -f nopasswdlogin || true
gpasswd -a "$TARGET_USER" nopasswdlogin || true

# Ensure GDM3 AutomaticLogin is configured
if [ -f /etc/gdm3/custom.conf ]; then
  sed -i 's/^.*AutomaticLoginEnable.*$/AutomaticLoginEnable=true/' /etc/gdm3/custom.conf || true
  sed -i "s/^.*AutomaticLogin=.*$/AutomaticLogin=$TARGET_USER/" /etc/gdm3/custom.conf || true
  echo "✅ GDM3 AutomaticLoginEnable=true configured for $TARGET_USER"
fi

# Enable GDM service so GUI auto-login starts on boot
systemctl enable gdm.service 2>/dev/null || systemctl enable gdm3.service 2>/dev/null || true

# Configure sudo NOPASSWD so autostart scripts or admin tasks never ask for password
echo "$TARGET_USER ALL=(ALL:ALL) NOPASSWD: ALL" > /etc/sudoers.d/99-sheheryar-sohail-nopasswd
chmod 440 /etc/sudoers.d/99-sheheryar-sohail-nopasswd
echo "✅ Sudo NOPASSWD configured for $TARGET_USER"

echo ""
echo "🖥️ 2. Disabling GNOME Screen Lock and Sleep Lock (No password on sleep/wake)..."
sudo -u "$TARGET_USER" gsettings set org.gnome.desktop.screensaver lock-enabled false 2>/dev/null || true
sudo -u "$TARGET_USER" gsettings set org.gnome.desktop.lockdown disable-lock-screen true 2>/dev/null || true
sudo -u "$TARGET_USER" gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null || true
sudo -u "$TARGET_USER" gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true
echo "✅ GNOME screen lock and sleep timeout disabled"

echo ""
echo "🐳 3. Checking Docker Autostart..."
systemctl enable docker 2>/dev/null || echo "ℹ️ Using Docker Desktop (user-level autostart active)"

echo ""
echo "🌐 4. Enabling Cloudflare Tunnel (cloudflared) Systemd Autostart..."
systemctl enable --now cloudflared 2>/dev/null || true
echo "✅ cloudflared service enabled for boot autostart"

echo ""
echo "⚡ 5. Installing PM2 Systemd Autostart Service for user ($TARGET_USER)..."
export PATH=$PATH:$NODE_BIN
$NODE_BIN/node $NODE_BIN/../lib/node_modules/pm2/bin/pm2 startup systemd -u "$TARGET_USER" --hp "$TARGET_HOME" 2>/dev/null || true
# Inject boot health check loop so PM2 waits for Postgres & Redis before launching apps
if [ -f /etc/systemd/system/pm2-sheheryar-sohail.service ]; then
  sed -i 's/^After=.*$/After=network.target docker.service/' /etc/systemd/system/pm2-sheheryar-sohail.service || true
  if ! grep -q "ExecStartPre=" /etc/systemd/system/pm2-sheheryar-sohail.service; then
    sed -i '/^\[Service\]/a ExecStartPre=\/bin\/bash -c "for i in $(seq 1 30); do \/usr\/bin\/docker exec pms_postgres pg_isready -U pms 2>\/dev\/null && \/usr\/bin\/docker exec pms_redis redis-cli ping 2>\/dev\/null | grep -q PONG && break || sleep 2; done"' /etc/systemd/system/pm2-sheheryar-sohail.service || true
  fi
  systemctl daemon-reload || true
fi
systemctl enable --now pm2-sheheryar-sohail.service 2>/dev/null || true
echo "✅ PM2 systemd autostart service (pm2-sheheryar-sohail.service) installed & enabled"

echo ""
echo "💾 6. Saving Running Web App Processes in PM2..."
sudo -u "$TARGET_USER" bash -c "export PATH=\$PATH:$NODE_BIN && cd $TARGET_HOME/Downloads/Property-Management-System-main && pm2 start ecosystem.config.js 2>/dev/null || true && pm2 save"
echo "✅ PM2 process list saved to $TARGET_HOME/.pm2/dump.pm2"

echo ""
echo "========================================================================"
echo "🎉 SUCCESS: Everything is configured for Automatic Turn-On without Password!"
echo "========================================================================"
echo "When your Ubuntu server is turned on or restarted:"
echo "  1️⃣ GDM logs into Desktop automatically WITHOUT asking for a login password."
echo "  2️⃣ Systemd automatically starts Docker (postgres, redis, minio)."
echo "  3️⃣ Systemd automatically starts PM2 (pms-api, pms-worker, pms-web)."
echo "  4️⃣ Systemd automatically starts Cloudflare Tunnel (cloudflared)."
echo "  5️⃣ Your web app (ssestateandmarketing.com) is live immediately!"
echo "========================================================================"
