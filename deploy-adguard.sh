#!/bin/bash
# deploy-adguard.sh — Deploy or update AdGuard Home
# Completely independent from the LVDA website stack.
# Data volumes are preserved across updates.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.adguard.yml"

# Detect container runtime
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    CONTAINER_CMD="podman"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    CONTAINER_CMD="docker"
else
    echo -e "${RED}❌ Neither podman-compose nor docker-compose found${NC}"
    exit 1
fi

echo -e "${BLUE}🛡️  Deploying AdGuard Home...${NC}"
echo -e "${BLUE}   Runtime: $CONTAINER_CMD${NC}"

# Check sysctl for port 53
UNPRIVILEGED_START=$(sysctl -n net.ipv4.ip_unprivileged_port_start 2>/dev/null || echo "1024")
if [[ "$UNPRIVILEGED_START" -gt 53 ]]; then
    echo -e "${RED}❌ Port 53 not accessible for rootless containers.${NC}"
    echo -e "${YELLOW}   Run this once on the server (requires sudo):${NC}"
    echo -e "${YELLOW}   echo 'net.ipv4.ip_unprivileged_port_start=53' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf${NC}"
    echo -e "${YELLOW}   sudo sysctl -p /etc/sysctl.d/99-unprivileged-ports.conf${NC}"
    exit 1
fi

# Pull latest image
echo -e "${BLUE}📦 Pulling latest AdGuard Home image...${NC}"
$CONTAINER_CMD pull adguard/adguardhome:latest

# Stop existing container if running (preserves volumes)
echo -e "${BLUE}⏹️  Stopping existing container...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" down 2>/dev/null || true

# Start
echo -e "${BLUE}🚀 Starting AdGuard Home...${NC}"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d

echo ""
echo -e "${GREEN}✅ AdGuard Home deployed successfully${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   First run?  Open http://192.168.1.74:8082 and complete the setup wizard"
echo -e "   During setup, set:"
echo -e "     Web UI listen:  0.0.0.0:80"
echo -e "     DNS listen:     0.0.0.0:53"
echo -e ""
echo -e "   Then point your router's DNS to: 192.168.1.74"
