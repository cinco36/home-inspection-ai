#!/bin/bash

echo "🧪 Testing Dual Frontend Setup"
echo "=============================="

# Test API health
echo "1. Testing API health..."
API_RESPONSE=$(curl -s http://localhost:3000/api/v1/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ API is responding"
else
    echo "❌ API not responding"
fi

# Test basic frontend (upload.html)
echo ""
echo "2. Testing basic frontend (upload.html)..."
BASIC_RESPONSE=$(curl -s http://localhost:3000/upload.html | grep -o "Home Inspection API - File Upload Test" 2>/dev/null)

if [ $? -eq 0 ] && [ "$BASIC_RESPONSE" != "" ]; then
    echo "✅ Basic frontend is accessible"
    echo "   URL: http://localhost:3000/upload.html"
else
    echo "❌ Basic frontend not accessible"
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

# Test React frontend (advanced)
echo ""
echo "4. Testing React frontend (advanced)..."
REACT_RESPONSE=$(curl -s http://localhost:3000/react/ | grep -o "Home Inspection File Processor" 2>/dev/null)

if [ $? -eq 0 ] && [ "$REACT_RESPONSE" != "" ]; then
    echo "✅ React frontend is accessible"
    echo "   URL: http://localhost:3000/react/"
else
    echo "❌ React frontend not accessible"
fi

# Test API endpoints
echo ""
echo "5. Testing API endpoints..."
FILES_RESPONSE=$(curl -s http://localhost:3000/api/v1/files | jq -r '.success' 2>/dev/null)

if [ $? -eq 0 ] && [ "$FILES_RESPONSE" = "true" ]; then
    echo "✅ Files API endpoint working"
else
    echo "❌ Files API endpoint not working"
fi

echo ""
echo "🎯 Summary:"
echo "   - Basic Frontend: http://localhost:3000/upload.html"
echo "   - Basic Queue Monitor: http://localhost:3000/queue-monitor.html"
echo "   - Advanced React Frontend: http://localhost:3000/react/"
echo ""
echo "📋 Frontend Features:"
echo "   Basic Frontend:"
echo "     - Simple file upload"
echo "     - Basic file list with status"
echo "     - Simple modal details view"
echo "     - No re-run functionality"
echo ""
echo "   Advanced React Frontend:"
echo "     - Modern UI with Material-UI"
echo "     - Advanced file management"
echo "     - Detailed file information"
echo "     - Re-run text extraction and AI processing"
echo "     - Real-time status updates"
echo ""
echo "✨ Dual Frontend Test Complete!" 