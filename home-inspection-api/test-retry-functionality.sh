#!/bin/bash

echo "🔄 Testing Queue Retry Functionality"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test 1: Check current queue status
echo -e "\n${BLUE}📊 Current Queue Status...${NC}"
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/v1/queue/status")
if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Queue status API working${NC}"
    TOTAL_JOBS=$(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.total_jobs')
    FAILED_JOBS=$(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.failed')
    PENDING_JOBS=$(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.pending')
    echo "   Total jobs: $TOTAL_JOBS"
    echo "   Failed jobs: $FAILED_JOBS"
    echo "   Pending jobs: $PENDING_JOBS"
else
    echo -e "${RED}❌ Queue status API failed${NC}"
    exit 1
fi

# Test 2: List failed jobs that can be retried
echo -e "\n${BLUE}🔍 Failed Jobs Available for Retry...${NC}"
FAILED_JOBS_RESPONSE=$(curl -s "$BASE_URL/api/v1/queue/jobs")
FAILED_JOBS_COUNT=$(echo "$FAILED_JOBS_RESPONSE" | jq -r '.data.jobs[] | select(.status == "failed") | .id' | wc -l)

if [ "$FAILED_JOBS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $FAILED_JOBS_COUNT failed jobs${NC}"
    echo "$FAILED_JOBS_RESPONSE" | jq -r '.data.jobs[] | select(.status == "failed") | "   Job \(.id): \(.filename) - \(.error_message)"'
else
    echo -e "${YELLOW}⚠️  No failed jobs to retry${NC}"
fi

# Test 3: Retry a failed job
if [ "$FAILED_JOBS_COUNT" -gt 0 ]; then
    echo -e "\n${BLUE}🔄 Testing Job Retry...${NC}"
    FIRST_FAILED_JOB_ID=$(echo "$FAILED_JOBS_RESPONSE" | jq -r '.data.jobs[] | select(.status == "failed") | .id' | head -1)
    FIRST_FAILED_JOB_NAME=$(echo "$FAILED_JOBS_RESPONSE" | jq -r '.data.jobs[] | select(.status == "failed") | .filename' | head -1)
    
    echo "   Retrying job $FIRST_FAILED_JOB_ID: $FIRST_FAILED_JOB_NAME"
    
    RETRY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/queue/jobs/$FIRST_FAILED_JOB_ID/retry")
    
    if echo "$RETRY_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ Job retry successful${NC}"
        NEW_JOB_ID=$(echo "$RETRY_RESPONSE" | jq -r '.data.new_job_id')
        echo "   Original job ID: $FIRST_FAILED_JOB_ID"
        echo "   New job ID: $NEW_JOB_ID"
        echo "   Status: $(echo "$RETRY_RESPONSE" | jq -r '.data.status')"
    else
        echo -e "${RED}❌ Job retry failed${NC}"
        echo "   Error: $(echo "$RETRY_RESPONSE" | jq -r '.error')"
    fi
else
    echo -e "\n${YELLOW}⚠️  Skipping retry test - no failed jobs${NC}"
fi

# Test 4: Check updated queue status after retry
echo -e "\n${BLUE}📊 Updated Queue Status After Retry...${NC}"
sleep 2
UPDATED_STATUS_RESPONSE=$(curl -s "$BASE_URL/api/v1/queue/status")
if echo "$UPDATED_STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Updated queue status retrieved${NC}"
    UPDATED_TOTAL=$(echo "$UPDATED_STATUS_RESPONSE" | jq -r '.data.queue_stats.total_jobs')
    UPDATED_FAILED=$(echo "$UPDATED_STATUS_RESPONSE" | jq -r '.data.queue_stats.failed')
    UPDATED_PENDING=$(echo "$UPDATED_STATUS_RESPONSE" | jq -r '.data.queue_stats.pending')
    echo "   Total jobs: $UPDATED_TOTAL (was $TOTAL_JOBS)"
    echo "   Failed jobs: $UPDATED_FAILED (was $FAILED_JOBS)"
    echo "   Pending jobs: $UPDATED_PENDING (was $PENDING_JOBS)"
else
    echo -e "${RED}❌ Failed to get updated queue status${NC}"
fi

# Test 5: Test retry on completed job (should fail)
echo -e "\n${BLUE}🚫 Testing Retry on Completed Job (Should Fail)...${NC}"
COMPLETED_JOB_ID=$(curl -s "$BASE_URL/api/v1/queue/jobs" | jq -r '.data.jobs[] | select(.status == "completed") | .id' | head -1)

if [ ! -z "$COMPLETED_JOB_ID" ] && [ "$COMPLETED_JOB_ID" != "null" ]; then
    echo "   Attempting to retry completed job $COMPLETED_JOB_ID"
    
    INVALID_RETRY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/queue/jobs/$COMPLETED_JOB_ID/retry")
    
    if echo "$INVALID_RETRY_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${RED}❌ Unexpected success - should have failed${NC}"
    else
        echo -e "${GREEN}✅ Correctly rejected retry on completed job${NC}"
        echo "   Error: $(echo "$INVALID_RETRY_RESPONSE" | jq -r '.error')"
    fi
else
    echo -e "${YELLOW}⚠️  No completed jobs to test invalid retry${NC}"
fi

# Test 6: Test web interface accessibility
echo -e "\n${BLUE}🌐 Testing Web Interface...${NC}"
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/queue-monitor.html")
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Queue monitor web page accessible${NC}"
    echo "   URL: $BASE_URL/queue-monitor.html"
    echo "   Features: Retry buttons for failed jobs, Promote buttons for pending jobs"
else
    echo -e "${RED}❌ Queue monitor web page not accessible (HTTP $WEB_RESPONSE)${NC}"
fi

# Test 7: Upload a new file to test promote functionality
echo -e "\n${BLUE}📤 Uploading New File to Test Promote...${NC}"
if [ -f "uploads/ea1cb417-cf44-4585-ae89-65bd7087a085.pdf" ]; then
    UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@uploads/ea1cb417-cf44-4585-ae89-65bd7087a085.pdf" "$BASE_URL/api/v1/upload")
    
    if echo "$UPLOAD_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ New file uploaded successfully${NC}"
        NEW_FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.id')
        echo "   File ID: $NEW_FILE_ID"
        
        # Wait a moment for the job to be added to queue
        sleep 2
        
        # Check if there's now a pending job
        PENDING_JOBS_AFTER_UPLOAD=$(curl -s "$BASE_URL/api/v1/queue/status" | jq -r '.data.queue_stats.pending')
        echo "   Pending jobs after upload: $PENDING_JOBS_AFTER_UPLOAD"
        
        if [ "$PENDING_JOBS_AFTER_UPLOAD" -gt 0 ]; then
            echo -e "${GREEN}✅ Pending job available for promotion${NC}"
        else
            echo -e "${YELLOW}⚠️  Job was processed immediately (worker is running)${NC}"
        fi
    else
        echo -e "${RED}❌ File upload failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No test file available for upload${NC}"
fi

echo -e "\n${GREEN}🎉 Retry Functionality Test Complete!${NC}"
echo -e "\n${YELLOW}📋 New Features Added:${NC}"
echo "   • POST /api/v1/queue/jobs/:id/retry - Retry failed or promote pending jobs"
echo "   • Retry buttons on failed jobs in web interface"
echo "   • Promote buttons on pending jobs in web interface"
echo "   • Success/error feedback messages"
echo "   • Automatic page refresh after retry"

echo -e "\n${YELLOW}🔧 How It Works:${NC}"
echo "   • Failed jobs: Creates new job with same data"
echo "   • Pending jobs: Promotes job to front of queue"
echo "   • Completed jobs: Rejected (cannot retry)"
echo "   • Processing jobs: Rejected (cannot retry)"

echo -e "\n${BLUE}🔗 Access the Queue Monitor:${NC}"
echo "   $BASE_URL/queue-monitor.html" 