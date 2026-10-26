#!/bin/bash
set -e

echo "========================================================================"
echo "🌐 Installing & Connecting Cloudflare Tunnel (cloudflared)"
echo "Domain: ssestateandmarketing.com"
echo "========================================================================"

DEB_PATH="/home/sheheryar-sohail/Downloads/Property-Management-System-main/cloudflared.deb"
if [ ! -f "$DEB_PATH" ]; then
  echo "Downloading cloudflared.deb..."
  curl -L --output "$DEB_PATH" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
fi

echo "📦 Installing cloudflared package..."
dpkg -i "$DEB_PATH"

echo "🔐 Registering cloudflared tunnel service..."
cloudflared service uninstall 2>/dev/null || true
cloudflared service install "eyJhIjoiMTc5OGQwZjJmZjM2OWU5M2ZiOWEyMWM4ZTM0OTU5YjYiLCJ0IjoiYWMwMTVhNzAtNjIzNi00MjI0LWFiYmEtMjczNWM2NWQwMWNkIiwicyI6Ik1ESmtObU0zTnpVdE5qUTFOQzAwTVRNMkxXRmxOMkV0T1RVeU16VmtZV1pqWlRaaiJ9"

echo "⏳ Enabling cloudflared on system startup..."
systemctl enable --now cloudflared

echo "✅ Cloudflare Tunnel is connected and configured to start automatically on boot!"
