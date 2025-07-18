# LVDA Website - Container Setup

## 🐳 Simple & Secure 3-Container Architecture

This setup provides a complete contact form solution with:
- **Frontend**: Static website with CAPTCHA-protected contact form
- **Backend**: API with SQLite database and rate limiting
- **Admin Panel**: Internal monitoring interface

**Compatible with both Docker and Podman!** 🦭

## 🚀 Quick Start

1. **Clone and navigate to the project**:
   ```bash
   cd /home/aharivel/work/sandbox/lvda/website/lvda
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   nano .env  # Change the admin password!
   ```

3. **Auto-deploy with detection (Recommended)**:
   ```bash
   ./test-docker.sh
   ```

4. **Or manual deployment**:
   ```bash
   # For Docker
   docker-compose up --build -d
   
   # For Podman
   podman-compose -f docker-compose.podman.yml up --build -d
   ```

5. **Access the services**:
   - **Website**: http://localhost:3000
   - **Admin Panel**: http://localhost:3002 (admin/your-password)

## 🔧 Configuration

### Environment Variables

Edit `.env` file:
```bash
ADMIN_USER=admin
ADMIN_PASSWORD=your-secure-password-here
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### For Production with Cloudflare Tunnel

1. **Update allowed origins in `.env`**:
   ```bash
   ALLOWED_ORIGINS=https://your-domain.com,https://your-admin-domain.com
   ```

2. **Set up Cloudflare Tunnel**:
   ```bash
   # Main website
   cloudflared tunnel route dns your-tunnel your-domain.com
   
   # Admin panel (optional - keep internal)
   cloudflared tunnel route dns your-tunnel admin.your-domain.com
   ```

## 🛡️ Security Features

### Already Implemented:
- ✅ **Rate Limiting**: 5 requests per 15 minutes per IP
- ✅ **CAPTCHA**: Simple math verification
- ✅ **Input Validation**: Server-side validation
- ✅ **Basic Auth**: Admin panel protection
- ✅ **Security Headers**: XSS, CSRF protection
- ✅ **Non-root Containers**: All containers run as non-root
- ✅ **Read-only Database**: Admin has read-only access

### Additional Security (Recommended):
1. **Change default admin password** in `.env`
2. **Use strong passwords** (20+ characters)
3. **Keep admin panel internal** (don't expose to internet)
4. **Enable Cloudflare security rules**
5. **Regular database backups**

## 📊 Database Management

### Backup Database:
```bash
docker-compose exec backend cp /data/contacts.db /data/backup-$(date +%Y%m%d).db
```

### View Database:
```bash
docker-compose exec backend sqlite3 /data/contacts.db ".tables"
docker-compose exec backend sqlite3 /data/contacts.db "SELECT * FROM contacts;"
```

### Reset Database:
```bash
docker-compose down
docker volume rm lvda_database_data
docker-compose up -d
```

## 🔍 Monitoring

### Check Container Status:
```bash
docker-compose ps
```

### View Logs:
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f admin
```

### Health Checks:
```bash
curl http://localhost:3000/     # Frontend
curl http://localhost:3001/health  # Backend
curl http://localhost:3002/health  # Admin
```

## 📝 Usage

### Contact Form Features:
- **Name**: 2-100 characters
- **Email**: Valid email format
- **Message**: 10-1000 characters
- **CAPTCHA**: Simple math problem
- **Rate Limiting**: 5 submissions per 15 minutes

### Admin Panel Features:
- **Dashboard**: Statistics and overview
- **Message List**: Paginated with search
- **Message Details**: Full message view
- **Auto-refresh**: Updates every 30 seconds
- **Export**: Click email to open default mail client

## 🐛 Troubleshooting

### Common Issues:

1. **CAPTCHA not loading**:
   ```bash
   docker-compose logs backend
   # Check if backend is running on port 3001
   ```

2. **Messages not saving**:
   ```bash
   docker-compose exec backend ls -la /data/
   # Check database permissions
   ```

3. **Admin panel not accessible**:
   ```bash
   # Check if you're using correct credentials from .env
   cat .env | grep ADMIN
   ```

4. **Rate limiting too strict**:
   ```bash
   # Edit backend/server.js and rebuild
   # Change: max: 5 to max: 10
   docker-compose up --build -d backend
   ```

## 🔄 Updates

To update the application:
```bash
git pull
docker-compose down
docker-compose up --build -d
```

## 📋 Container Specifications

- **Frontend**: nginx:alpine (Website)
- **Backend**: node:18-alpine (API)
- **Admin**: node:18-alpine (Monitoring)
- **Database**: SQLite (Persistent volume)

## 🌐 Cloudflare Integration

The setup is optimized for Cloudflare Tunnel:
- No open ports required
- Built-in security headers
- Rate limiting protection
- HTTPS termination at Cloudflare edge

Perfect for homelab deployment! 🏠