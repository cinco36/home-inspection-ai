#!/bin/bash

echo "🔄 Restarting All Services - Enhanced Version"
echo "============================================="

echo "1. Stopping existing processes..."
pkill -f "ts-node.*index" 2>/dev/null
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
    echo "   ⚠️  Warning: OPENAI_API_KEY not set. AI features may not work."
    echo "   💡 Set it with: export OPENAI_API_KEY='your-key-here'"
fi

# Run database migrations
echo "5. Running database migrations..."
if [ -f "migrate-ai-fields.sql" ]; then
    echo "   Running AI fields migration..."
    docker exec home-inspection-postgres psql -U postgres -d home_inspection -f /var/lib/postgresql/data/migrate-ai-fields.sql 2>/dev/null || echo "   Migration already applied or failed"
fi

if [ -f "fix-database-schema.sql" ]; then
    echo "   Running schema fixes..."
    docker exec home-inspection-postgres psql -U postgres -d home_inspection -f /var/lib/postgresql/data/fix-database-schema.sql 2>/dev/null || echo "   Schema fixes already applied or failed"
fi

# Fix node_modules issues
echo "6. Fixing node_modules issues..."
rm -rf node_modules package-lock.json
npm install

# Install missing dependencies
echo "7. Installing missing dependencies..."
npm install @mui/icons-material --save

# Fix TypeScript compilation issues
echo "8. Checking TypeScript files..."
if [ ! -f "src/database/connection.ts" ]; then
    echo "   Creating missing connection.ts..."
    cat > src/database/connection.ts << 'EOF'
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/home_inspection',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
EOF
fi

# Ensure all imports are uncommented in app.ts
echo "9. Fixing app.ts imports..."
sed -i '' 's|// import queueRouter|import queueRouter|g' src/app.ts
sed -i '' 's|// import aiRouter|import aiRouter|g' src/app.ts
sed -i '' 's|// app.use.*queue.*|app.use.*queue.*|g' src/app.ts
sed -i '' 's|// app.use.*ai.*|app.use.*ai.*|g' src/app.ts

# Fix files.ts imports
echo "10. Fixing files.ts imports..."
sed -i '' 's|// import fileProcessingQueue|import fileProcessingQueue|g' src/routes/files.ts
sed -i '' 's|// import aiService|import aiService|g' src/routes/files.ts

# Fix upload.ts imports
echo "11. Fixing upload.ts imports..."
sed -i '' 's|// import fileProcessingQueue|import fileProcessingQueue|g' src/routes/upload.ts

# Clean up old log files
echo "12. Cleaning up old log files..."
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Start API server
echo "13. Starting API server..."
npm run dev &
API_PID=$!
sleep 5

# Check if API is running
echo "14. Testing API server..."
for i in {1..10}; do
    if curl -s http://localhost:3000/api/v1/files > /dev/null; then
        echo "   ✅ API server is running on port 3000"
        break
    else
        echo "   ⏳ Waiting for API server... (attempt $i/10)"
        sleep 2
    fi
done

# Start worker
echo "15. Starting worker..."
npm run worker &
WORKER_PID=$!
sleep 3

# Start AI processing script (background)
echo "16. Starting AI processing script..."
chmod +x process-pending-ai.sh
while true; do
    ./process-pending-ai.sh
    sleep 30  # Run every 30 seconds
done &
AI_PROCESSOR_PID=$!
sleep 2

# Build React frontend
echo "17. Building React frontend..."
cd ../home-inspection-frontend

# Fix React dependencies
rm -rf node_modules package-lock.json
npm install

# Ensure homepage is set correctly
if ! grep -q '"homepage": "/react"' package.json; then
    echo "   Adding homepage to package.json..."
    sed -i '' 's|"private": true|"private": true,\n  "homepage": "/react"|' package.json
fi

# Build the React app
npm run build

# Copy to API public directory
echo "18. Deploying React app..."
rm -rf ../home-inspection-api/public/react
cp -r build ../home-inspection-api/public/react

# Test all services
echo "19. Testing all services..."
cd ../home-inspection-api

echo ""
echo "🧪 Service Status:"
echo "=================="

# Test API
if curl -s http://localhost:3000/api/v1/files | grep -q '"success":true'; then
    echo "✅ API Server: http://localhost:3000/api/v1/files"
else
    echo "❌ API Server: Not responding"
fi

# Test basic frontend
if curl -s http://localhost:3000/upload.html | grep -q "Home Inspection API"; then
    echo "✅ Basic Frontend: http://localhost:3000/upload.html"
else
    echo "❌ Basic Frontend: Not accessible"
fi

# Test queue monitor
if curl -s http://localhost:3000/queue-monitor.html | grep -q "Queue Monitor"; then
    echo "✅ Queue Monitor: http://localhost:3000/queue-monitor.html"
else
    echo "❌ Queue Monitor: Not accessible"
fi

# Test React frontend
if curl -s http://localhost:3000/react/ | grep -q "Home Inspection File Processor"; then
    echo "✅ React Frontend: http://localhost:3000/react/"
else
    echo "❌ React Frontend: Not accessible"
fi

# Test queue status API
if curl -s http://localhost:3000/api/v1/queue/status | grep -q '"success":true'; then
    echo "✅ Queue Status API: Working"
else
    echo "❌ Queue Status API: Not working"
fi

# Test AI endpoints
if curl -s http://localhost:3000/api/v1/ai/config | grep -q '"success":true'; then
    echo "✅ AI API: Working"
else
    echo "❌ AI API: Not working"
fi

echo ""
echo "🎯 Summary:"
echo "==========="
echo "   - API Server: http://localhost:3000"
echo "   - Basic Frontend: http://localhost:3000/upload.html"
echo "   - Queue Monitor: http://localhost:3000/queue-monitor.html"
echo "   - React Frontend: http://localhost:3000/react/"
echo "   - AI Processing: Running in background"
echo ""
echo "📋 Process IDs:"
echo "   - API Server: $API_PID"
echo "   - Worker: $WORKER_PID"
echo "   - AI Processor: $AI_PROCESSOR_PID"
echo ""
echo "✨ All services restarted and tested!"
echo ""
echo "🔧 To stop services:"
echo "   pkill -f 'ts-node.*index'"
echo "   pkill -f 'npm run worker'"
echo "   pkill -f 'process-pending-ai'"
echo ""
echo "📊 To monitor AI processing:"
echo "   tail -f process-pending-ai.log" 