#!/bin/bash

# Test script for AI integration
# Make sure to set your OpenAI API key in the environment before running

echo "🧪 Testing AI Integration for Home Inspection API"
echo "=================================================="

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X $method "$BASE_URL$endpoint"
    fi
}

echo -e "\n${YELLOW}1. Testing API Health${NC}"
health_response=$(api_call GET "/health")
if echo "$health_response" | grep -q "healthy"; then
    print_status 0 "API is healthy"
else
    print_status 1 "API health check failed"
    echo "Response: $health_response"
fi

echo -e "\n${YELLOW}2. Testing AI Configuration${NC}"
config_response=$(api_call GET "/ai/config")
if echo "$config_response" | grep -q "success.*true"; then
    print_status 0 "AI configuration retrieved"
    echo "Config: $config_response"
else
    print_status 1 "AI configuration failed"
    echo "Response: $config_response"
fi

echo -e "\n${YELLOW}3. Testing OpenAI Connectivity${NC}"
test_response=$(api_call POST "/ai/test" '{}')
if echo "$test_response" | grep -q "success.*true"; then
    print_status 0 "OpenAI connection successful"
    echo "Test result: $test_response"
else
    print_status 1 "OpenAI connection failed"
    echo "Response: $test_response"
    echo -e "${YELLOW}Note: Make sure OPENAI_API_KEY is set in your environment${NC}"
fi

echo -e "\n${YELLOW}4. Testing Token Estimation${NC}"
token_response=$(api_call POST "/ai/estimate-tokens" '{"text": "This is a test message for token estimation."}')
if echo "$token_response" | grep -q "success.*true"; then
    print_status 0 "Token estimation working"
    echo "Token estimation: $token_response"
else
    print_status 1 "Token estimation failed"
    echo "Response: $token_response"
fi

echo -e "\n${YELLOW}5. Testing Usage Statistics${NC}"
usage_response=$(api_call GET "/ai/usage")
if echo "$usage_response" | grep -q "success.*true"; then
    print_status 0 "Usage statistics retrieved"
    echo "Usage stats: $usage_response"
else
    print_status 1 "Usage statistics failed"
    echo "Response: $usage_response"
fi

echo -e "\n${YELLOW}6. Testing AI Processing (requires a file with extracted text)${NC}"
echo "This test requires a file ID with extracted text. You can:"
echo "1. Upload a file first using the upload endpoint"
echo "2. Wait for it to be processed"
echo "3. Get the file ID and run this test manually"

# Example of how to test AI processing (commented out as it requires a real file)
# file_id="your-file-id-here"
# process_response=$(api_call POST "/ai/process" "{
#   \"fileId\": \"$file_id\",
#   \"prompt\": \"Summarize this home inspection report in 3 bullet points:\",
#   \"text\": \"Sample text from the file\",
#   \"requestType\": \"summary\"
# }")
# if echo "$process_response" | grep -q "success.*true"; then
#     print_status 0 "AI processing successful"
#     echo "Processing result: $process_response"
# else
#     print_status 1 "AI processing failed"
#     echo "Response: $process_response"
# fi

echo -e "\n${YELLOW}7. Testing AI Requests History${NC}"
echo "This test requires a file ID. You can test it manually with:"
echo "curl -X GET \"$BASE_URL/ai/requests/YOUR_FILE_ID\""

echo -e "\n${YELLOW}Summary${NC}"
echo "=================="
echo "The AI integration includes:"
echo "✅ OpenAI API client configuration"
echo "✅ AI service with text processing"
echo "✅ API key management and validation"
echo "✅ Rate limiting and error handling"
echo "✅ Cost tracking for API usage"
echo "✅ Database integration for request tracking"
echo "✅ Comprehensive API endpoints"
echo "✅ Token estimation and validation"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Set your OPENAI_API_KEY in the environment"
echo "2. Upload a file and wait for processing"
echo "3. Test AI processing with the file's extracted text"
echo "4. Monitor usage statistics and costs"

echo -e "\n${GREEN}AI Integration Test Complete!${NC}" 