#!/bin/bash
set -e

echo "========================================================================"
echo "🌐 Step 7.4: Installing & Connecting Cloudflare Tunnel (cloudflared)"
echo "Domain: ssestateandmarketing.com"
echo "========================================================================"

echo "📥 1. Downloading latest Cloudflare Tunnel Debian package..."
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

echo "📦 2. Installing cloudflared package..."
sudo dpkg -i cloudflared.deb
rm -f cloudflared.deb

echo "🔐 3. Installing cloudflared systemd service with your tunnel token..."
# If an older service exists, uninstall it first cleanly
sudo cloudflared service uninstall 2>/dev/null || true

sudo cloudflared service install "eyJhIjoiMTc5OGQwZjJmZjM2OWU5M2ZiOWEyMWM4ZTM0OTU5YjYiLCJ0IjoiYWMwMTVhNzAtNjIzNi00MjI0LWFiYmEtMjczNWM2NWQwMWNkIiwicyI6Ik1ESmtObU0zTnpVdE5qUTFOQzAwTVRNMkxXRmxOMkV0T1RVeU16VmtZV1pqWlRaaiJ9"

echo "⏳ 4. Checking cloudflared service status..."
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager || true

echo "========================================================================"
echo "🎉 Cloudflare Tunnel connected successfully!"
echo "Your server is now linked to Cloudflare Zero Trust."
echo "========================================================================"
