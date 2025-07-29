import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import filesRouter from './routes/files';
import uploadRouter from './routes/upload';
import statusRouter from './routes/status';
import queueRouter from './routes/queue';
import aiRouter from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/v1/files', filesRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/status', statusRouter);

// Queue routes
app.use('/api/v1/queue', queueRouter);

// AI routes
app.use('/api/v1/ai', aiRouter);

// Serve React app under /react route
app.use('/react', express.static(path.join(__dirname, '../public/react')));

// Handle React app routing - serve index.html for any /react/* route
app.get('/react/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/react/index.html'));
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    name: 'Home Inspection API',
    version: '0.3.0',
    description: 'A robust Node.js/Express API server with TypeScript support, PostgreSQL database integration, and comprehensive file upload functionality.',
    endpoints: {
      core: {
        health: 'GET /health',
        status: 'GET /api/v1/status'
      },
      files: {
        list: 'GET /api/v1/files',
        create: 'POST /api/v1/files',
        get: 'GET /api/v1/files/:id',
        delete: 'DELETE /api/v1/files/:id'
      },
      upload: {
        upload: 'POST /api/v1/upload',
        download: 'GET /api/v1/upload/:id/download'
      },
      processing: {
        status: 'GET /api/v1/status/:id/status',
        text: 'GET /api/v1/status/:id/text'
      },
      queue: {
        status: 'GET /api/v1/queue/status',
        jobs: 'GET /api/v1/queue/jobs',
        job_details: 'GET /api/v1/queue/jobs/:id',
        retry_job: 'POST /api/v1/queue/jobs/:id/retry',
        stats: 'GET /api/v1/queue/stats'
      },
      ai: {
        test: 'POST /api/v1/ai/test',
        usage: 'GET /api/v1/ai/usage',
        config: 'GET /api/v1/ai/config',
        process: 'POST /api/v1/ai/process',
        requests: 'GET /api/v1/ai/requests/:fileId',
        estimate_tokens: 'POST /api/v1/ai/estimate-tokens'
      },
      web_interface: {
        upload: '/upload.html',
        queue_monitor: '/queue-monitor.html',
        react_app: '/react'
      }
    },
    features: [
      'File upload with validation (PDF, DOC, DOCX)',
      'PostgreSQL database integration',
      'Redis queue system with Bull',
      'PDF text extraction',
      'Real-time processing status tracking',
      'Queue monitoring dashboard',
      'Manual job retry functionality',
      'ChatGPT API integration for text processing',
      'AI request tracking and cost management',
      'React frontend application'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

export default app;
