#!/bin/bash
set -e

echo "========================================================================"
echo "🌐 Configuring Cloudflare Tunnel Token & Systemd Service"
echo "Domain: ssestateandmarketing.com"
echo "========================================================================"

echo "📁 1. Creating /etc/cloudflared directory and token file..."
mkdir -p /etc/cloudflared
echo -n "eyJhIjoiMTc5OGQwZjJmZjM2OWU5M2ZiOWEyMWM4ZTM0OTU5YjYiLCJ0IjoiYWMwMTVhNzAtNjIzNi00MjI0LWFiYmEtMjczNWM2NWQwMWNkIiwicyI6Ik1ESmtObU0zTnpVdE5qUTFOQzAwTVRNMkxXRmxOMkV0T1RVeU16VmtZV1pqWlRaaiJ9" > /etc/cloudflared/token
chmod 600 /etc/cloudflared/token

echo "⚙️ 2. Writing /etc/systemd/system/cloudflared.service..."
cat << 'EOF' > /etc/systemd/system/cloudflared.service
[Unit]
Description=Cloudflare Tunnel client
After=network-online.target
Wants=network-online.target

[Service]
TimeoutStartSec=15
Type=notify
ExecStart=/usr/bin/cloudflared --edge-ip-version 4 --no-autoupdate tunnel run --protocol http2 --token-file /etc/cloudflared/token
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

echo "🔄 3. Reloading systemd and starting cloudflared..."
systemctl daemon-reload
systemctl enable --now cloudflared
systemctl restart cloudflared
sleep 3
systemctl status cloudflared --no-pager -l || true

echo "========================================================================"
echo "🎉 Cloudflare Tunnel configured permanently with IPv4 & HTTP2!"
echo "========================================================================"
