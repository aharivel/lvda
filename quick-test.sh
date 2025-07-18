#!/bin/bash

echo "🚀 Quick LVDA Container Test"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect container runtime
CONTAINER_CMD=""
COMPOSE_CMD=""
COMPOSE_FILE=""

if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    COMPOSE_FILE="-f docker-compose.podman.yml"
    echo -e "${BLUE}🦭 Using Podman${NC}"
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    CONTAINER_CMD="docker"
    COMPOSE_CMD="docker-compose"
    COMPOSE_FILE=""
    echo -e "${BLUE}🐳 Using Docker${NC}"
else
    echo -e "${RED}❌ No container runtime found${NC}"
    exit 1
fi

# Clean up any existing containers
echo -e "${YELLOW}🧹 Cleaning up existing containers...${NC}"
$COMPOSE_CMD $COMPOSE_FILE down 2>/dev/null || true

# Build containers
echo -e "${YELLOW}🔨 Building containers...${NC}"
$COMPOSE_CMD $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
$COMPOSE_CMD $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# Check container status
echo -e "${YELLOW}📊 Container Status:${NC}"
$COMPOSE_CMD $COMPOSE_FILE ps

# Test endpoints with retries
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"

test_endpoint() {
    local url=$1
    local name=$2
    local retries=5
    
    for i in $(seq 1 $retries); do
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is accessible${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Attempt $i/$retries for $name...${NC}"
        sleep 2
    done
    
    echo -e "${RED}❌ $name is not accessible after $retries attempts${NC}"
    return 1
}

# Test all endpoints
test_endpoint "http://localhost:3000" "Frontend"
test_endpoint "http://localhost:3001/health" "Backend API"
test_endpoint "http://localhost:3002/health" "Admin Panel"
test_endpoint "http://localhost:3001/api/captcha" "CAPTCHA API"

echo ""
echo -e "${GREEN}🎉 Quick test complete!${NC}"
echo ""
echo -e "${YELLOW}Access your services:${NC}"
echo "• Website: http://localhost:3000"
echo "• Admin Panel: http://localhost:3002 (admin/change-this-password-immediately)"
echo ""
echo -e "${YELLOW}To stop:${NC} $COMPOSE_CMD $COMPOSE_FILE down"
echo -e "${YELLOW}To cleanup:${NC} ./cleanup.sh"