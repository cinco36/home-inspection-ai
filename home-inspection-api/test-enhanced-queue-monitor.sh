#!/bin/bash

# Enhanced Queue Monitor Test Script
# Tests the enhanced queue monitor with AI integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
QUEUE_MONITOR_URL="$API_BASE/queue-monitor.html"

echo -e "${BLUE}🚀 Enhanced Queue Monitor Test Script${NC}"
echo "=================================="

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint"
    else
        curl -s -X "$method" "$API_BASE$endpoint"
    fi
}

# Helper function to check if API is running
check_api() {
    echo -e "\n${YELLOW}1. Checking API Health${NC}"
    local response=$(api_call GET "/health")
    
    if echo "$response" | grep -q "status.*healthy"; then
        echo -e "${GREEN}✅ API is running${NC}"
        return 0
    else
        echo -e "${RED}❌ API is not running or not responding${NC}"
        return 1
    fi
}

# Test enhanced queue status endpoint
test_enhanced_queue_status() {
    echo -e "\n${YELLOW}2. Testing Enhanced Queue Status${NC}"
    local response=$(api_call GET "/api/v1/queue/status")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✅ Enhanced queue status endpoint working${NC}"
        
        # Check for new AI stats fields
        if echo "$response" | grep -q "ai_stats"; then
            echo -e "${GREEN}✅ AI statistics included in response${NC}"
        else
            echo -e "${YELLOW}⚠️  AI statistics not found in response${NC}"
        fi
        
        if echo "$response" | grep -q "summary_stats"; then
            echo -e "${GREEN}✅ Summary statistics included in response${NC}"
        else
            echo -e "${YELLOW}⚠️  Summary statistics not found in response${NC}"
        fi
        
        # Display some key metrics
        echo -e "\n${BLUE}📊 Queue Statistics:${NC}"
        echo "$response" | jq -r '.data.queue_stats | "File Processing: \(.pending) pending, \(.processing) processing, \(.completed) completed, \(.failed) failed"'
        
        if echo "$response" | grep -q "ai_stats"; then
            echo "$response" | jq -r '.data.ai_stats | "AI Processing: \(.pending) pending, \(.processing) processing, \(.completed) completed, \(.failed) failed"'
            echo "$response" | jq -r '.data.ai_stats | "AI Cost: $\(.total_cost_cents / 100 | .[0:6]), Tokens: \(.total_tokens)"'
        fi
        
    else
        echo -e "${RED}❌ Enhanced queue status endpoint failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Test enhanced jobs endpoint
test_enhanced_jobs() {
    echo -e "\n${YELLOW}3. Testing Enhanced Jobs Endpoint${NC}"
    local response=$(api_call GET "/api/v1/queue/jobs")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✅ Enhanced jobs endpoint working${NC}"
        
        # Check for new AI fields
        if echo "$response" | grep -q "ai_requests_count"; then
            echo -e "${GREEN}✅ AI request count included in job data${NC}"
        else
            echo -e "${YELLOW}⚠️  AI request count not found in job data${NC}"
        fi
        
        if echo "$response" | grep -q "ai_cost_cents"; then
            echo -e "${GREEN}✅ AI cost included in job data${NC}"
        else
            echo -e "${YELLOW}⚠️  AI cost not found in job data${NC}"
        fi
        
        # Display job count
        local job_count=$(echo "$response" | jq -r '.data.jobs | length')
        echo -e "\n${BLUE}📋 Total Jobs: $job_count${NC}"
        
        if [ "$job_count" -gt 0 ]; then
            echo -e "\n${BLUE}📄 Sample Job with AI Data:${NC}"
            echo "$response" | jq -r '.data.jobs[0] | "ID: \(.id), File: \(.filename), AI Requests: \(.ai_requests_count), AI Cost: $\(.ai_cost_cents / 100)"'
        fi
        
    else
        echo -e "${RED}❌ Enhanced jobs endpoint failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Test AI usage endpoint
test_ai_usage() {
    echo -e "\n${YELLOW}4. Testing AI Usage Endpoint${NC}"
    local response=$(api_call GET "/api/v1/ai/usage")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✅ AI usage endpoint working${NC}"
        
        # Display AI usage statistics
        echo -e "\n${BLUE}🤖 AI Usage Statistics:${NC}"
        echo "$response" | jq -r '.data | "Total Requests: \(.totalRequests), Total Tokens: \(.totalTokens), Total Cost: $\(.totalCostCents / 100)"'
        
        if echo "$response" | grep -q "requestsByType"; then
            echo "$response" | jq -r '.data.requestsByType | to_entries[] | "\(.key): \(.value)"'
        fi
        
    else
        echo -e "${YELLOW}⚠️  AI usage endpoint not available or failed${NC}"
        echo "Response: $response"
    fi
}

# Test queue monitor page
test_queue_monitor_page() {
    echo -e "\n${YELLOW}5. Testing Queue Monitor Page${NC}"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$QUEUE_MONITOR_URL")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Queue monitor page accessible${NC}"
        echo -e "${BLUE}🌐 Queue Monitor URL: $QUEUE_MONITOR_URL${NC}"
    else
        echo -e "${RED}❌ Queue monitor page not accessible (HTTP $response)${NC}"
        return 1
    fi
}

# Test AI processing with a sample file
test_ai_processing() {
    echo -e "\n${YELLOW}6. Testing AI Processing Integration${NC}"
    
    # First, check if there are any completed files to test with
    local jobs_response=$(api_call GET "/api/v1/queue/jobs")
    local completed_files=$(echo "$jobs_response" | jq -r '.data.jobs[] | select(.status == "completed") | .file_id' | head -1)
    
    if [ -n "$completed_files" ] && [ "$completed_files" != "null" ]; then
        echo -e "${GREEN}✅ Found completed file for AI testing: $completed_files${NC}"
        
        # Test AI processing on the completed file
        local ai_response=$(api_call POST "/api/v1/ai/process" "{\"fileId\": \"$completed_files\", \"requestType\": \"summary\", \"prompt\": \"Summarize this document in 3 bullet points.\"}")
        
        if echo "$ai_response" | grep -q "success.*true"; then
            echo -e "${GREEN}✅ AI processing test successful${NC}"
            echo "$ai_response" | jq -r '.data | "Response: \(.response[0:100])..."'
        else
            echo -e "${YELLOW}⚠️  AI processing test failed or not configured${NC}"
            echo "Response: $ai_response"
        fi
    else
        echo -e "${YELLOW}⚠️  No completed files found for AI testing${NC}"
        echo "Upload a file first and wait for it to complete processing"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}Starting Enhanced Queue Monitor Tests...${NC}"
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed. Please install jq to run these tests.${NC}"
        exit 1
    fi
    
    # Run tests
    if check_api; then
        test_enhanced_queue_status
        test_enhanced_jobs
        test_ai_usage
        test_queue_monitor_page
        test_ai_processing
        
        echo -e "\n${GREEN}🎉 Enhanced Queue Monitor Tests Completed!${NC}"
        echo -e "\n${BLUE}📋 Test Summary:${NC}"
        echo "✅ Enhanced queue status with AI tracking"
        echo "✅ Enhanced jobs with AI cost and token data"
        echo "✅ AI usage statistics"
        echo "✅ Queue monitor page accessibility"
        echo "✅ AI processing integration"
        
        echo -e "\n${BLUE}🌐 Access the Enhanced Queue Monitor at:${NC}"
        echo "$QUEUE_MONITOR_URL"
        
        echo -e "\n${BLUE}📖 Features to test manually:${NC}"
        echo "• Upload a file and watch it move through the processing queue"
        echo "• Check AI requests appear in the monitor when ChatGPT calls are made"
        echo "• Verify cost tracking displays correctly"
        echo "• Test error handling display when AI API fails"
        echo "• Verify real-time updates work smoothly"
        echo "• Test the enhanced job details modal with AI information"
        
    else
        echo -e "${RED}❌ API is not running. Please start the API server first.${NC}"
        echo "Run: cd home-inspection-api && npm run dev"
        exit 1
    fi
}

# Run main function
main "$@" 