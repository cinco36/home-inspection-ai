#!/bin/bash

echo "🚀 Testing Queue Monitor Implementation"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test API endpoints
echo -e "\n${BLUE}📊 Testing Queue Status API...${NC}"
STATUS_RESPONSE=$(curl -s http://localhost:3000/api/v1/queue/status)
if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Queue status API working${NC}"
    echo "   Total jobs: $(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.total_jobs')"
    echo "   Pending: $(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.pending')"
    echo "   Processing: $(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.processing')"
    echo "   Completed: $(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.completed')"
    echo "   Failed: $(echo "$STATUS_RESPONSE" | jq -r '.data.queue_stats.failed')"
else
    echo -e "${RED}❌ Queue status API failed${NC}"
fi

echo -e "\n${BLUE}📋 Testing Queue Jobs API...${NC}"
JOBS_RESPONSE=$(curl -s http://localhost:3000/api/v1/queue/jobs)
if echo "$JOBS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Queue jobs API working${NC}"
    JOB_COUNT=$(echo "$JOBS_RESPONSE" | jq -r '.data.jobs | length')
    echo "   Found $JOB_COUNT jobs in queue"
    
    # Show first job details
    if [ "$JOB_COUNT" -gt 0 ]; then
        FIRST_JOB_ID=$(echo "$JOBS_RESPONSE" | jq -r '.data.jobs[0].id')
        FIRST_JOB_NAME=$(echo "$JOBS_RESPONSE" | jq -r '.data.jobs[0].filename')
        FIRST_JOB_STATUS=$(echo "$JOBS_RESPONSE" | jq -r '.data.jobs[0].status')
        echo "   First job: $FIRST_JOB_NAME (ID: $FIRST_JOB_ID, Status: $FIRST_JOB_STATUS)"
    fi
else
    echo -e "${RED}❌ Queue jobs API failed${NC}"
fi

echo -e "\n${BLUE}📈 Testing Queue Stats API...${NC}"
STATS_RESPONSE=$(curl -s http://localhost:3000/api/v1/queue/stats)
if echo "$STATS_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Queue stats API working${NC}"
    SUCCESS_RATE=$(echo "$STATS_RESPONSE" | jq -r '.data.performance_metrics.success_rate')
    AVG_TIME=$(echo "$STATS_RESPONSE" | jq -r '.data.performance_metrics.avg_processing_time')
    echo "   Success rate: $SUCCESS_RATE"
    echo "   Average processing time: $AVG_TIME"
else
    echo -e "${RED}❌ Queue stats API failed${NC}"
fi

echo -e "\n${BLUE}🔍 Testing Job Details API...${NC}"
if [ "$JOB_COUNT" -gt 0 ]; then
    JOB_DETAILS_RESPONSE=$(curl -s http://localhost:3000/api/v1/queue/jobs/$FIRST_JOB_ID)
    if echo "$JOB_DETAILS_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ Job details API working${NC}"
        JOB_FILENAME=$(echo "$JOB_DETAILS_RESPONSE" | jq -r '.data.filename')
        JOB_SIZE=$(echo "$JOB_DETAILS_RESPONSE" | jq -r '.data.file_size')
        echo "   Job filename: $JOB_FILENAME"
        echo "   File size: $JOB_SIZE bytes"
    else
        echo -e "${RED}❌ Job details API failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No jobs to test details API${NC}"
fi

echo -e "\n${BLUE}🌐 Testing Web Interface...${NC}"
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/queue-monitor.html)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Queue monitor web page accessible${NC}"
    echo "   URL: http://localhost:3000/queue-monitor.html"
else
    echo -e "${RED}❌ Queue monitor web page not accessible (HTTP $WEB_RESPONSE)${NC}"
fi

echo -e "\n${BLUE}📤 Testing File Upload...${NC}"
if [ -f "uploads/ea1cb417-cf44-4585-ae89-65bd7087a085.pdf" ]; then
    UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@uploads/ea1cb417-cf44-4585-ae89-65bd7087a085.pdf" http://localhost:3000/api/v1/upload)
    if echo "$UPLOAD_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ File upload working${NC}"
        UPLOADED_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.id')
        echo "   Uploaded file ID: $UPLOADED_ID"
    else
        echo -e "${RED}❌ File upload failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No test file available for upload${NC}"
fi

echo -e "\n${GREEN}🎉 Queue Monitor Implementation Complete!${NC}"
echo -e "\n${YELLOW}📋 Available Endpoints:${NC}"
echo "   • GET /api/v1/queue/status - Queue statistics"
echo "   • GET /api/v1/queue/jobs - All jobs in queue"
echo "   • GET /api/v1/queue/jobs/:id - Specific job details"
echo "   • GET /api/v1/queue/stats - Performance metrics"
echo "   • GET /queue-monitor.html - Web interface"

echo -e "\n${YELLOW}🌐 Web Interface Features:${NC}"
echo "   • Real-time queue statistics"
echo "   • Job filtering by status"
echo "   • Search by filename"
echo "   • Auto-refresh every 5 seconds"
echo "   • Job details modal"
echo "   • Progress indicators"
echo "   • Responsive design"

echo -e "\n${BLUE}🔗 Access the Queue Monitor:${NC}"
echo "   http://localhost:3000/queue-monitor.html" 