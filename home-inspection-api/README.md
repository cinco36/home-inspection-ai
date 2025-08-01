# Home Inspection API

A robust Node.js/Express API server with TypeScript support, PostgreSQL database integration, and comprehensive file upload functionality.

## Features

- **File Upload System**: Secure file upload with validation (PDF, DOC, DOCX)
- **PostgreSQL Database**: Full database integration with connection pooling
- **Redis Queue System**: Background job processing with Bull queue
- **PDF Text Extraction**: Automatic text extraction from uploaded PDFs
- **Processing Status Tracking**: Real-time status updates for file processing
- **AI Integration**: OpenAI-powered text analysis with summary and recommendations
- **Token Estimation**: Advanced token estimation for AI processing cost tracking
- **Prompt Management**: Version-controlled AI prompt management system
- **TypeScript**: Complete TypeScript implementation with strict typing
- **File Validation**: Content-based validation using file-type library
- **Web Interface**: HTML upload form with drag & drop support
- **React Frontend**: Modern React-based file management interface
- **Queue Monitoring**: Real-time queue monitoring dashboard with job management
- **Manual Retry**: Ability to retry failed jobs and promote pending jobs
- **Docker Support**: PostgreSQL and Redis container setup
- **Comprehensive Testing**: Automated test scripts and manual testing tools

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd home-inspection-api
npm install
```

2. **Start PostgreSQL database:**
```bash
docker-compose up -d postgres
```

3. **Set up database schema:**
```bash
docker exec -i home-inspection-postgres psql -U postgres -d home_inspection < src/database/schema.sql
```

4. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Core Endpoints
- `GET /` - API information and endpoint listing
- `GET /health` - Health check
- `GET /api/v1/status` - API status with uptime

### File Management
- `GET /api/v1/files` - List all files
- `POST /api/v1/files` - Create file record
- `GET /api/v1/files/:id` - Get specific file details
- `DELETE /api/v1/files/:id` - Delete file record

### File Upload
- `POST /api/v1/upload` - Upload file (multipart/form-data)
- `GET /api/v1/upload/:id/download` - Download file

### File Processing
- `GET /api/v1/status/:id/status` - Get file processing status
- `GET /api/v1/status/:id/text` - Get extracted text from file

### Queue Management
- `GET /api/v1/queue/status` - Get queue statistics
- `GET /api/v1/queue/jobs` - Get all jobs with details
- `GET /api/v1/queue/jobs/:id` - Get specific job details
- `POST /api/v1/queue/jobs/:id/retry` - Retry failed or promote pending jobs
- `GET /api/v1/queue/stats` - Get performance metrics

### AI Processing
- `POST /api/v1/ai/estimate-tokens-enhanced` - Enhanced token estimation
- `GET /api/v1/ai/analyze-file/:fileId` - File token analysis
- `POST /api/v1/ai/analyze-batch` - Batch token analysis
- `GET /api/v1/ai/token-stats` - Token statistics

### Prompt Management
- `GET /api/v1/ai/prompts` - Get current prompts
- `GET /api/v1/ai/prompts/:version` - Get specific prompt version
- `GET /api/v1/ai/prompts/versions/available` - List available versions
- `POST /api/v1/ai/prompts/version` - Set prompt version
- `POST /api/v1/ai/prompts/custom` - Create custom prompt
- `GET /api/v1/ai/prompts/custom` - List custom prompts
- `DELETE /api/v1/ai/prompts/custom/:name` - Delete custom prompt

## File Upload

### Supported File Types
- PDF (.pdf)
- Microsoft Word (.doc, .docx)

### File Size Limits
- Maximum file size: 50MB

### Upload via Web Interface
Visit `http://localhost:3000/upload.html` for a user-friendly upload interface.

### Queue Monitoring
Visit `http://localhost:3000/queue-monitor.html` for real-time queue monitoring with retry functionality.

### React Frontend
Visit `http://localhost:3000/react/` for the modern React-based file management interface with token display and AI status tracking.

### Upload via API
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@your-file.pdf"
```

## Testing

### Automated Tests
Run the comprehensive test suite:
```bash
./test-upload.sh
```

### Queue System Testing
Test the Redis queue and file processing:
```bash
./test-queue.sh
```

### Queue Monitoring Testing
Test the queue monitoring and retry functionality:
```bash
./test-queue-monitor.sh
./test-retry-functionality.sh
```

### Worker Process
Start the file processing worker:
```bash
npm run worker
```

### Manual Testing
1. **Web Interface**: Visit `http://localhost:3000/upload.html`
2. **API Testing**: Use the provided curl commands or Postman
3. **Database**: Check PostgreSQL for stored file metadata

## Database Schema

The API uses a PostgreSQL database with the following schema:

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

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run worker` - Start file processing worker
- `npm run worker:dev` - Start worker with hot reload

### Environment Variables
Create a `.env` file with:
```
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/home_inspection
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Project Structure
```
src/
├── app.ts                 # Main Express application
├── index.ts              # Server entry point
├── worker.ts             # File processing worker
├── config/
│   ├── redis.ts          # Redis configuration
│   └── queue.ts          # Bull queue configuration
├── database/
│   ├── connection.ts     # PostgreSQL connection
│   └── schema.sql        # Database schema
├── middleware/
│   ├── errorHandler.ts   # Error handling middleware
│   └── upload.ts         # Multer upload configuration
├── routes/
│   ├── files.ts          # File management routes
│   ├── upload.ts         # Upload/download routes
│   └── status.ts         # Processing status routes
├── services/
│   ├── fileService.ts    # Database operations
│   └── fileValidationService.ts # File validation
├── workers/
│   └── fileProcessor.ts  # PDF text extraction worker
└── types/                # TypeScript type definitions
```

## Docker

### Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Stop all services
docker-compose down
```

### Database Operations
```bash
# Run schema
docker exec -i home-inspection-postgres psql -U postgres -d home_inspection < src/database/schema.sql

# Connect to database
docker exec -it home-inspection-postgres psql -U postgres -d home_inspection
```

## Security Features

- **File Type Validation**: Content-based validation, not just extension checking
- **File Size Limits**: Configurable maximum file size
- **Secure File Storage**: UUID-based filenames to prevent conflicts
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without information leakage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history. 