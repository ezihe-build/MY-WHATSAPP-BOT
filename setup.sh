#!/bin/bash

# EZIHE SUPER BOT - Setup Script
# This script helps you set up the bot quickly

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ███████╗███████╗██╗██╗  ██╗███████╗    SUPER BOT v2.0      ║"
echo "║   ██╔════╝╚══███╔╝██║██║  ██║██╔════╝                        ║"
echo "║   █████╗    ███╔╝ ██║███████║█████╗                          ║"
echo "║   ██╔══╝   ███╔╝  ██║██╔══██║██╔══╝                          ║"
echo "║   ███████╗███████╗██║██║  ██║███████╗                        ║"
echo "║   ╚══════╝╚══════╝╚═╝╚═╝  ╚═╝╚══════╝                        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed!${NC}"
    echo "Please install Node.js 18 or higher: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version 18 or higher is required!${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"

# Check if npm is installed
echo -e "${BLUE}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) installed${NC}"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration!${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p data downloads logs temp assets

echo -e "${GREEN}✓ Directories created${NC}"

# Display next steps
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Edit the .env file with your settings:"
echo "   nano .env"
echo ""
echo "2. Required settings:"
echo "   - BOT_TOKEN (get from @BotFather)"
echo "   - OWNER_ID (your Telegram user ID)"
echo ""
echo "3. Start the bot:"
echo "   npm start"
echo ""
echo "4. Or use PM2 for production:"
echo "   npm install -g pm2"
echo "   npm run pm2:start"
echo ""
echo -e "${BLUE}For more information, see README.md${NC}"
echo ""
echo -e "${GREEN}Happy botting! 🚀${NC}"
