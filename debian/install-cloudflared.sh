#!/bin/bash

# Debian 12 Cloudflared Installation Script
# Run this script on your Debian VM to install and configure cloudflared

set -e

echo "🌩️ Installing Cloudflared on Debian 12..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update package list
echo "📦 Updating package list..."
apt update

# Install required packages
echo "📦 Installing required packages..."
apt install -y wget curl systemd

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        CLOUDFLARED_BINARY="cloudflared-linux-amd64"
        ;;
    aarch64)
        CLOUDFLARED_BINARY="cloudflared-linux-arm64"
        ;;
    armv7l)
        CLOUDFLARED_BINARY="cloudflared-linux-arm"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Install cloudflared binary
echo "📥 Downloading cloudflared binary for $ARCH..."
wget -O /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/$CLOUDFLARED_BINARY
chmod +x /tmp/cloudflared
mv /tmp/cloudflared /usr/local/bin/cloudflared

# Verify installation
echo "✅ Verifying cloudflared installation..."
cloudflared --version

# Create cloudflared user
echo "👤 Creating cloudflared user..."
useradd --system --home /var/lib/cloudflared --shell /usr/sbin/nologin cloudflared 2>/dev/null || echo "User cloudflared already exists"

# Create config directory
echo "📁 Creating config directory..."
mkdir -p /var/lib/cloudflared
chown cloudflared:cloudflared /var/lib/cloudflared

# Install systemd service files
echo "📋 Installing systemd service files..."

# Copy service file
cp cloudflared.service /etc/systemd/system/cloudflared.service

# Copy environment file
cp cloudflared.env /etc/default/cloudflared
chmod 600 /etc/default/cloudflared
chown root:root /etc/default/cloudflared

# Reload systemd
systemctl daemon-reload

echo "🔧 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /etc/default/cloudflared and replace YOUR_TUNNEL_TOKEN_HERE with your actual token"
echo "2. Enable the service: systemctl enable cloudflared"
echo "3. Start the service: systemctl start cloudflared"
echo "4. Check status: systemctl status cloudflared"
echo ""
echo "📖 Example:"
echo "  nano /etc/default/cloudflared"
echo "  systemctl enable cloudflared"
echo "  systemctl start cloudflared"
echo ""
echo "🔍 Troubleshooting:"
echo "  journalctl -u cloudflared -f  # View logs"
echo "  systemctl status cloudflared   # Check status"