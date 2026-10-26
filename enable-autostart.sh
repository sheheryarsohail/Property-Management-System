#!/bin/bash
set -e

echo "========================================================================"
echo "⚡ Enabling Automatic Startup on Server Reboot / Turn On"
echo "========================================================================"

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

# 0. Make sure PM2 apps are running before saving!
echo "🚀 0. Starting web applications in PM2..."
cd /home/sheheryar-sohail/Downloads/Property-Management-System-main
pm2 start ecosystem.config.js 2>/dev/null || true
pm2 save
echo "✅ Apps saved to PM2 dump file"

# 1. Enable Docker daemon to start on boot
echo "🐳 1. Enabling Docker systemd service..."
sudo -n systemctl enable docker 2>/dev/null || echo "⚠️ Run: sudo ./setup-system-autostart-and-autologin.sh"

# 2. Enable Cloudflare Tunnel to start on boot
echo "🌐 2. Enabling Cloudflare Tunnel (cloudflared) service..."
sudo -n systemctl enable cloudflared 2>/dev/null || echo "⚠️ Run: sudo ./setup-system-autostart-and-autologin.sh"

# 3. Save PM2 processes and configure PM2 startup hook
echo "⚡ 3. Configuring PM2 systemd autostart..."
STARTUP_CMD=$(pm2 startup | grep -E "^sudo env PATH=" | tail -1)
if [ -n "$STARTUP_CMD" ]; then
  echo "Running PM2 startup hook: $STARTUP_CMD"
  sudo -n bash -c "$STARTUP_CMD" 2>/dev/null || echo "⚠️ To install systemd autostart, run: sudo ./setup-system-autostart-and-autologin.sh"
fi

pm2 save

echo "========================================================================"
echo "🎉 SUCCESS: PM2 app list saved!"
echo "To enable passwordless server turn-on and systemd autostart, run:"
echo "   sudo ./setup-system-autostart-and-autologin.sh"
echo "========================================================================"
