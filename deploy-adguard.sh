#!/bin/bash
# deploy-adguard.sh — Deploy or update AdGuard Home
#
# Uses podman run directly — intentionally avoids podman-compose to
# prevent interference with the LVDA stack containers.
# Data volumes are preserved across updates.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="adguardhome"
IMAGE="adguard/adguardhome:latest"

echo -e "${BLUE}🛡️  Deploying AdGuard Home...${NC}"

# Check sysctl for unprivileged port 53
UNPRIVILEGED_START=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
if [[ "$UNPRIVILEGED_START" -gt 53 ]]; then
    echo -e "${RED}❌ Port 53 not accessible for rootless containers.${NC}"
    echo -e "${YELLOW}   Run once on the server (requires sudo):${NC}"
    echo -e "${YELLOW}   echo 'net.ipv4.ip_unprivileged_port_start=53' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf${NC}"
    echo -e "${YELLOW}   sudo sysctl -p /etc/sysctl.d/99-unprivileged-ports.conf${NC}"
    exit 1
fi

# Pull latest image
echo -e "${BLUE}📦 Pulling latest AdGuard Home image...${NC}"
podman pull "$IMAGE"

# Stop and remove existing container only (never touches other containers)
echo -e "${BLUE}⏹️  Stopping existing container...${NC}"
podman stop "$CONTAINER_NAME" 2>/dev/null || true
podman rm "$CONTAINER_NAME" 2>/dev/null || true


# Start
# --network=host: bypasses pasta entirely so AdGuard can make outbound DNS/DoH
# queries directly through the host network stack. Without this, pasta's port-53
# handling interferes with AdGuard's own upstream DNS connections.
echo -e "${BLUE}🚀 Starting AdGuard Home...${NC}"
podman run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    --network host \
    -v adguard_work:/opt/adguardhome/work \
    -v adguard_conf:/opt/adguardhome/conf \
    "$IMAGE"

echo ""
echo -e "${GREEN}✅ AdGuard Home deployed successfully${NC}"
echo -e "${BLUE}   Dashboard: http://192.168.1.74:3000${NC}"
echo -e "${BLUE}   DNS:       192.168.1.74${NC}"
