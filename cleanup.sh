#!/bin/bash

echo "🧹 Cleaning up containers and images..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect container runtime
if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    COMPOSE_FILE="-f docker-compose.podman.yml"
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    CONTAINER_CMD="docker"
    COMPOSE_CMD="docker-compose"
    COMPOSE_FILE=""
else
    echo -e "${RED}❌ No container runtime found${NC}"
    exit 1
fi

echo -e "${YELLOW}Using: $CONTAINER_CMD${NC}"

# Stop and remove containers
echo -e "${YELLOW}Stopping containers...${NC}"
$COMPOSE_CMD $COMPOSE_FILE down

# Remove images
echo -e "${YELLOW}Removing images...${NC}"
$CONTAINER_CMD rmi -f $(echo "lvda-frontend lvda-backend lvda-admin" | tr ' ' '\n' | sed 's/^/lvda-/')

# Remove volumes (optional)
read -p "Remove database volume? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing volumes...${NC}"
    $CONTAINER_CMD volume rm lvda_database_data
fi

# Clean up build cache
echo -e "${YELLOW}Cleaning up build cache...${NC}"
$CONTAINER_CMD system prune -f

echo -e "${GREEN}✅ Cleanup complete!${NC}"