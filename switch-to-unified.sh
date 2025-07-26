#!/bin/bash

# Detect container runtime (Docker or Podman)
# Check Podman first since it runs rootless and is more likely to work
if command -v podman &> /dev/null && command -v podman-compose &> /dev/null; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    echo "🦭 Using Podman"
elif command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    # Test if Docker daemon is accessible
    if docker info >/dev/null 2>&1; then
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        echo "🐳 Using Docker"
    else
        echo "❌ Docker found but daemon not accessible (permission denied)"
        echo "💡 Try adding your user to the docker group: sudo usermod -aG docker $USER"
        echo "💡 Or install Podman for rootless containers"
        exit 1
    fi
else
    echo "❌ Neither Docker nor Podman with compose found!"
    echo "Please install Docker + docker-compose or Podman + podman-compose"
    exit 1
fi

echo "🔄 Switching to unified container setup with complete cleanup..."

# Stop and remove all containers
echo "📦 Stopping and removing all containers..."
$COMPOSE_CMD down --volumes --remove-orphans

# Clean up cache and images
echo "🧹 Cleaning up containers, images, and cache..."
$CONTAINER_CMD system prune -f
$CONTAINER_CMD image prune -f
$CONTAINER_CMD volume prune -f

# Remove any existing images for this project
echo "🗑️ Removing existing project images..."
$CONTAINER_CMD images | grep lvda | awk '{print $3}' | xargs -r $CONTAINER_CMD rmi -f

# Backup current docker-compose
echo "💾 Backing up current docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

# Use unified setup
echo "🔧 Switching to unified configuration..."
cp docker-compose.unified.yml docker-compose.yml

# Build and start new containers with complete rebuild
echo "🚀 Building and starting unified containers (complete rebuild)..."
$COMPOSE_CMD build --no-cache --pull
$COMPOSE_CMD up -d

echo "✅ Unified setup complete!"
echo ""
echo "🌐 Access points:"
echo "  • Main website: http://localhost:3000/"
echo "  • Admin panel:  http://localhost:3000/admin/"
echo "  • API:          http://localhost:3000/api/"
echo ""
echo "🔐 Admin credentials (change these!):"
echo "  • Username: admin"
echo "  • Password: admin123"
echo ""
echo "📋 Benefits of unified setup:"
echo "  • No more CORS/CSP issues"
echo "  • Single origin for all resources"
echo "  • Simplified networking"
echo "  • Better security with basic auth on admin"
