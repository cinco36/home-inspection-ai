#!/bin/bash

# Test script to verify file details functionality

echo "🧪 Testing File Details Functionality"
echo "====================================="

# Test 1: Check API health
echo "1. Testing API health..."
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

# Test 2: Check files endpoint
echo "2. Testing files endpoint..."
FILES_RESPONSE=$(curl -s http://localhost:3000/api/v1/files)
if echo "$FILES_RESPONSE" | grep -q "success"; then
    echo "✅ Files endpoint working"
    
    # Check if files have AI fields
    if echo "$FILES_RESPONSE" | grep -q "ai_summary\|ai_recommendations\|ai_status"; then
        echo "✅ Files have AI fields in response"
    else
        echo "⚠️  Files may not have AI fields yet"
    fi
else
    echo "❌ Files endpoint failed"
    echo "Response: $FILES_RESPONSE"
    exit 1
fi

# Test 3: Check database schema
echo "3. Testing database schema..."
cd home-inspection-api

# Check if required columns exist
COLUMNS=$(docker exec home-inspection-postgres psql -U postgres -d home_inspection -t -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'files' 
AND column_name IN ('ai_summary', 'ai_recommendations', 'ai_cost_cents', 'ai_processed_at', 'ai_status', 'updated_at')
ORDER BY column_name;
")

REQUIRED_COLUMNS=("ai_summary" "ai_recommendations" "ai_cost_cents" "ai_processed_at" "ai_status" "updated_at")
MISSING_COLUMNS=()

for column in "${REQUIRED_COLUMNS[@]}"; do
    if echo "$COLUMNS" | grep -q "$column"; then
        echo "✅ Column '$column' exists"
    else
        echo "❌ Column '$column' missing"
        MISSING_COLUMNS+=("$column")
    fi
done

if [ ${#MISSING_COLUMNS[@]} -eq 0 ]; then
    echo "✅ All required database columns are present"
else
    echo "❌ Missing columns: ${MISSING_COLUMNS[*]}"
    exit 1
fi

# Test 4: Check React frontend
echo "4. Testing React frontend..."
cd ..

if curl -s http://localhost:3000/react/ | grep -q "Home Inspection"; then
    echo "✅ React frontend is accessible"
else
    echo "❌ React frontend not accessible"
fi

# Test 5: Check basic frontend
echo "5. Testing basic frontend..."
if curl -s http://localhost:3000/upload.html | grep -q "File Upload Test"; then
    echo "✅ Basic upload frontend is accessible"
else
    echo "❌ Basic upload frontend not accessible"
fi

# Test 6: Check queue monitor
echo "6. Testing queue monitor..."
if curl -s http://localhost:3000/queue-monitor.html | grep -q "Queue Monitor"; then
    echo "✅ Queue monitor is accessible"
else
    echo "❌ Queue monitor not accessible"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📋 To test file details manually:"
echo "1. Go to http://localhost:3000/react"
echo "2. Upload a PDF file"
echo "3. Click on a file to view details"
echo "4. You should see extracted text and AI output"
echo ""
echo "🔧 If issues persist:"
echo "- Check the logs: tail -f api-server.log worker.log"
echo "- Restart services: ./fix-file-details.sh"
echo "- Check database: docker exec home-inspection-postgres psql -U postgres -d home_inspection -c '\\d files'" 