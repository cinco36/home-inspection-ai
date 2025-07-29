# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-07-22

### Added
- **Queue Monitoring Web Interface**: Complete real-time queue monitoring dashboard
  - Real-time queue statistics (pending, processing, completed, failed)
  - Job filtering by status and search by filename
  - Auto-refresh every 5 seconds with manual refresh option
  - Job details modal with full file information
  - Progress indicators and status badges
  - Responsive design for mobile and desktop
- **Manual Job Retry System**: Ability to retry failed jobs and promote pending jobs
  - `POST /api/v1/queue/jobs/:id/retry` - Retry failed or promote pending jobs
  - Retry buttons on failed jobs in web interface
  - Promote buttons on pending jobs in web interface
  - Success/error feedback messages with auto-dismiss
  - Automatic page refresh after retry operations
- **Enhanced Queue API Endpoints**:
  - `GET /api/v1/queue/status` - Queue statistics
  - `GET /api/v1/queue/jobs` - All jobs with details
  - `GET /api/v1/queue/jobs/:id` - Specific job details
  - `GET /api/v1/queue/stats` - Performance metrics
- **Queue Management Features**:
  - Failed job retry (creates new job with same data)
  - Pending job promotion (moves to front of queue)
  - State validation (prevents invalid retries)
  - Comprehensive error handling
- **Testing and Documentation**:
  - `test-queue-monitor.sh` - Comprehensive queue monitoring tests
  - `test-retry-functionality.sh` - Retry functionality tests
  - Updated API documentation with new endpoints

### Technical Improvements
- **Real-time Updates**: Simple polling-based updates every 5 seconds
- **Job State Management**: Proper handling of job states (waiting, active, completed, failed)
- **Error Recovery**: Manual retry system for failed jobs
- **Queue Optimization**: Job promotion for priority processing
- **User Experience**: Intuitive web interface with clear status indicators

### Web Interface Features
- **Dashboard**: Real-time statistics cards with color coding
- **Job Table**: Sortable job list with status indicators
- **Filtering**: Status filter and filename search
- **Job Details**: Modal with complete job information
- **Responsive Design**: Mobile-friendly layout
- **Auto-refresh**: Configurable refresh intervals

### Dependencies
- No new dependencies added (uses existing Bull queue and Express.js)

## [0.2.0] - 2025-07-22

### Added
- **Redis Queue System**: Background job processing with Bull queue
- **PDF Text Extraction**: Automatic text extraction from uploaded PDFs using pdf-parse
- **Processing Status Tracking**: Real-time status updates (pending, processing, completed, failed)
- **Worker Process**: Background file processing with graceful error handling
- **New API Endpoints**:
  - `GET /api/v1/status/:id/status` - Get file processing status
  - `GET /api/v1/status/:id/text` - Get extracted text from file
- **Database Schema Updates**: Added processing_status, extracted_text, and error_message columns
- **Queue Management**: Job retry logic with exponential backoff
- **Enhanced Testing**: Comprehensive queue system testing with `test-queue.sh`
- **Docker Support**: Added Redis container to docker-compose.yml
- **Worker Scripts**: npm run worker and npm run worker:dev commands

### Technical Improvements
- **Queue Configuration**: Bull queue with Redis backend
- **File Processing**: PDF text extraction with content validation
- **Error Handling**: Graceful error handling in worker process
- **Status Management**: Database updates for processing status
- **Monitoring**: Queue event handlers for job tracking

### Dependencies Added
- bull: Job queue management
- redis: Redis client
- pdf-parse: PDF text extraction
- @types/redis: TypeScript types for Redis
- @types/pdf-parse: TypeScript types for pdf-parse

## [0.1.0] - 2025-07-22

### Added
- **Core API Server**: Express.js server with TypeScript support
- **PostgreSQL Database Integration**: Full database connectivity with connection pooling
- **Redis Queue System**: Background job processing with Bull queue
- **PDF Text Extraction**: Automatic text extraction from uploaded PDFs
- **Processing Status Tracking**: Real-time status updates for file processing
- **File Upload System**: Complete file upload functionality with validation
- **File Storage**: Local file storage with UUID-based naming
- **File Validation**: 
  - File type validation (PDF, DOC, DOCX only)
  - File size validation (50MB maximum)
  - Content-based validation using file-type library
- **Database Schema**: Files table with comprehensive metadata storage
- **API Endpoints**:
  - `GET /` - API information and endpoint listing
  - `GET /health` - Health check endpoint
  - `GET /api/v1/status` - API status with uptime
  - `GET /api/v1/files` - List all files
  - `POST /api/v1/files` - Create file record
  - `GET /api/v1/files/:id` - Get specific file details
  - `DELETE /api/v1/files/:id` - Delete file record
  - `POST /api/v1/upload` - Upload file (multipart/form-data)
  - `GET /api/v1/upload/:id/download` - Download file
  - `GET /api/v1/status/:id/status` - Get file processing status
  - `GET /api/v1/status/:id/text` - Get extracted text from file
- **Web Interface**: HTML upload form at `/upload.html` with drag & drop support
- **Worker Process**: Background file processing with PDF text extraction
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Automated test scripts and manual testing tools
- **Docker Support**: PostgreSQL and Redis container setup with docker-compose

### Technical Features
- **TypeScript**: Full TypeScript implementation with strict typing
- **Database**: PostgreSQL with UUID primary keys and proper indexing
- **File Processing**: Multer middleware with custom validation
- **Security**: File type validation, size limits, and secure file handling
- **Development**: Hot reload with nodemon, comprehensive logging
- **Documentation**: API documentation, test scripts, and setup guides

### Dependencies
- Express.js for API server
- PostgreSQL client (pg) for database
- Redis client for queue system
- Bull for job queue management
- pdf-parse for PDF text extraction
- Multer for file uploads
- file-type for content validation
- fs-extra for enhanced file operations
- UUID for unique filename generation
- CORS support for cross-origin requests
- TypeScript for type safety

### Database Schema
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    extracted_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testing
- Automated test script (`test-upload.sh`)
- Queue system test script (`test-queue.sh`)
- Web interface for manual testing
- curl commands for API testing
- Comprehensive validation testing
- Worker process testing

### Setup
- Docker Compose for PostgreSQL and Redis
- Environment configuration
- Development and production scripts
- Worker process management
- Static file serving for web interface 