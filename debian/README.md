# Debian 12 Setup Files

This directory contains scripts and configuration files for setting up the LVDA HA architecture on Debian 12 with systemd.

## Files

- **`install-cloudflared.sh`** - Automated cloudflared installation script
- **`cloudflared.service`** - systemd service file for cloudflared  
- **`cloudflared.env`** - Environment configuration file
- **`haproxy.cfg`** - HAProxy configuration (copy from parent directory)

## Quick Setup on Debian VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y haproxy git curl wget

# Clone repository
git clone YOUR_REPO_URL /opt/lvda
cd /opt/lvda/debian

# Install cloudflared
sudo ./install-cloudflared.sh

# Edit tunnel token
sudo nano /etc/default/cloudflared
# Replace YOUR_TUNNEL_TOKEN_HERE with your actual token

# Enable and start service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

## HAProxy Setup

```bash
# Install HAProxy
sudo apt install -y haproxy

# Copy configuration
sudo cp ../haproxy.cfg /etc/haproxy/haproxy.cfg

# Edit server IPs in haproxy.cfg
sudo nano /etc/haproxy/haproxy.cfg
# Replace 192.168.1.74 and 192.168.1.75 with your actual server IPs

# Test configuration
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Enable and start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

## Backend API Setup (Node.js)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Create backend directory
sudo mkdir -p /opt/lvda-backend
cd /opt/lvda-backend

# Copy backend files
sudo cp -r /opt/lvda/backend/* .

# Install dependencies
sudo npm install

# Create systemd service for backend
sudo tee /etc/systemd/system/lvda-backend.service > /dev/null << 'EOF'
[Unit]
Description=LVDA Backend API
After=network.target
Documentation=https://github.com/your-repo/lvda

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/lvda-backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lvda-backend

# Environment variables
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=/var/lib/lvda/contacts.db

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/lvda
ReadWritePaths=/var/log

[Install]
WantedBy=multi-user.target
EOF

# Create data directory
sudo mkdir -p /var/lib/lvda
sudo chown www-data:www-data /var/lib/lvda

# Set permissions
sudo chown -R www-data:www-data /opt/lvda-backend

# Enable and start backend
sudo systemctl daemon-reload
sudo systemctl enable lvda-backend
sudo systemctl start lvda-backend
```

## Service Management

### Cloudflared
```bash
# Start service
sudo systemctl start cloudflared

# Stop service
sudo systemctl stop cloudflared

# Restart service
sudo systemctl restart cloudflared

# Check status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Enable auto-start at boot
sudo systemctl enable cloudflared
```

### HAProxy
```bash
# Start service
sudo systemctl start haproxy

# Stop service
sudo systemctl stop haproxy

# Reload configuration (without stopping)
sudo systemctl reload haproxy

# Check status
sudo systemctl status haproxy

# View logs
sudo journalctl -u haproxy -f

# Test configuration
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
```

### Backend API
```bash
# Start service
sudo systemctl start lvda-backend

# Stop service
sudo systemctl stop lvda-backend

# Check status
sudo systemctl status lvda-backend

# View logs
sudo journalctl -u lvda-backend -f
```

## Complete Installation Script

```bash
#!/bin/bash
# Complete Debian 12 HA setup

set -e

echo "🚀 Setting up LVDA HA Architecture on Debian 12..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install base packages
sudo apt install -y haproxy nodejs npm git curl wget sqlite3

# Clone repository
git clone YOUR_REPO_URL /opt/lvda
cd /opt/lvda/debian

# Install cloudflared
sudo ./install-cloudflared.sh

# Setup HAProxy
sudo cp ../haproxy.cfg /etc/haproxy/haproxy.cfg
echo "⚠️  Edit /etc/haproxy/haproxy.cfg to set your server IPs"

# Setup backend
sudo mkdir -p /opt/lvda-backend /var/lib/lvda
sudo cp -r ../backend/* /opt/lvda-backend/
cd /opt/lvda-backend
sudo npm install
sudo chown -R www-data:www-data /opt/lvda-backend /var/lib/lvda

# Install backend service
sudo cp /opt/lvda/debian/lvda-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

echo "✅ Installation complete!"
echo ""
echo "📝 Configuration needed:"
echo "1. Edit /etc/default/cloudflared - set tunnel token"
echo "2. Edit /etc/haproxy/haproxy.cfg - set server IPs"
echo ""
echo "🚀 Start services:"
echo "  sudo systemctl enable --now cloudflared"
echo "  sudo systemctl enable --now haproxy"  
echo "  sudo systemctl enable --now lvda-backend"
```

## Troubleshooting

### Check Service Status
```bash
sudo systemctl status cloudflared haproxy lvda-backend
```

### View All Logs
```bash
sudo journalctl -u cloudflared -u haproxy -u lvda-backend -f
```

### Network Connectivity
```bash
# Test HAProxy
curl -I http://localhost:80

# Test Backend API
curl -I http://localhost:3000/api/health

# Test Cloudflare tunnel connectivity
sudo -u cloudflared /usr/local/bin/cloudflared tunnel --no-autoupdate run --token YOUR_TOKEN
```

### Firewall Configuration
```bash
# Allow HAProxy and Backend ports
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```