#!/bin/bash

# Detect container runtime (Docker or Podman)
# Check Podman first since it runs rootless and is more likely to work
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    echo "🦭 Using Podman for cleanup"
elif command -v docker &> /dev/null; then
    # Test if Docker daemon is accessible
    if docker info >/dev/null 2>&1; then
        CONTAINER_CMD="docker"
        echo "🐳 Using Docker for cleanup"
    else
        echo "❌ Docker found but daemon not accessible (permission denied)"
        echo "💡 Try adding your user to the docker group: sudo usermod -aG docker $USER"
        echo "💡 Or install Podman for rootless containers"
        exit 1
    fi
else
    echo "❌ Neither Docker nor Podman found!"
    echo "Please install Docker or Podman"
    exit 1
fi

echo "🧹 Performing complete $CONTAINER_CMD cleanup..."

# Stop all containers
echo "⏹️  Stopping all containers..."
$CONTAINER_CMD stop $($CONTAINER_CMD ps -aq) 2>/dev/null || true

# Remove all containers
echo "🗑️  Removing all containers..."
$CONTAINER_CMD rm $($CONTAINER_CMD ps -aq) 2>/dev/null || true

# Remove all images
echo "🖼️  Removing all images..."
$CONTAINER_CMD rmi $($CONTAINER_CMD images -q) 2>/dev/null || true

# Remove all volumes
echo "💾 Removing all volumes..."
$CONTAINER_CMD volume rm $($CONTAINER_CMD volume ls -q) 2>/dev/null || true

# Remove all networks (skip for Docker default networks)
if [ "$CONTAINER_CMD" = "podman" ]; then
    echo "🌐 Removing all networks..."
    $CONTAINER_CMD network rm $($CONTAINER_CMD network ls -q) 2>/dev/null || true
else
    echo "🌐 Removing custom networks..."
    $CONTAINER_CMD network ls --filter type=custom -q | xargs -r $CONTAINER_CMD network rm 2>/dev/null || true
fi

# System-wide cleanup
echo "🧽 Performing system-wide cleanup..."
$CONTAINER_CMD system prune -af --volumes

echo "✅ Complete cleanup finished!"
echo "ℹ️  You can now run ./switch-to-unified.sh for a fresh start"