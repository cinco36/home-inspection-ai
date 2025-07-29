# Home Inspection File Processor Frontend

A React-based frontend for the Home Inspection File Processing API. This application provides a user-friendly interface for uploading, monitoring, and viewing processed files.

## Features

- **File Upload**: Drag-and-drop interface for uploading PDF, DOC, and DOCX files
- **File Management**: View all uploaded files with their processing status
- **Real-time Status**: Monitor file processing status with automatic updates
- **Text Extraction**: View extracted text content from processed files
- **File Download**: Download original files
- **File Deletion**: Remove files from the system

## Prerequisites

- Node.js (v14 or higher)
- The Home Inspection API server running on `http://localhost:3000`

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3001`.

## Usage

1. **Upload Files**: Drag and drop files onto the upload area or click to select files
2. **Monitor Status**: View the processing status of uploaded files in the file list
3. **View Text**: Click the "View" button on completed files to see extracted text
4. **Download Files**: Use the download button to get the original file
5. **Delete Files**: Remove files using the delete button

## API Integration

The frontend connects to the following API endpoints:

- `POST /api/v1/upload` - Upload files
- `GET /api/v1/files` - List all files
- `GET /api/v1/files/:id` - Get specific file details
- `GET /api/v1/status/:id/status` - Get file processing status
- `GET /api/v1/status/:id/text` - Get extracted text
- `GET /api/v1/upload/:id/download` - Download original file
- `DELETE /api/v1/files/:id` - Delete file

## Development

The application is built with:

- **React 18** with TypeScript
- **Material-UI** for components and styling
- **Axios** for API communication
- **React Dropzone** for file uploads

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # File upload with drag-and-drop
│   ├── FileList.tsx        # File list with status display
│   └── FileDetails.tsx     # File details and text viewer
├── services/
│   └── api.ts             # API service functions
├── types/
│   └── index.ts           # TypeScript type definitions
├── App.tsx                # Main application component
└── index.tsx              # Application entry point
```

## Configuration

The API base URL can be configured by setting the `REACT_APP_API_URL` environment variable. By default, it connects to `http://localhost:3000`.

## Testing

To test the application:

1. Ensure the API server is running on port 3000
2. Start the frontend on port 3001
3. Upload a PDF file
4. Monitor the processing status
5. View the extracted text once processing is complete 