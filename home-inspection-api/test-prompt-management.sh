#!/bin/bash

echo "🧪 Testing Prompt Management System"
echo "==================================="

BASE_URL="http://localhost:3000"

# Test 1: Get current prompts
echo -e "\n1️⃣ Testing GET /api/v1/ai/prompts (get current prompts)..."
curl -s "$BASE_URL/api/v1/ai/prompts" | jq '.' || echo "Get current prompts test failed"

# Test 2: Get available versions
echo -e "\n2️⃣ Testing GET /api/v1/ai/prompts/versions/available (get available versions)..."
curl -s "$BASE_URL/api/v1/ai/prompts/versions/available" | jq '.' || echo "Get available versions test failed"

# Test 3: Get prompts for version 1.0
echo -e "\n3️⃣ Testing GET /api/v1/ai/prompts/1.0 (get version 1.0 prompts)..."
curl -s "$BASE_URL/api/v1/ai/prompts/1.0" | jq '.' || echo "Get version 1.0 prompts test failed"

# Test 4: Get prompts for version 1.1
echo -e "\n4️⃣ Testing GET /api/v1/ai/prompts/1.1 (get version 1.1 prompts)..."
curl -s "$BASE_URL/api/v1/ai/prompts/1.1" | jq '.' || echo "Get version 1.1 prompts test failed"

# Test 5: Set current version to 1.0
echo -e "\n5️⃣ Testing POST /api/v1/ai/prompts/version (set version to 1.0)..."
curl -s -X POST "$BASE_URL/api/v1/ai/prompts/version" \
  -H "Content-Type: application/json" \
  -d '{"version": "1.0"}' | jq '.' || echo "Set version to 1.0 test failed"

# Test 6: Verify current prompts changed
echo -e "\n6️⃣ Testing GET /api/v1/ai/prompts (verify version changed)..."
curl -s "$BASE_URL/api/v1/ai/prompts" | jq '.data.currentVersion' || echo "Verify version change test failed"

# Test 7: Set current version back to 1.1
echo -e "\n7️⃣ Testing POST /api/v1/ai/prompts/version (set version back to 1.1)..."
curl -s -X POST "$BASE_URL/api/v1/ai/prompts/version" \
  -H "Content-Type: application/json" \
  -d '{"version": "1.1"}' | jq '.' || echo "Set version back to 1.1 test failed"

# Test 8: Add custom prompt
echo -e "\n8️⃣ Testing POST /api/v1/ai/prompts/custom (add custom prompt)..."
curl -s -X POST "$BASE_URL/api/v1/ai/prompts/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-custom",
    "prompt": {
      "version": "custom-1.0",
      "date": "2024-07-30",
      "description": "Test custom prompt",
      "prompt": "This is a test custom prompt for {text}",
      "tags": ["test", "custom"]
    }
  }' | jq '.' || echo "Add custom prompt test failed"

# Test 9: Get custom prompts
echo -e "\n9️⃣ Testing GET /api/v1/ai/prompts/custom (get custom prompts)..."
curl -s "$BASE_URL/api/v1/ai/prompts/custom" | jq '.' || echo "Get custom prompts test failed"

# Test 10: Remove custom prompt
echo -e "\n🔟 Testing DELETE /api/v1/ai/prompts/custom/test-custom (remove custom prompt)..."
curl -s -X DELETE "$BASE_URL/api/v1/ai/prompts/custom/test-custom" | jq '.' || echo "Remove custom prompt test failed"

# Test 11: Test invalid version
echo -e "\n1️⃣1️⃣ Testing GET /api/v1/ai/prompts/invalid (test invalid version)..."
curl -s "$BASE_URL/api/v1/ai/prompts/invalid" | jq '.' || echo "Test invalid version test failed"

echo -e "\n✅ Prompt Management System Tests Complete!"
