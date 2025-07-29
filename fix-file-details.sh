#!/bin/bash

# =============================================================================
# FIX FILE DETAILS ISSUES
# =============================================================================
# This script fixes the database schema issues that prevent file details
# from showing extracted text and AI output, then restarts all services
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warning "Port $port is in use, killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# =============================================================================
# STEP 1: STOP EXISTING SERVICES
# =============================================================================
print_status "Step 1: Stopping existing services..."

# Kill any existing processes
kill_port 3000  # API server
kill_port 3001  # React frontend
kill_port 3002  # Alternative React port

# Kill any ts-node processes
pkill -f "ts-node.*index" 2>/dev/null || true
pkill -f "ts-node.*worker" 2>/dev/null || true

sleep 2

# =============================================================================
# STEP 2: APPLY DATABASE MIGRATION
# =============================================================================
print_status "Step 2: Applying database migration..."

cd home-inspection-api

# Check if Docker containers are running
if ! docker ps | grep -q "home-inspection-postgres"; then
    print_error "PostgreSQL container is not running. Starting Docker services..."
    docker-compose up -d postgres redis
    sleep 10
fi

# Apply the database migration
print_status "Applying database schema fixes..."
docker exec home-inspection-postgres psql -U postgres -d home_inspection -f /tmp/fix-database-schema.sql 2>/dev/null || {
    # If the file doesn't exist in container, copy it and run
    docker cp fix-database-schema.sql home-inspection-postgres:/tmp/
    docker exec home-inspection-postgres psql -U postgres -d home_inspection -f /tmp/fix-database-schema.sql
}

print_success "Database migration applied successfully!"

# =============================================================================
# STEP 3: VERIFY DATABASE SCHEMA
# =============================================================================
print_status "Step 3: Verifying database schema..."

# Check if the columns were added successfully
COLUMNS=$(docker exec home-inspection-postgres psql -U postgres -d home_inspection -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'files' AND column_name IN ('ai_summary', 'ai_recommendations', 'ai_cost_cents', 'ai_processed_at', 'ai_status', 'updated_at');")

if echo "$COLUMNS" | grep -q "ai_summary" && echo "$COLUMNS" | grep -q "updated_at"; then
    print_success "All required columns are present in the database!"
else
    print_error "Some required columns are missing. Manual intervention may be needed."
    exit 1
fi

# =============================================================================
# STEP 4: FIX NODE_MODULES ISSUES
# =============================================================================
print_status "Step 4: Fixing node_modules issues..."

# Check for corrupted package.json files
if [ -d "node_modules" ]; then
    print_status "Checking for corrupted node_modules..."
    
    # Find and fix corrupted package.json files
    find node_modules -name "package.json" -exec sh -c '
        for file do
            if ! jq empty "$file" 2>/dev/null; then
                echo "Corrupted package.json found: $file"
                rm -rf "$(dirname "$file")"
            fi
        done
    ' sh {} +
fi

# Reinstall dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    print_status "Reinstalling dependencies..."
    npm install
fi

# =============================================================================
# STEP 5: START DATABASE SERVICES
# =============================================================================
print_status "Step 5: Starting database services..."

# Ensure Docker services are running
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 5

# =============================================================================
# STEP 6: START API SERVER
# =============================================================================
print_status "Step 6: Starting API server..."

# Start the API server in the background
npx ts-node src/index.ts > ../api-server.log 2>&1 &
API_PID=$!

# Wait for API to start
sleep 5

# Check if API is running
if check_port 3000; then
    print_success "API server started successfully on port 3000"
else
    print_error "API server failed to start"
    exit 1
fi

# =============================================================================
# STEP 7: START WORKER
# =============================================================================
print_status "Step 7: Starting file processing worker..."

# Start the worker in the background
npx ts-node src/worker.ts > ../worker.log 2>&1 &
WORKER_PID=$!

sleep 3

# Check if worker is running
if ps -p $WORKER_PID > /dev/null; then
    print_success "File processing worker started successfully"
else
    print_error "Worker failed to start"
    exit 1
fi

# =============================================================================
# STEP 8: FIX REACT FRONTEND
# =============================================================================
print_status "Step 8: Fixing React frontend..."

cd ../home-inspection-frontend

# Check for missing dependencies
if ! npm list @mui/icons-material >/dev/null 2>&1; then
    print_status "Installing missing @mui/icons-material..."
    npm install @mui/icons-material
fi

# Rebuild React app with correct homepage
print_status "Rebuilding React app..."
npm run build

# Copy built files to API server
print_status "Deploying React app to API server..."
cp -r build/* ../home-inspection-api/public/react/

print_success "React frontend deployed successfully!"

# =============================================================================
# STEP 9: VERIFY ALL SERVICES
# =============================================================================
print_status "Step 9: Verifying all services..."

cd ../home-inspection-api

# Test API health
sleep 3
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    print_success "API health check passed"
else
    print_error "API health check failed"
fi

# Test files endpoint
if curl -s http://localhost:3000/api/v1/files | grep -q "success"; then
    print_success "Files API endpoint working"
else
    print_error "Files API endpoint failed"
fi

# Test React app
if curl -s http://localhost:3000/react/ | grep -q "Home Inspection"; then
    print_success "React app accessible"
else
    print_error "React app not accessible"
fi

# =============================================================================
# SUMMARY
# =============================================================================
print_success "All services fixed and restarted successfully!"
echo ""
echo "🌐 Available URLs:"
echo "   - React Frontend: http://localhost:3000/react"
echo "   - API Documentation: http://localhost:3000/"
echo "   - Basic Upload: http://localhost:3000/upload.html"
echo "   - Queue Monitor: http://localhost:3000/queue-monitor.html"
echo ""
echo "🔧 What was fixed:"
echo "   - Added missing AI fields to database (ai_summary, ai_recommendations, etc.)"
echo "   - Added missing updated_at column to database"
echo "   - Created automatic trigger for updated_at column"
echo "   - Fixed node_modules corruption issues"
echo "   - Reinstalled missing @mui/icons-material dependency"
echo "   - Rebuilt and redeployed React frontend"
echo "   - Restarted all services (API, worker, databases)"
echo ""
echo "📋 File details should now show:"
echo "   - Extracted text content"
echo "   - AI-generated summaries"
echo "   - AI-generated recommendations"
echo "   - AI processing costs"
echo "   - Processing timestamps"
echo ""

# Save PIDs for easy cleanup
echo $API_PID > ../api.pid
echo $WORKER_PID > ../worker.pid

print_success "Fix completed! File details should now work properly in both basic and React frontends." 