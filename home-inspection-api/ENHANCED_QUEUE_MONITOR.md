# Enhanced Queue Monitor Documentation

## Overview

The Enhanced Queue Monitor is a comprehensive real-time monitoring interface for the Home Inspection API that tracks file processing, AI processing, and summary processing queues. It provides advanced visualization, cost tracking, and detailed job information with AI integration.

## Features

### 🎯 Core Features

- **Multi-Queue Monitoring**: Track file processing, AI processing, and summary processing queues
- **Real-time Updates**: Auto-refresh functionality with configurable intervals
- **Enhanced Job Details**: Comprehensive job information including AI processing details
- **Cost Tracking**: Real-time AI usage cost and token tracking
- **Error Handling**: Detailed error information with retry capabilities
- **Mobile Responsive**: Optimized for desktop and mobile devices

### 🎨 Visual Enhancements

- **Modern UI**: Gradient backgrounds, glassmorphism effects, and smooth animations
- **Color-coded Status**: Green (healthy), yellow (busy), red (error) queue indicators
- **Progress Visualization**: Real-time progress bars with percentage indicators
- **Flow Visualization**: Visual representation of the processing pipeline
- **Queue Type Icons**: Distinctive icons for different queue types (📄 file, 💡 AI, 📝 summary)

### 📊 Advanced Statistics

- **Queue Health Monitoring**: Automatic status detection based on job counts and error rates
- **Processing Time Analytics**: Average processing times and performance metrics
- **Cost Analytics**: Total AI costs, token usage, and cost per request
- **Error Rate Tracking**: Success/failure rates for each queue type
- **Summary Statistics**: Overall system performance and success rates

## API Endpoints

### Enhanced Queue Status
```
GET /api/v1/queue/status
```

**Response includes:**
- File processing queue statistics
- AI processing queue statistics  
- Summary statistics
- Error rates and performance metrics

**Example Response:**
```json
{
  "success": true,
  "data": {
    "queue_stats": {
      "total_jobs": 25,
      "pending": 2,
      "processing": 1,
      "completed": 20,
      "failed": 2,
      "avg_processing_time": "45.2s",
      "error_rate": "8.0%"
    },
    "ai_stats": {
      "total_requests": 15,
      "pending": 0,
      "processing": 1,
      "completed": 13,
      "failed": 1,
      "total_tokens": 12500,
      "total_cost_cents": 1875,
      "error_rate": "6.7%"
    },
    "summary_stats": {
      "total_processed_files": 20,
      "total_ai_requests": 13,
      "overall_success_rate": "80.0%",
      "total_cost": "$18.75"
    }
  }
}
```

### Enhanced Jobs List
```
GET /api/v1/queue/jobs
```

**Enhanced job data includes:**
- AI request count per file
- AI processing cost per file
- Token usage per file
- MIME type information

**Example Job Object:**
```json
{
  "id": "job-123",
  "file_id": "file-456",
  "filename": "inspection-report.pdf",
  "status": "completed",
  "progress": 100,
  "created_at": "2024-01-15T10:30:00Z",
  "started_at": "2024-01-15T10:30:05Z",
  "completed_at": "2024-01-15T10:30:45Z",
  "error_message": null,
  "extracted_text_length": 2500,
  "file_size": 1024000,
  "ai_requests_count": 3,
  "ai_cost_cents": 125,
  "ai_tokens": 1500,
  "mime_type": "application/pdf"
}
```

## Queue Types

### 📄 File Processing Queue
- **Purpose**: Handles file uploads and text extraction
- **Status Indicators**: 
  - 🟢 Healthy: < 5 processing, < 10 pending, < 10% error rate
  - 🟡 Busy: > 5 processing OR > 10 pending
  - 🔴 Error: > 10% error rate
- **Metrics**: Processing time, success rate, file size analysis

### 💡 AI Processing Queue
- **Purpose**: Manages ChatGPT API requests and responses
- **Status Indicators**:
  - 🟢 Healthy: < 3 processing, < 5 pending, < 5% error rate
  - 🟡 Busy: > 3 processing OR > 5 pending
  - 🔴 Error: > 5% error rate
- **Metrics**: Token usage, cost tracking, response quality

### 📝 Summary Processing Queue
- **Purpose**: Handles document summarization and analysis
- **Status Indicators**:
  - 🟢 Healthy: < 2 processing, < 3 pending, < 5% error rate
  - 🟡 Busy: > 2 processing OR > 3 pending
  - 🔴 Error: > 5% error rate
- **Metrics**: Success rate, processing time, summary quality

## User Interface

### Main Dashboard
- **Queue Overview Cards**: Real-time status of all queues
- **Processing Flow**: Visual representation of the pipeline
- **Controls Panel**: Filters, search, and refresh controls
- **Jobs Table**: Detailed job listing with enhanced information

### Enhanced Job Details Modal
- **Job Information**: Basic job details and file information
- **Timing Information**: Creation, start, completion times
- **AI Processing Details**: AI requests, costs, tokens, responses
- **Error Information**: Detailed error messages and stack traces
- **Extracted Text**: Preview of processed text content

### Controls and Filters
- **Queue Type Filter**: Filter by file, AI, or summary processing
- **Status Filter**: Filter by pending, processing, completed, failed
- **Search**: Search by filename or job ID
- **Auto-refresh Toggle**: Enable/disable automatic updates
- **Manual Refresh**: Force immediate data refresh

## Configuration

### Environment Variables
```bash
# OpenAI Configuration (for AI queue monitoring)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1500
OPENAI_TEMPERATURE=0.7

# Queue Configuration
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://user:pass@localhost:5432/db
```

### Auto-refresh Settings
- **Default Interval**: 5 seconds
- **Configurable**: Can be adjusted in the UI
- **Toggle Control**: Users can enable/disable auto-refresh

## Testing

### Automated Testing
Run the enhanced queue monitor test script:
```bash
./test-enhanced-queue-monitor.sh
```

### Manual Testing Checklist
1. **File Upload Flow**:
   - [ ] Upload a file and watch it move through the queue
   - [ ] Verify progress indicators update in real-time
   - [ ] Check job details modal shows correct information

2. **AI Processing Integration**:
   - [ ] Verify AI requests appear in the monitor
   - [ ] Check cost tracking displays correctly
   - [ ] Test error handling when AI API fails
   - [ ] Verify token usage is tracked accurately

3. **Real-time Updates**:
   - [ ] Test auto-refresh functionality
   - [ ] Verify manual refresh works
   - [ ] Check that updates are smooth and responsive

4. **Error Handling**:
   - [ ] Test with invalid API keys
   - [ ] Verify error messages display correctly
   - [ ] Test retry functionality for failed jobs

5. **Mobile Responsiveness**:
   - [ ] Test on different screen sizes
   - [ ] Verify touch interactions work properly
   - [ ] Check that layout adapts correctly

## Troubleshooting

### Common Issues

**Queue Monitor Not Loading**
- Check if API server is running on port 3000
- Verify Redis and PostgreSQL connections
- Check browser console for JavaScript errors

**AI Statistics Not Showing**
- Verify OpenAI API key is configured
- Check AI service is properly initialized
- Review AI usage endpoint responses

**Real-time Updates Not Working**
- Check auto-refresh is enabled
- Verify network connectivity
- Check for JavaScript errors in console

**Job Details Modal Issues**
- Verify job ID is valid
- Check AI requests endpoint is accessible
- Review database connections

### Performance Optimization

**For Large Job Lists**
- Implement pagination for jobs table
- Add virtual scrolling for better performance
- Optimize database queries with proper indexing

**For High-frequency Updates**
- Implement WebSocket connections for real-time updates
- Add debouncing for rapid API calls
- Optimize refresh intervals based on queue activity

## Future Enhancements

### Planned Features
- **WebSocket Integration**: Real-time push updates
- **Advanced Analytics**: Historical performance trends
- **Alert System**: Email/SMS notifications for queue issues
- **Queue Management**: Manual job promotion/demotion
- **Export Functionality**: CSV/PDF reports
- **Custom Dashboards**: User-configurable views

### Technical Improvements
- **Service Workers**: Offline capability
- **Progressive Web App**: Installable application
- **Advanced Filtering**: Date ranges, file types, custom criteria
- **Bulk Operations**: Multi-job selection and actions
- **API Rate Limiting**: Prevent excessive API calls

## Security Considerations

### Data Protection
- **API Key Security**: Never expose API keys in client-side code
- **Input Validation**: Sanitize all user inputs
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: Prevent abuse of monitoring endpoints

### Access Control
- **Authentication**: Implement user authentication for sensitive operations
- **Authorization**: Role-based access to different queue types
- **Audit Logging**: Track all monitoring activities
- **Session Management**: Secure session handling

## Support

For issues or questions about the Enhanced Queue Monitor:

1. Check the troubleshooting section above
2. Review the test script output for diagnostic information
3. Check API logs for backend issues
4. Verify all dependencies are properly installed and configured

## Changelog

### Version 2.0.0 (Current)
- ✨ Enhanced queue monitor with AI integration
- 🎨 Modern UI with glassmorphism design
- 📊 Advanced statistics and cost tracking
- 🔄 Real-time updates and auto-refresh
- 📱 Mobile responsive design
- 🤖 AI processing queue monitoring
- 💰 Cost and token usage tracking
- 🎯 Enhanced job details with AI information

### Version 1.0.0 (Previous)
- Basic queue monitoring
- Simple job listing
- Manual refresh only
- Desktop-only interface 