#!/bin/bash

echo "🔍 Simple PostgreSQL Database Test"
echo "=================================="

# Test 1: Check if files table is empty
echo -e "\n📋 Test 1: List all files (should be empty)"
curl -s http://localhost:3000/api/v1/files

# Test 2: Create a test file
echo -e "\n\n📝 Test 2: Create a test file"
curl -s -X POST http://localhost:3000/api/v1/files \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.pdf", "size": 1024}'

# Test 3: List files again (should have 1 file)
echo -e "\n\n📋 Test 3: List all files (should have 1 file)"
curl -s http://localhost:3000/api/v1/files

echo -e "\n\n✅ Test completed!" 