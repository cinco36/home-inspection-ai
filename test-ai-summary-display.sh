#!/bin/bash

echo "🧪 Testing AI Summary Display in Both Frontends"
echo "================================================"

# Test API endpoint for AI data
echo "1. Testing API endpoint for AI data..."
API_RESPONSE=$(curl -s http://localhost:3000/api/v1/files | jq '.data[] | select(.ai_status == "completed") | {id, original_filename, ai_summary, ai_recommendations}' 2>/dev/null)

if [ $? -eq 0 ] && [ "$API_RESPONSE" != "" ]; then
    echo "✅ API returning AI data successfully"
    echo "   Sample AI Summary: $(echo "$API_RESPONSE" | jq -r '.ai_summary' | cut -c1-100)..."
else
    echo "❌ API not returning AI data"
fi

# Test React frontend
echo ""
echo "2. Testing React frontend..."
REACT_RESPONSE=$(curl -s http://localhost:3000/react/ | grep -o "Home Inspection File Processor" 2>/dev/null)

if [ $? -eq 0 ] && [ "$REACT_RESPONSE" != "" ]; then
    echo "✅ React frontend is accessible"
    echo "   URL: http://localhost:3000/react/"
else
    echo "❌ React frontend not accessible"
fi

# Test basic queue monitor
echo ""
echo "3. Testing basic queue monitor..."
QUEUE_RESPONSE=$(curl -s http://localhost:3000/queue-monitor.html | grep -o "Queue Monitor" 2>/dev/null)

if [ $? -eq 0 ] && [ "$QUEUE_RESPONSE" != "" ]; then
    echo "✅ Basic queue monitor is accessible"
    echo "   URL: http://localhost:3000/queue-monitor.html"
else
    echo "❌ Basic queue monitor not accessible"
fi

# Test API health
echo ""
echo "4. Testing API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/v1/health | jq -r '.status' 2>/dev/null)

if [ $? -eq 0 ] && [ "$HEALTH_RESPONSE" = "healthy" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
fi

echo ""
echo "🎯 Summary:"
echo "   - React Frontend: http://localhost:3000/react/"
echo "   - Basic Queue Monitor: http://localhost:3000/queue-monitor.html"
echo "   - API Health: http://localhost:3000/api/v1/health"
echo ""
echo "📋 To test AI summary display:"
echo "   1. Open React frontend and click 'View Details' on a completed file"
echo "   2. Check the 'AI Analysis' section for summary and recommendations"
echo "   3. Open basic queue monitor to see AI status column"
echo ""
echo "✨ AI Summary Display Test Complete!" 