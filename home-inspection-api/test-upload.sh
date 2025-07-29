#!/bin/bash

echo "🧪 Testing File Upload Functionality"
echo "===================================="

BASE_URL="http://localhost:3000"

# Test 1: Check if server is running
echo -e "\n1️⃣ Testing server connection..."
curl -s "$BASE_URL/" | jq '.' || echo "Server not responding"

# Test 2: List files (should be empty initially)
echo -e "\n2️⃣ Testing GET /api/v1/files (should be empty)..."
curl -s "$BASE_URL/api/v1/files" | jq '.' || echo "List files test failed"

# Test 3: Try to upload without file (should fail)
echo -e "\n3️⃣ Testing POST /api/v1/upload without file (should fail)..."
curl -s -X POST "$BASE_URL/api/v1/upload" | jq '.' || echo "Upload without file test failed"

# Test 4: Create a test PDF file
echo -e "\n4️⃣ Creating test PDF file..."
echo "%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [] /Count 0 >>
endobj
xref
0 3
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
trailer
<< /Size 3 /Root 1 0 R >>
startxref
77
%%EOF" > test.pdf

# Test 5: Upload the test PDF file
echo -e "\n5️⃣ Testing POST /api/v1/upload with PDF file..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/upload" \
  -F "file=@test.pdf")
echo "$UPLOAD_RESPONSE" | jq '.' || echo "Upload test failed"

# Extract the file ID from the response
FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ "$FILE_ID" != "null" ] && [ -n "$FILE_ID" ]; then
    echo -e "\n6️⃣ Testing GET /api/v1/files (should now have 1 file)..."
    curl -s "$BASE_URL/api/v1/files" | jq '.' || echo "List files after upload test failed"
    
    echo -e "\n7️⃣ Testing GET /api/v1/upload/$FILE_ID/download (download file)..."
    curl -s -I "$BASE_URL/api/v1/upload/$FILE_ID/download" | head -5 || echo "Download test failed"
    
    echo -e "\n8️⃣ Testing GET /api/v1/files/$FILE_ID (get file details)..."
    curl -s "$BASE_URL/api/v1/files/$FILE_ID" | jq '.' || echo "Get file details test failed"
else
    echo -e "\n❌ Failed to upload file, skipping subsequent tests"
fi

# Test 9: Try to upload invalid file type
echo -e "\n9️⃣ Creating test text file (invalid type)..."
echo "This is a test text file" > test.txt

echo -e "\n🔟 Testing POST /api/v1/upload with invalid file type (should fail)..."
curl -s -X POST "$BASE_URL/api/v1/upload" \
  -F "file=@test.txt" | jq '.' || echo "Invalid file type test failed"

# Test 11: Try to upload large file (create 11MB file)
echo -e "\n1️⃣1️⃣ Creating large test file (11MB)..."
dd if=/dev/zero of=large.pdf bs=1M count=11 2>/dev/null

echo -e "\n1️⃣2️⃣ Testing POST /api/v1/upload with large file (should fail)..."
curl -s -X POST "$BASE_URL/api/v1/upload" \
  -F "file=@large.pdf" | jq '.' || echo "Large file test failed"

# Cleanup
echo -e "\n🧹 Cleaning up test files..."
rm -f test.pdf test.txt large.pdf

echo -e "\n✅ Upload functionality test completed!"
echo -e "\n📝 Manual Testing:"
echo "   - Visit http://localhost:3000/upload.html for web interface"
echo "   - Use Postman to test upload endpoint"
echo "   - Check uploads/ directory for stored files" 