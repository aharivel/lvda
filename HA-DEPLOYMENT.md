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

### Alpine 3.12 Base Installation

```bash
# Update package index
apk update

# Install required packages
apk add haproxy cloudflared nodejs npm sqlite curl bash

# Install process manager (PM2) for Node.js
npm install -g pm2
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
haproxy -c -f /etc/haproxy/haproxy.cfg

# Start HAProxy
rc-update add haproxy
service haproxy start
```

### Cloudflare Tunnel Configuration

**Option 1: Automated Installation (Recommended)**

```bash
# Clone LVDA repository
git clone YOUR_REPO_URL /opt/lvda
cd /opt/lvda/alpine

# Run automated installation
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

**Option 2: Manual Installation**

```bash
# Install cloudflared binary
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create user and directories
sudo adduser -D -s /bin/sh cloudflared
sudo mkdir -p /etc/cloudflared
sudo chown cloudflared:cloudflared /etc/cloudflared

# Copy service files from repository
sudo cp /opt/lvda/alpine/cloudflared-init.sh /etc/init.d/cloudflared
sudo cp /opt/lvda/alpine/cloudflared.conf /etc/conf.d/cloudflared

# Set permissions
sudo chmod +x /etc/init.d/cloudflared
sudo chmod 600 /etc/conf.d/cloudflared

# Configure tunnel token
sudo nano /etc/conf.d/cloudflared

# Enable and start service
sudo rc-update add cloudflared default
sudo service cloudflared start
```

See `alpine/README.md` for detailed instructions and troubleshooting.

### Backend API Setup

```bash
# Create backend directory
mkdir -p /opt/lvda-backend
cd /opt/lvda-backend

# Create simple Node.js API
cat > package.json << 'EOF'
{
  "name": "lvda-backend",
  "version": "1.0.0",
  "description": "LVDA Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5"
  }
}
EOF

# Install dependencies
npm install

# Create basic API server
cat > server.js << 'EOF'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH || '/data/lvda.db';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Create messages table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  
  const stmt = db.prepare(`INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`);
  stmt.run([name, email, phone || null, subject || null, message], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ 
      success: true, 
      message: 'Message saved successfully',
      id: this.lastID 
    });
  });
  stmt.finalize();
});

// Get messages (admin endpoint)
app.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`LVDA Backend API running on port ${PORT}`);
});
EOF

# Create data directory
mkdir -p /data
chown nobody:nobody /data

# Start API with PM2
pm2 start server.js --name lvda-backend
pm2 save
pm2 startup

# Enable PM2 to start at boot
rc-update add pm2-nobody
```

### Environment Configuration

```bash
# Create environment file
cat > /etc/environment << 'EOF'
PORT=3000
DATABASE_PATH=/data/lvda.db
EOF

# Source environment
source /etc/environment
```

---

## 2. Frontend VM Setup (Primary & Backup Servers)

### Alpine 3.12 Base Installation

```bash
# Update package index
apk update

# Install required packages for containerization
apk add docker docker-compose git curl bash

# Start Docker service
rc-update add docker
service docker start

# Add user to docker group (replace 'user' with actual username)
addgroup user docker
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