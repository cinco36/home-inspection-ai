#!/bin/bash

# React App Deployment Script
# This script builds the React app and deploys it to the API server

echo "🚀 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Copying files to API server..."
    
    # Create react directory if it doesn't exist
    mkdir -p ../home-inspection-api/public/react
    
    # Copy built files
    cp -r build/* ../home-inspection-api/public/react/
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 React app is now available at: http://localhost:3000/react"
        echo "📋 Other available URLs:"
        echo "   - API Documentation: http://localhost:3000/"
        echo "   - Basic Upload: http://localhost:3000/upload.html"
        echo "   - Queue Monitor: http://localhost:3000/queue-monitor.html"
    else
        echo "❌ Failed to copy files to API server"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi 