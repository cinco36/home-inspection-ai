#!/bin/bash

echo "🤖 Processing pending AI jobs..."

# Get all files with completed text extraction but pending AI
PENDING_FILES=$(curl -s http://localhost:3000/api/v1/files | jq -r '.data[] | select(.processing_status == "completed" and .ai_status == "pending") | .id')

if [ -z "$PENDING_FILES" ]; then
    echo "✅ No pending AI jobs found"
    exit 0
fi

echo "📋 Found $(echo "$PENDING_FILES" | wc -l) files pending AI processing"

# Process each file
for fileId in $PENDING_FILES; do
    echo "🔄 Processing AI for file: $fileId"
    
    # Trigger AI processing
    response=$(curl -s -X POST http://localhost:3000/api/v1/ai/process-file/$fileId)
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        echo "✅ AI processing completed for file: $fileId"
    else
        error=$(echo "$response" | jq -r '.error // "Unknown error"')
        echo "❌ AI processing failed for file: $fileId: $error"
    fi
    
    # Small delay between requests
    sleep 2
done

echo "🎉 AI processing batch completed!" 