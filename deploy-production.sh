#!/bin/bash

# Production deployment script with Cloudflare tunnel
# This script deploys only the frontend via Cloudflare tunnel for security

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LVDA Production Deployment with Cloudflare Tunnel${NC}"
echo "========================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}💡 Copy env_exemple.txt to .env and fill in your values:${NC}"
    echo "   cp env_exemple.txt .env"
    echo "   nano .env"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📄 Loading environment variables...${NC}"
set -a  # automatically export all variables
source .env
set +a  # stop auto-exporting

# Validate required environment variables
echo -e "${BLUE}🔍 Validating configuration...${NC}"
required_vars=("ADMIN_USERNAME" "ADMIN_PASSWORD" "CLOUDFLARE_TUNNEL_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Configuration validated${NC}"

# Detect container runtime (Docker or Podman)
echo -e "${BLUE}🔍 Detecting container runtime...${NC}"
if command -v podman &> /dev/null && command -v podman-compose &> /dev/null; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    echo -e "${GREEN}🦭 Using Podman${NC}"
elif command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    # Test if Docker daemon is accessible
    if docker info >/dev/null 2>&1; then
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        echo -e "${GREEN}🐳 Using Docker${NC}"
    else
        echo -e "${RED}❌ Docker found but daemon not accessible (permission denied)${NC}"
        echo -e "${YELLOW}💡 Try adding your user to the docker group: sudo usermod -aG docker $USER${NC}"
        echo -e "${YELLOW}💡 Or install Podman for rootless containers${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Neither Docker nor Podman with compose found!${NC}"
    echo "Please install Docker + docker-compose or Podman + podman-compose"
    exit 1
fi

echo -e "${BLUE}🔄 Starting production deployment...${NC}"

# Stop and remove all containers
echo -e "${BLUE}📦 Stopping and removing existing containers...${NC}"
$COMPOSE_CMD -f docker-compose.production.yml down --volumes --remove-orphans 2>/dev/null || true

# Clean up cache and images
echo -e "${BLUE}🧹 Cleaning up containers, images, and cache...${NC}"
$CONTAINER_CMD system prune -f
$CONTAINER_CMD image prune -f
$CONTAINER_CMD volume prune -f

# Remove any existing images for this project
echo -e "${BLUE}🗑️ Removing existing project images...${NC}"
$CONTAINER_CMD images | grep lvda | awk '{print $3}' | xargs -r $CONTAINER_CMD rmi -f 2>/dev/null || true

# Build and start production containers
echo -e "${BLUE}🚀 Building and starting production containers...${NC}"
$COMPOSE_CMD -f docker-compose.production.yml build --no-cache --pull
$COMPOSE_CMD -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check if containers are running
echo -e "${BLUE}🔍 Checking container status...${NC}"
if $COMPOSE_CMD -f docker-compose.production.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Production deployment successful!${NC}"
else
    echo -e "${RED}❌ Some containers failed to start${NC}"
    echo -e "${YELLOW}📋 Container status:${NC}"
    $COMPOSE_CMD -f docker-compose.production.yml ps
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Production deployment complete!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}🌐 Access points:${NC}"
echo -e "  • Website: ${GREEN}Available ONLY via Cloudflare tunnel${NC}"
echo -e "  • Local access: ${YELLOW}Not available (no ports exposed)${NC}"
echo ""
echo -e "${BLUE}🔐 Security features:${NC}"
echo -e "  • ✅ Frontend exposed only via Cloudflare tunnel"
echo -e "  • ✅ Backend not exposed to internet"
echo -e "  • ✅ No ports opened on router"
echo -e "  • ✅ Admin panel protected with authentication"
echo ""
echo -e "${BLUE}🔧 Cloudflare tunnel:${NC}"
echo -e "  • Tunnel ID: ${CLOUDFLARE_TUNNEL_ID}"
echo -e "  • Status: Check Cloudflare dashboard"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Check Cloudflare tunnel status in dashboard"
echo "  2. Verify website is accessible via your domain"
echo "  3. Test all functionality"
echo ""
echo -e "${BLUE}🛠️ Management commands:${NC}"
echo "  • View logs: $COMPOSE_CMD -f docker-compose.production.yml logs -f"
echo "  • Stop: $COMPOSE_CMD -f docker-compose.production.yml down"
echo "  • Restart: ./deploy-production.sh"
echo ""