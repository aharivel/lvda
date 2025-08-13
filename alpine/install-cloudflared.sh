#!/bin/bash

# Alpine Linux Cloudflared Installation Script
# Run this script on your Alpine VM to install and configure cloudflared

set -e

echo "🌩️ Installing Cloudflared on Alpine Linux..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install cloudflared binary
echo "📥 Downloading cloudflared binary..."
wget -O /tmp/cloudflared-linux-amd64 https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /tmp/cloudflared-linux-amd64
mv /tmp/cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify installation
echo "✅ Verifying cloudflared installation..."
cloudflared --version

# Create cloudflared user
echo "👤 Creating cloudflared user..."
adduser -D -s /bin/sh cloudflared 2>/dev/null || echo "User cloudflared already exists"

# Create config directory
echo "📁 Creating config directory..."
mkdir -p /etc/cloudflared
chown cloudflared:cloudflared /etc/cloudflared

# Copy service files
echo "📋 Installing OpenRC service files..."

# Copy init script
cp cloudflared-init.sh /etc/init.d/cloudflared
chmod +x /etc/init.d/cloudflared

# Copy config file
cp cloudflared.conf /etc/conf.d/cloudflared
chmod 600 /etc/conf.d/cloudflared
chown root:root /etc/conf.d/cloudflared

echo "🔧 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /etc/conf.d/cloudflared and replace YOUR_TUNNEL_TOKEN_HERE with your actual token"
echo "2. Enable the service: rc-update add cloudflared default"
echo "3. Start the service: service cloudflared start"
echo "4. Check status: service cloudflared status"
echo ""
echo "📖 Example:"
echo "  nano /etc/conf.d/cloudflared"
echo "  rc-update add cloudflared default"
echo "  service cloudflared start"