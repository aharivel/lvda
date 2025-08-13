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

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        CLOUDFLARED_BINARY="cloudflared-linux-amd64"
        ;;
    aarch64)
        echo "⚠️  ARM64 Alpine (musl) detected - glibc binary incompatible"
        echo "🐳 Using Docker container approach instead..."
        USE_DOCKER=true
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