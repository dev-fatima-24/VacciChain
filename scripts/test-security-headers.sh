#!/bin/bash

# Script to test security headers on VacciChain frontend and backend
# Usage: ./scripts/test-security-headers.sh [URL]
# Default URL: http://localhost:3000

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_URL="${1:-http://localhost:3000}"
BACKEND_URL="${2:-http://localhost:4000}"

echo -e "${BLUE}🔒 VacciChain Security Headers Test${NC}"
echo -e "${BLUE}====================================${NC}\n"

# Function to check if a header exists and display it
check_header() {
    local url=$1
    local header_name=$2
    local expected=$3
    
    response=$(curl -s -I "$url" 2>/dev/null | grep -i "^${header_name}:" || echo "")
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}✓${NC} ${header_name}: ${response#*: }"
        if [ -n "$expected" ]; then
            if echo "$response" | grep -qi "$expected"; then
                echo -e "  ${GREEN}→ Contains expected value: $expected${NC}"
            else
                echo -e "  ${YELLOW}⚠ Expected to contain: $expected${NC}"
            fi
        fi
    else
        echo -e "${RED}✗${NC} ${header_name}: ${RED}NOT FOUND${NC}"
        return 1
    fi
}

# Test Frontend
echo -e "${BLUE}Testing Frontend: ${FRONTEND_URL}${NC}"
echo "----------------------------------------"

FRONTEND_PASS=true

check_header "$FRONTEND_URL" "Content-Security-Policy" "default-src" || FRONTEND_PASS=false
check_header "$FRONTEND_URL" "X-Frame-Options" "DENY" || FRONTEND_PASS=false
check_header "$FRONTEND_URL" "X-Content-Type-Options" "nosniff" || FRONTEND_PASS=false
check_header "$FRONTEND_URL" "Referrer-Policy" "strict-origin-when-cross-origin" || FRONTEND_PASS=false
check_header "$FRONTEND_URL" "X-XSS-Protection" "1; mode=block" || FRONTEND_PASS=false
check_header "$FRONTEND_URL" "Permissions-Policy" "" || FRONTEND_PASS=false

echo ""

# Test Backend API
echo -e "${BLUE}Testing Backend API: ${BACKEND_URL}/health${NC}"
echo "----------------------------------------"

BACKEND_PASS=true

check_header "${BACKEND_URL}/health" "X-Frame-Options" "DENY" || BACKEND_PASS=false
check_header "${BACKEND_URL}/health" "X-Content-Type-Options" "nosniff" || BACKEND_PASS=false
check_header "${BACKEND_URL}/health" "Referrer-Policy" "strict-origin-when-cross-origin" || BACKEND_PASS=false
check_header "${BACKEND_URL}/health" "X-XSS-Protection" "1; mode=block" || BACKEND_PASS=false
check_header "${BACKEND_URL}/health" "Content-Security-Policy" "" || BACKEND_PASS=false

echo ""
echo -e "${BLUE}====================================${NC}"

# Summary
if [ "$FRONTEND_PASS" = true ] && [ "$BACKEND_PASS" = true ]; then
    echo -e "${GREEN}✓ All security headers are properly configured!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Test with securityheaders.com for comprehensive analysis"
    echo "2. Test with Mozilla Observatory: https://observatory.mozilla.org/"
    echo "3. Verify CSP doesn't break functionality in browser console"
    exit 0
else
    echo -e "${RED}✗ Some security headers are missing or misconfigured${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Ensure Docker containers are running: docker compose up"
    echo "2. Check Nginx configuration: frontend/nginx.conf"
    echo "3. Check backend middleware: backend/src/middleware/securityHeaders.js"
    echo "4. Restart services after configuration changes"
    exit 1
fi
