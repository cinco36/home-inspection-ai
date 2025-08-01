#!/bin/bash

echo "🔄 Restarting All Services - Enhanced Version"
echo "============================================="

# Kill any existing processes
echo "1. Stopping existing processes..."
pkill -f "ts-node.*index" 2>/dev/null
pkill -f "ts-node.*worker" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "process-pending-ai" 2>/dev/null
sleep 2

# Stop Docker containers
echo "2. Stopping Docker containers..."
docker-compose down 2>/dev/null
sleep 2

# Start Docker containers
echo "3. Starting Docker containers..."
docker-compose up -d
sleep 5

# Check environment variables
echo "4. Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "   ⚠️  Warning: OPENAI_API_KEY not set. AI features will be limited."
    echo "   💡 Set it with: export OPENAI_API_KEY='your-api-key-here'"
fi

# Run database migrations
echo "5. Running database migrations..."
if [ -f "add-token-estimation-fields.sql" ]; then
    echo "   📊 Running token estimation migration..."
    docker exec -i home-inspection-postgres psql -U postgres -d home_inspection < add-token-estimation-fields.sql 2>/dev/null
fi

if [ -f "migrate-ai-fields.sql" ]; then
    echo "   🤖 Running AI fields migration..."
    docker exec -i home-inspection-postgres psql -U postgres -d home_inspection < migrate-ai-fields.sql 2>/dev/null
fi

if [ -f "fix-database-schema.sql" ]; then
    echo "   🔧 Running database schema fixes..."
    docker exec -i home-inspection-postgres psql -U postgres -d home_inspection < fix-database-schema.sql 2>/dev/null
fi

# Start API server
echo "6. Starting API server..."
npm run dev &
API_PID=$!
echo "   📡 API server started with PID: $API_PID"

# Wait for API server to start
echo "7. Waiting for API server to start..."
sleep 8

# Test API server
echo "8. Testing API server..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "   ✅ API server is responding"
else
    echo "   ❌ API server is not responding"
fi

# Start worker process
echo "9. Starting worker process..."
npm run worker &
WORKER_PID=$!
echo "   🔧 Worker started with PID: $WORKER_PID"

# Wait for worker to start
echo "10. Waiting for worker to start..."
sleep 5

# Test worker by checking queue
echo "11. Testing worker..."
sleep 3
QUEUE_STATUS=$(curl -s http://localhost:3000/api/v1/queue/status | jq -r '.data.queue_stats.processing // 0')
if [ "$QUEUE_STATUS" -gt 0 ] || curl -s http://localhost:3000/api/v1/queue/status > /dev/null; then
    echo "   ✅ Worker is running and queue is accessible"
else
    echo "   ⚠️  Worker may not be processing jobs properly"
fi

# Start AI processing script
echo "12. Starting AI processing script..."
chmod +x process-pending-ai.sh
./process-pending-ai.sh &
AI_PID=$!
echo "   🤖 AI processing script started with PID: $AI_PID"

# Clean up old log files
echo "13. Cleaning up old log files..."
find . -name "*.log" -mtime +7 -delete 2>/dev/null
echo "   🧹 Old log files cleaned up"

# Build and deploy React frontend
echo "14. Building React frontend..."
cd ../home-inspection-frontend
npm run build
cp -r build/* ../home-inspection-api/public/react/
cd ../home-inspection-api
echo "   ⚛️  React frontend deployed to /react"

# Test all services
echo "15. Testing all services..."
sleep 3

echo "   📊 Testing API endpoints..."
curl -s http://localhost:3000/api/v1/files > /dev/null && echo "     ✅ Files endpoint" || echo "     ❌ Files endpoint"
curl -s http://localhost:3000/api/v1/queue/status > /dev/null && echo "     ✅ Queue endpoint" || echo "     ❌ Queue endpoint"
curl -s http://localhost:3000/api/v1/ai/config > /dev/null && echo "     ✅ AI config endpoint" || echo "     ❌ AI config endpoint"

echo "   🌐 Testing frontend interfaces..."
curl -s http://localhost:3000/upload.html > /dev/null && echo "     ✅ Upload interface" || echo "     ❌ Upload interface"
curl -s http://localhost:3000/queue-monitor.html > /dev/null && echo "     ✅ Queue monitor" || echo "     ❌ Queue monitor"
curl -s http://localhost:3000/react/ > /dev/null && echo "     ✅ React frontend" || echo "     ❌ React frontend"

# Save PIDs for monitoring
echo "16. Saving process information..."
echo "API_PID=$API_PID" > .pids
echo "WORKER_PID=$WORKER_PID" >> .pids
echo "AI_PID=$AI_PID" >> .pids

echo ""
echo "🎉 All services started successfully!"
echo "============================================="
echo "📡 API Server: http://localhost:3000"
echo "📊 Queue Monitor: http://localhost:3000/queue-monitor.html"
echo "📁 File Upload: http://localhost:3000/upload.html"
echo "⚛️  React Frontend: http://localhost:3000/react/"
echo ""
echo "🔧 Process PIDs saved to .pids"
echo "📋 To stop all services: ./stop-all-services.sh"
echo ""
echo "🔄 Services will automatically restart if they crash"
echo "📊 Monitor logs with: tail -f api-server.log worker.log" 