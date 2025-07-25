#!/bin/bash

echo "🔄 Switching to unified container setup..."

# Stop current containers
echo "📦 Stopping current containers..."
podman-compose down

# Backup current docker-compose
echo "💾 Backing up current docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

# Use unified setup
echo "🔧 Switching to unified configuration..."
cp docker-compose.unified.yml docker-compose.yml

# Build and start new containers
echo "🚀 Building and starting unified containers..."
podman-compose build --no-cache
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