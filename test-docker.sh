#!/bin/bash

echo "🐳 Testing LVDA Container Setup..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect container runtime
CONTAINER_CMD=""
COMPOSE_CMD=""

# Check for Podman first (as it's often preferred on modern systems)
if command -v podman >/dev/null 2>&1; then
    if podman info >/dev/null 2>&1; then
        CONTAINER_CMD="podman"
        # Check for podman-compose
        if command -v podman-compose >/dev/null 2>&1; then
            COMPOSE_CMD="podman-compose"
        elif command -v docker-compose >/dev/null 2>&1 && podman-compose --version >/dev/null 2>&1; then
            COMPOSE_CMD="docker-compose"
        fi
        echo -e "${BLUE}🦭 Detected Podman container runtime${NC}"
    fi
fi

# Check for Docker if Podman not available or not working
if [ -z "$CONTAINER_CMD" ]; then
    if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
            CONTAINER_CMD="docker"
            # Check for docker-compose or docker compose
            if command -v docker-compose >/dev/null 2>&1; then
                COMPOSE_CMD="docker-compose"
            elif docker compose version >/dev/null 2>&1; then
                COMPOSE_CMD="docker compose"
            fi
            echo -e "${BLUE}🐳 Detected Docker container runtime${NC}"
        fi
    fi
fi

# If no container runtime found
if [ -z "$CONTAINER_CMD" ]; then
    echo -e "${RED}❌ No container runtime found or running${NC}"
    echo -e "${YELLOW}Please install and start either:${NC}"
    echo "  • Docker: https://docs.docker.com/get-docker/"
    echo "  • Podman: https://podman.io/getting-started/installation"
    exit 1
fi

echo -e "${GREEN}✅ Container runtime ($CONTAINER_CMD) is available${NC}"

# Check if compose is available
if [ -z "$COMPOSE_CMD" ]; then
    echo -e "${RED}❌ No compose command available${NC}"
    echo -e "${YELLOW}Please install:${NC}"
    if [ "$CONTAINER_CMD" = "podman" ]; then
        echo "  • podman-compose: pip install podman-compose"
        echo "  • or docker-compose: https://docs.docker.com/compose/install/"
    else
        echo "  • docker-compose: https://docs.docker.com/compose/install/"
    fi
    exit 1
fi

echo -e "${GREEN}✅ Compose command ($COMPOSE_CMD) is available${NC}"

# Select appropriate compose file
COMPOSE_FILE=""
if [ "$CONTAINER_CMD" = "podman" ]; then
    if [ -f "docker-compose.podman.yml" ]; then
        COMPOSE_FILE="-f docker-compose.podman.yml"
        echo -e "${BLUE}📋 Using Podman-specific compose file${NC}"
    fi
fi

# Build and start containers
echo -e "${YELLOW}🔨 Building containers...${NC}"
$COMPOSE_CMD $COMPOSE_FILE up --build -d

# Wait for containers to be ready
echo -e "${YELLOW}⏳ Waiting for containers to be ready...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container Status:${NC}"
$COMPOSE_CMD $COMPOSE_FILE ps

# Test endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"

# Test frontend
if curl -s http://localhost:3000 >/dev/null; then
    echo -e "${GREEN}✅ Frontend (http://localhost:3000) is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
fi

# Test backend health
if curl -s http://localhost:3001/health >/dev/null; then
    echo -e "${GREEN}✅ Backend API (http://localhost:3001) is accessible${NC}"
else
    echo -e "${RED}❌ Backend API is not accessible${NC}"
fi

# Test admin health
if curl -s http://localhost:3002/health >/dev/null; then
    echo -e "${GREEN}✅ Admin Panel (http://localhost:3002) is accessible${NC}"
else
    echo -e "${RED}❌ Admin Panel is not accessible${NC}"
fi

# Test CAPTCHA endpoint
if curl -s http://localhost:3001/api/captcha >/dev/null; then
    echo -e "${GREEN}✅ CAPTCHA API is working${NC}"
else
    echo -e "${RED}❌ CAPTCHA API is not working${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Access your services:${NC}"
echo "• Website: http://localhost:3000"
echo "• Admin Panel: http://localhost:3002 (admin/change-this-password-immediately)"
echo ""
echo -e "${YELLOW}To stop all containers:${NC}"
echo "$COMPOSE_CMD $COMPOSE_FILE down"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "$COMPOSE_CMD $COMPOSE_FILE logs -f"
echo ""
echo -e "${YELLOW}Container runtime used: ${BLUE}$CONTAINER_CMD${NC}"
echo -e "${YELLOW}Compose command used: ${BLUE}$COMPOSE_CMD${NC}"