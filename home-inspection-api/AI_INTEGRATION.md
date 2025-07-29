# ChatGPT API Integration

This document describes the ChatGPT API integration added to the Home Inspection API system.

## Overview

The AI integration provides:
- OpenAI API client configuration
- Reusable AI service for text processing
- API key management and validation
- Rate limiting and error handling
- Cost tracking for API usage
- Database integration for request tracking

## Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1500
OPENAI_TEMPERATURE=0.7
```

## Database Schema

The integration adds a new `ai_requests` table:

```sql
CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    prompt_used TEXT NOT NULL,
    input_text TEXT NOT NULL,
    response_text TEXT,
    tokens_used INTEGER,
    cost_cents INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Test OpenAI Connectivity
```http
POST /api/v1/ai/test
```

### Get Usage Statistics
```http
GET /api/v1/ai/usage
```

### Get AI Configuration
```http
GET /api/v1/ai/config
```

### Process Text with AI
```http
POST /api/v1/ai/process
Content-Type: application/json

{
  "fileId": "uuid",
  "prompt": "Summarize this home inspection report:",
  "text": "Text to process",
  "requestType": "summary",
  "options": {
    "model": "gpt-3.5-turbo",
    "maxTokens": 1000,
    "temperature": 0.7
  }
}
```

### Get AI Requests for File
```http
GET /api/v1/ai/requests/:fileId
```

### Estimate Tokens
```http
POST /api/v1/ai/estimate-tokens
Content-Type: application/json

{
  "text": "Text to estimate tokens for"
}
```

## Features

### AI Service (`src/services/aiService.ts`)

- **OpenAI Client**: Configured with API key and model settings
- **Text Processing**: Generic method for processing text with custom prompts
- **Token Estimation**: Rough estimation of token count for input text
- **Cost Tracking**: Calculates costs based on token usage and model
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **Response Validation**: Validates AI responses before returning
- **Request Tracking**: Stores all AI requests in the database

### Supported Models

- `gpt-3.5-turbo` (default)
- `gpt-4`
- `gpt-4-turbo`

### Cost Tracking

The system tracks costs in cents for each request:
- `gpt-3.5-turbo`: ~$0.0015 per 1K tokens
- `gpt-4`: ~$0.03 per 1K tokens
- `gpt-4-turbo`: ~$0.01 per 1K tokens

## Usage Examples

### Basic Text Processing

```typescript
import aiService from '../services/aiService';

const response = await aiService.processText(
  "Summarize this home inspection report in 3 bullet points:",
  extractedText,
  fileId,
  { requestType: 'summary' }
);
```

### Token Estimation

```typescript
const estimatedTokens = aiService.estimateTokens(text);
console.log(`Estimated tokens: ${estimatedTokens}`);
```

### Usage Statistics

```typescript
const stats = await aiService.getUsageStats();
console.log(`Total cost: $${(stats.totalCostCents / 100).toFixed(2)}`);
```

## Error Handling

The AI service includes comprehensive error handling:

- **API Key Validation**: Checks for valid OpenAI API key
- **Token Limits**: Validates input text length against model limits
- **Rate Limiting**: Implements retry logic with exponential backoff
- **Response Validation**: Ensures AI responses are valid
- **Database Errors**: Handles database connection and query errors

## Testing

Run the test script to verify the integration:

```bash
./test-ai-integration.sh
```

The test script checks:
1. API health
2. AI configuration
3. OpenAI connectivity
4. Token estimation
5. Usage statistics
6. AI processing (requires a file with extracted text)

## Security Considerations

- API keys are stored in environment variables
- No sensitive data is logged
- Request tracking is limited to necessary metadata
- Cost tracking helps prevent excessive usage

## Monitoring

Monitor AI usage through:
- `/api/v1/ai/usage` endpoint for statistics
- Database `ai_requests` table for detailed history
- Application logs for errors and warnings

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `OPENAI_API_KEY` is set in environment
2. **Token Limit Exceeded**: Reduce input text or increase `OPENAI_MAX_TOKENS`
3. **Rate Limiting**: The service automatically retries with backoff
4. **Database Errors**: Check PostgreSQL connection and schema

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## Future Enhancements

Potential improvements:
- Caching for repeated requests
- Batch processing for multiple files
- Custom prompt templates
- Advanced cost optimization
- Integration with file processing pipeline 