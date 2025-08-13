# LVDA High Availability Deployment Guide

## Architecture Overview

```
Internet → Cloudflare Tunnel → Router VM (HAProxy) → {
    Frontend Servers: Primary (192.168.1.74:8080) + Backup (192.168.1.75:8080)
    Backend API: Router VM (127.0.0.1:3000) + SQLite DB
}
```

## Components

1. **Routing VM** (Router): HAProxy + Cloudflare Tunnel + Backend API
2. **Frontend VMs** (Servers): Static HTML/CSS/JS files
3. **Centralized Backend**: REST API + SQLite database

---

## 1. Routing VM Setup (Router)

### Debian 12 Base Installation

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y haproxy nodejs npm git curl wget sqlite3

# Install Node.js LTS (if needed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### HAProxy Configuration

```bash
# Copy HAProxy config
cp haproxy.cfg /etc/haproxy/haproxy.cfg

# Create error pages directory
mkdir -p /etc/haproxy/errors

# Create basic 503 error page
cat > /etc/haproxy/errors/503.http << 'EOF'
HTTP/1.0 503 Service Unavailable
Cache-Control: no-cache
Connection: close
Content-Type: text/html

<!DOCTYPE html>
<html>
<head>
    <title>Service Temporarily Unavailable</title>
</head>
<body>
    <h1>Service Temporarily Unavailable</h1>
    <p>The website is currently under maintenance. Please try again later.</p>
</body>
</html>
EOF

# Update haproxy.cfg with your actual server IPs:
# - Replace 192.168.1.74 with your primary server IP
# - Replace 192.168.1.75 with your backup server IP

# Test HAProxy configuration
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

### Cloudflare Tunnel Configuration

**Option 1: Automated Installation (Recommended)**

```bash
# Clone LVDA repository
git clone YOUR_REPO_URL /opt/lvda
cd /opt/lvda/debian

# Run automated installation
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

**Option 2: Manual Installation**

```bash
# Install cloudflared binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create user and directories
sudo useradd --system --home /var/lib/cloudflared --shell /usr/sbin/nologin cloudflared
sudo mkdir -p /var/lib/cloudflared
sudo chown cloudflared:cloudflared /var/lib/cloudflared

# Copy service files from repository
sudo cp /opt/lvda/debian/cloudflared.service /etc/systemd/system/
sudo cp /opt/lvda/debian/cloudflared.env /etc/default/cloudflared

# Set permissions
sudo chmod 600 /etc/default/cloudflared
sudo systemctl daemon-reload

# Configure tunnel token
sudo nano /etc/default/cloudflared

# Enable and start service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

See `debian/README.md` for detailed instructions and troubleshooting.

### Backend API Setup

```bash
# Create backend directory and copy files
sudo mkdir -p /opt/lvda-backend /var/lib/lvda
cd /opt/lvda-backend

# Copy backend files from repository
sudo cp -r /opt/lvda/backend/* .

# Install dependencies
sudo npm install

# Set up systemd service
sudo cp /opt/lvda/debian/lvda-backend.service /etc/systemd/system/

# Set proper ownership
sudo chown -R www-data:www-data /opt/lvda-backend /var/lib/lvda

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable lvda-backend
sudo systemctl start lvda-backend

# Check service status
sudo systemctl status lvda-backend
```

### Service Management

```bash
# View service logs
sudo journalctl -u cloudflared -f
sudo journalctl -u haproxy -f  
sudo journalctl -u lvda-backend -f

# Restart services
sudo systemctl restart cloudflared
sudo systemctl restart haproxy
sudo systemctl restart lvda-backend

# Check all service status
sudo systemctl status cloudflared haproxy lvda-backend
```

---

## 2. Frontend VM Setup (Primary & Backup Servers)

### Debian 12 Base Installation

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages for containerization
sudo apt install -y docker.io docker-compose git curl

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group (replace 'user' with actual username)
sudo usermod -aG docker $USER
newgrp docker
```

### Deploy Frontend

```bash
# Clone repository (or copy files)
git clone YOUR_REPO_URL /opt/lvda-website
cd /opt/lvda-website

# Create environment file
cat > .env << 'EOF'
BACKEND_API_URL=http://ROUTER_VM_IP
EOF

# Replace ROUTER_VM_IP with actual router VM IP (e.g., 192.168.1.10)
sed -i 's/ROUTER_VM_IP/192.168.1.10/g' .env

# Run frontend deployment
./deploy-frontend.sh
```

### Frontend Docker Compose

Create `docker-compose.frontend.yml`:

```yaml
version: '3.8'

services:
  lvda-frontend:
    build:
      context: .
      dockerfile: Dockerfile.unified
    container_name: lvda-frontend
    ports:
      - "8080:80"
    environment:
      - BACKEND_API_URL=${BACKEND_API_URL}
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/nginx
```

---

## 3. Backend VM Setup (Alternative: Separate Backend)

If you want to run the backend on a separate VM instead of the router:

### Alpine 3.12 Installation

```bash
# Update packages
apk update
apk add docker docker-compose git nodejs npm sqlite curl bash

# Enable Docker
rc-update add docker
service docker start
```

### Deploy Backend

```bash
# Clone repository
git clone YOUR_REPO_URL /opt/lvda-backend
cd /opt/lvda-backend

# Create environment file
cat > .env << 'EOF'
API_PORT=3000
DATABASE_PATH=/data/lvda.db
EOF

# Run backend deployment
./deploy-backend.sh
```

### Backend Docker Compose

Create `docker-compose.backend.yml`:

```yaml
version: '3.8'

services:
  lvda-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: lvda-backend
    ports:
      - "3000:3000"
    environment:
      - PORT=${API_PORT}
      - DATABASE_PATH=${DATABASE_PATH}
    volumes:
      - /data:/data
    restart: unless-stopped
```

---

## 4. Adding Additional Frontend Servers (High Availability)

### For Each Additional Server:

1. **Set up Alpine VM** (same as Frontend VM Setup)
2. **Deploy frontend** (same process)
3. **Update HAProxy configuration** on router VM:

```bash
# Edit HAProxy config
nano /etc/haproxy/haproxy.cfg

# Add new server in lvda_frontend backend:
# server backup2 192.168.1.76:8080 check inter 10s fall 3 rise 2 backup

# Reload HAProxy
service haproxy reload
```

---

## 5. Testing & Verification

### Test HAProxy Status

```bash
# Check HAProxy stats page
curl http://router-vm-ip:8404/stats

# Test health endpoint
curl http://router-vm-ip/health

# Test API through HAProxy
curl http://router-vm-ip/api/health
```

### Test Backend API

```bash
# Health check
curl http://router-vm-ip:3000/api/health

# Test contact form
curl -X POST http://router-vm-ip:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'

# View messages (admin)
curl http://router-vm-ip:3000/api/messages
```

### Test Frontend Failover

```bash
# Stop primary frontend server
docker-compose -f docker-compose.frontend.yml down

# Verify traffic goes to backup server
curl -H "Host: your-domain.com" http://router-vm-ip/

# Start primary server again
docker-compose -f docker-compose.frontend.yml up -d
```

---

## 6. Monitoring & Maintenance

### Log Monitoring

```bash
# HAProxy logs
tail -f /var/log/haproxy.log

# Backend API logs
pm2 logs lvda-backend

# Frontend logs
docker-compose -f docker-compose.frontend.yml logs -f
```

### Database Backup

```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /data/lvda.db ".backup /data/backups/lvda_$DATE.db"
find /data/backups -name "lvda_*.db" -mtime +30 -delete
EOF

chmod +x /opt/backup-db.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /opt/backup-db.sh" | crontab -
```

### Updates

```bash
# Update frontend servers
cd /opt/lvda-website
git pull
./deploy-frontend.sh

# Update backend (if separate VM)
cd /opt/lvda-backend  
git pull
./deploy-backend.sh

# Restart backend API (if on router VM)
pm2 restart lvda-backend
```

---

## Troubleshooting

### HAProxy Issues

```bash
# Check HAProxy status
service haproxy status

# Test configuration
haproxy -c -f /etc/haproxy/haproxy.cfg

# View real-time stats
echo "show stat" | socat stdio /var/run/haproxy.sock
```

### Backend API Issues

```bash
# Check PM2 processes
pm2 status
pm2 logs lvda-backend

# Check database
sqlite3 /data/lvda.db ".tables"
sqlite3 /data/lvda.db "SELECT COUNT(*) FROM messages;"
```

### Network Connectivity

```bash
# Test connectivity between components
ping 192.168.1.74  # Primary server
ping 192.168.1.75  # Backup server

# Test ports
nc -zv 192.168.1.74 8080  # Frontend port
nc -zv 127.0.0.1 3000     # Backend API port
```