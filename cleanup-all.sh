#!/bin/bash

echo "🧹 Performing complete Docker/Podman cleanup..."

# Stop all containers
echo "⏹️  Stopping all containers..."
podman stop $(podman ps -aq) 2>/dev/null || true

# Remove all containers
echo "🗑️  Removing all containers..."
podman rm $(podman ps -aq) 2>/dev/null || true

# Remove all images
echo "🖼️  Removing all images..."
podman rmi $(podman images -q) 2>/dev/null || true

# Remove all volumes
echo "💾 Removing all volumes..."
podman volume rm $(podman volume ls -q) 2>/dev/null || true

# Remove all networks
echo "🌐 Removing all networks..."
podman network rm $(podman network ls -q) 2>/dev/null || true

# System-wide cleanup
echo "🧽 Performing system-wide cleanup..."
podman system prune -af --volumes

echo "✅ Complete cleanup finished!"
echo "ℹ️  You can now run ./switch-to-unified.sh for a fresh start"