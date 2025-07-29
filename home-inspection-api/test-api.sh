#!/bin/bash

echo "🧪 Testing Home Inspection API with PostgreSQL"
echo "=============================================="

BASE_URL="http://localhost:3000"

# Test 1: Root endpoint
echo -e "\n1️⃣ Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.' || echo "Root endpoint test failed"

# Test 2: Health check
echo -e "\n2️⃣ Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health endpoint test failed"

# Test 3: List files (should be empty initially)
echo -e "\n3️⃣ Testing GET /api/v1/files (should be empty)..."
curl -s "$BASE_URL/api/v1/files" | jq '.' || echo "List files test failed"

# Test 4: Create a test file
echo -e "\n4️⃣ Testing POST /api/v1/files (create test file)..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/files" \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.pdf", "size": 1024}')
echo "$CREATE_RESPONSE" | jq '.' || echo "Create file test failed"

# Extract the file ID from the response
FILE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ "$FILE_ID" != "null" ] && [ -n "$FILE_ID" ]; then
    echo -e "\n5️⃣ Testing GET /api/v1/files/$FILE_ID (get specific file)..."
    curl -s "$BASE_URL/api/v1/files/$FILE_ID" | jq '.' || echo "Get specific file test failed"
    
    echo -e "\n6️⃣ Testing GET /api/v1/files (should now have 1 file)..."
    curl -s "$BASE_URL/api/v1/files" | jq '.' || echo "List files after creation test failed"
    
    echo -e "\n7️⃣ Testing DELETE /api/v1/files/$FILE_ID (delete file)..."
    curl -s -X DELETE "$BASE_URL/api/v1/files/$FILE_ID" | jq '.' || echo "Delete file test failed"
    
    echo -e "\n8️⃣ Testing GET /api/v1/files (should be empty again)..."
    curl -s "$BASE_URL/api/v1/files" | jq '.' || echo "List files after deletion test failed"
else
    echo -e "\n❌ Failed to create file, skipping subsequent tests"
fi

# Test 9: Error handling - invalid file creation
echo -e "\n9️⃣ Testing error handling (invalid file data)..."
curl -s -X POST "$BASE_URL/api/v1/files" \
  -H "Content-Type: application/json" \
  -d '{"filename": "", "size": -1}' | jq '.' || echo "Error handling test failed"

echo -e "\n✅ Test script completed!" 