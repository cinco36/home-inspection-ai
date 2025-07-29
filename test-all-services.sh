#!/bin/bash

echo "🧪 Testing All Services - Comprehensive Check"
echo "============================================="

# Test Docker containers
echo "1. Testing Docker containers..."
if docker ps | grep -q "home-inspection-postgres"; then
    echo "   ✅ PostgreSQL container is running"
else
    echo "   ❌ PostgreSQL container is not running"
fi

if docker ps | grep -q "home-inspection-redis"; then
    echo "   ✅ Redis container is running"
else
    echo "   ❌ Redis container is not running"
fi

# Test database connection
echo ""
echo "2. Testing database connection..."
DB_RESPONSE=$(docker exec home-inspection-postgres psql -U postgres -d home_inspection -c "SELECT NOW();" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
fi

# Test Redis connection
echo ""
echo "3. Testing Redis connection..."
REDIS_RESPONSE=$(docker exec home-inspection-redis redis-cli ping 2>/dev/null)
if [ $? -eq 0 ] && [ "$REDIS_RESPONSE" = "PONG" ]; then
    echo "   ✅ Redis connection successful"
else
    echo "   ❌ Redis connection failed"
fi

# Check if API server is running
echo ""
echo "4. Testing API server..."
API_RESPONSE=$(curl -s http://localhost:3000/api/v1/files 2>/dev/null)
if [ $? -eq 0 ] && echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ API server is responding"
else
    echo "   ❌ API server is not responding"
    echo "   Response: $API_RESPONSE"
fi

# Check if worker is running
echo ""
echo "5. Testing worker..."
WORKER_PROCESSES=$(ps aux | grep -E "ts-node.*worker" | grep -v grep | wc -l)
if [ $WORKER_PROCESSES -gt 0 ]; then
    echo "   ✅ Worker is running ($WORKER_PROCESSES processes)"
else
    echo "   ❌ Worker is not running"
fi

# Test basic frontend
echo ""
echo "6. Testing basic frontend..."
BASIC_RESPONSE=$(curl -s http://localhost:3000/upload.html 2>/dev/null)
if [ $? -eq 0 ] && echo "$BASIC_RESPONSE" | grep -q "Home Inspection API"; then
    echo "   ✅ Basic frontend is accessible"
else
    echo "   ❌ Basic frontend is not accessible"
fi

# Test queue monitor
echo ""
echo "7. Testing queue monitor..."
QUEUE_RESPONSE=$(curl -s http://localhost:3000/queue-monitor.html 2>/dev/null)
if [ $? -eq 0 ] && echo "$QUEUE_RESPONSE" | grep -q "Queue Monitor"; then
    echo "   ✅ Queue monitor is accessible"
else
    echo "   ❌ Queue monitor is not accessible"
fi

# Test React frontend
echo ""
echo "8. Testing React frontend..."
REACT_RESPONSE=$(curl -s http://localhost:3000/react/ 2>/dev/null)
if [ $? -eq 0 ] && echo "$REACT_RESPONSE" | grep -q "Home Inspection File Processor"; then
    echo "   ✅ React frontend is accessible"
else
    echo "   ❌ React frontend is not accessible"
fi

# Test queue status API
echo ""
echo "9. Testing queue status API..."
QUEUE_API_RESPONSE=$(curl -s http://localhost:3000/api/v1/queue/status 2>/dev/null)
if [ $? -eq 0 ] && echo "$QUEUE_API_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Queue status API is working"
else
    echo "   ❌ Queue status API is not working"
    echo "   Response: $QUEUE_API_RESPONSE"
fi

# Check TypeScript compilation
echo ""
echo "10. Testing TypeScript compilation..."
cd home-inspection-api
COMPILE_OUTPUT=$(npx tsc --noEmit 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ TypeScript compilation successful"
else
    echo "   ❌ TypeScript compilation failed"
    echo "   Errors:"
    echo "$COMPILE_OUTPUT" | head -10
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo "   - API Server: http://localhost:3000"
echo "   - Basic Frontend: http://localhost:3000/upload.html"
echo "   - Queue Monitor: http://localhost:3000/queue-monitor.html"
echo "   - React Frontend: http://localhost:3000/react/"
echo ""
echo "📋 Next Steps:"
echo "   If services are not working, check the logs above for specific issues"
echo "   Common issues:"
echo "   - Database connection problems"
echo "   - Redis connection problems"
echo "   - TypeScript compilation errors"
echo "   - Missing dependencies"
echo ""
echo "✨ Service test complete!" 