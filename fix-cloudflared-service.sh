#!/bin/bash
set -e

echo "========================================================================"
echo "🔧 Configuring Cloudflare Tunnel for IPv4 & HTTP/2 (ISP Fix)"
echo "Domain: ssestateandmarketing.com"
echo "========================================================================"

SERVICE_FILE="/etc/systemd/system/cloudflared.service"
if [ -f "$SERVICE_FILE" ]; then
  echo "Updating $SERVICE_FILE with --edge-ip-version 4 --no-prechecks --protocol http2..."
  # Remove existing custom flags if any, then add cleanly
  sed -i 's|--edge-ip-version 4 ||g; s|--no-prechecks ||g; s|--protocol http2 ||g; s|--protocol quic ||g' "$SERVICE_FILE"
  sed -i 's|/usr/bin/cloudflared --no-autoupdate tunnel run|/usr/bin/cloudflared --edge-ip-version 4 --no-autoupdate --no-prechecks tunnel run --protocol http2|g' "$SERVICE_FILE"
  
  systemctl daemon-reload
  systemctl enable --now cloudflared
  systemctl restart cloudflared
  echo "✅ cloudflared service updated and restarted successfully!"
else
  echo "❌ $SERVICE_FILE not found. Please install cloudflared service first."
  exit 1
fi
