#!/bin/bash

echo "🔄 Switching to unified container setup with complete cleanup..."

# Stop and remove all containers
echo "📦 Stopping and removing all containers..."
podman-compose down --volumes --remove-orphans

# Clean up Docker/Podman cache and images
echo "🧹 Cleaning up containers, images, and cache..."
podman system prune -f
podman image prune -f
podman volume prune -f

# Remove any existing images for this project
echo "🗑️ Removing existing project images..."
podman images | grep lvda | awk '{print $3}' | xargs -r podman rmi -f

# Backup current docker-compose
echo "💾 Backing up current docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

# Use unified setup
echo "🔧 Switching to unified configuration..."
cp docker-compose.unified.yml docker-compose.yml

# Build and start new containers with complete rebuild
echo "🚀 Building and starting unified containers (complete rebuild)..."
podman-compose build --no-cache --pull
podman-compose up -d

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