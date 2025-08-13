# Alpine Linux Setup Files

This directory contains scripts and configuration files for setting up the LVDA HA architecture on Alpine Linux.

## Files

- **`install-cloudflared.sh`** - Automated cloudflared installation script
- **`cloudflared-init.sh`** - OpenRC service script for cloudflared  
- **`cloudflared.conf`** - Configuration file with tunnel token
- **`haproxy.cfg`** - HAProxy configuration (copy from parent directory)

## Quick Setup on Alpine VM

```bash
# Clone repository
git clone YOUR_REPO_URL /opt/lvda
cd /opt/lvda/alpine

# Install cloudflared
sudo ./install-cloudflared.sh

# Edit tunnel token
sudo nano /etc/conf.d/cloudflared
# Replace YOUR_TUNNEL_TOKEN_HERE with your actual token

# Enable and start service
sudo rc-update add cloudflared default
sudo service cloudflared start

# Check status
sudo service cloudflared status
```

## Manual Steps

If you prefer manual installation:

```bash
# Install cloudflared binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create user
sudo adduser -D -s /bin/sh cloudflared

# Copy service files
sudo cp cloudflared-init.sh /etc/init.d/cloudflared
sudo cp cloudflared.conf /etc/conf.d/cloudflared

# Set permissions
sudo chmod +x /etc/init.d/cloudflared
sudo chmod 600 /etc/conf.d/cloudflared

# Configure tunnel token
sudo nano /etc/conf.d/cloudflared

# Enable service
sudo rc-update add cloudflared default
sudo service cloudflared start
```

## Service Management

```bash
# Start service
sudo service cloudflared start

# Stop service
sudo service cloudflared stop

# Restart service
sudo service cloudflared restart

# Check status
sudo service cloudflared status

# View logs
sudo tail -f /var/log/messages | grep cloudflared
```

## Troubleshooting

### Service won't start
```bash
# Check configuration
sudo service cloudflared checkconfig

# Manual test
sudo -u cloudflared /usr/local/bin/cloudflared tunnel --no-autoupdate run --token YOUR_TOKEN
```

### Check logs
```bash
# System logs
sudo tail -f /var/log/messages

# Service-specific logs
sudo journalctl -u cloudflared -f  # if available
```

### Token issues
- Make sure token is properly set in `/etc/conf.d/cloudflared`
- Verify token format (should start with `eyJ`)
- Check Cloudflare dashboard for tunnel status