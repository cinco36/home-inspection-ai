# React Frontend Integration

## Overview
The React frontend has been successfully integrated with the API server to run on the same port (3000) under different URL paths. This eliminates port conflicts and provides a unified experience.

## URLs

### Main Application URLs
- **React Frontend (Advanced UI)**: `http://localhost:3000/react`
- **API Documentation**: `http://localhost:3000/`
- **Basic Upload Interface**: `http://localhost:3000/upload.html`
- **Queue Monitor**: `http://localhost:3000/queue-monitor.html`

### API Endpoints
- **Health Check**: `http://localhost:3000/health`
- **Files API**: `http://localhost:3000/api/v1/files`
- **Upload API**: `http://localhost:3000/api/v1/upload`
- **Queue API**: `http://localhost:3000/api/v1/queue`
- **AI API**: `http://localhost:3000/api/v1/ai`

## Architecture

### File Structure
```
home-inspection-api/
├── public/
│   ├── react/           # React app static files
│   ├── upload.html      # Basic upload interface
│   └── queue-monitor.html # Basic queue monitor
└── src/
    └── app.ts           # Express server with React routing

home-inspection-frontend/
├── src/                 # React source code
├── build/               # Built React app
└── deploy-react.sh      # Deployment script
```

### How It Works
1. **Build Process**: React app is built using `npm run build`
2. **Deployment**: Built files are copied to `home-inspection-api/public/react/`
3. **Serving**: Express server serves React app under `/react` route
4. **Routing**: Client-side routing is handled by serving `index.html` for all `/react/*` routes
5. **API Integration**: React app uses relative URLs to communicate with the same server

## Deployment

### Manual Deployment
```bash
cd home-inspection-frontend
npm run build
cp -r build/* ../home-inspection-api/public/react/
```

### Automated Deployment
```bash
cd home-inspection-frontend
./deploy-react.sh
```

## Configuration

### API Service Configuration
The React app's API service (`src/services/api.ts`) has been updated to use relative URLs:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
```

This allows the React app to communicate with the API server without hardcoded URLs.

### Express Server Configuration
The API server (`src/app.ts`) has been updated with:
```typescript
// Serve React app under /react route
app.use('/react', express.static(path.join(__dirname, '../public/react')));

// Handle React app routing - serve index.html for any /react/* route
app.get('/react/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/react/index.html'));
});
```

## Benefits

1. **No Port Conflicts**: Both frontend and backend run on port 3000
2. **Unified Experience**: Single server handles all requests
3. **Simplified Deployment**: No need for separate frontend server
4. **CORS-Free**: No cross-origin issues since everything is served from same origin
5. **Easy Updates**: Simple build and copy process for updates

## Troubleshooting

### React App Not Loading
1. Check if files are copied: `ls -la public/react/`
2. Verify build was successful: `npm run build`
3. Check server logs for errors

### API Calls Failing
1. Verify API server is running: `curl http://localhost:3000/health`
2. Check API service configuration in React app
3. Ensure relative URLs are being used

### Build Issues
1. Install dependencies: `npm install`
2. Clear build cache: `rm -rf build/`
3. Rebuild: `npm run build`

## Future Enhancements

1. **Hot Reloading**: Set up development mode with hot reloading
2. **Environment Configuration**: Add environment-specific builds
3. **Asset Optimization**: Implement asset compression and caching
4. **Error Handling**: Add comprehensive error handling for build/deploy process 