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

# Kill any lingering pasta/rootlessport process holding port 53
# ss shows no socket but pasta daemon may have stale internal state —
# kill it so it restarts clean (containers reconnect automatically)
for pid in $(ss -Hnp 'sport = :53' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u) \
           $(ss -Hunp 'sport = :53' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u); do
    echo -e "${BLUE}   Releasing port 53 from pid $pid...${NC}"
    kill "$pid" 2>/dev/null || true
done
# Also kill pasta daemon if it has stale port 53 state (it restarts automatically)
pkill -x pasta 2>/dev/null || true
sleep 3

# Start
echo -e "${BLUE}🚀 Starting AdGuard Home...${NC}"
podman run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 53:53/tcp \
    -p 53:53/udp \
    -p 8082:80/tcp \
    -v adguard_work:/opt/adguardhome/work \
    -v adguard_conf:/opt/adguardhome/conf \
    "$IMAGE"

echo ""
echo -e "${GREEN}✅ AdGuard Home deployed successfully${NC}"
echo -e "${BLUE}   Dashboard: http://192.168.1.74:8082${NC}"
echo -e "${BLUE}   DNS:       192.168.1.74 (IPv4) / \$(hostname -I | awk '{print \$2}') (IPv6)${NC}"
