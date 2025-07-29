import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { fileApi } from '../services/api';
import { FileData } from '../types';

interface FileUploadProps {
  onFileUploaded: (file: FileData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setUploading(true);
    setUploadedFiles(acceptedFiles);

    try {
      for (const file of acceptedFiles) {
        const response = await fileApi.uploadFile(file);
        if (response.success) {
          onFileUploaded(response.data);
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadedFiles([]);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Box>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Uploading files...
            </Typography>
            <Box sx={{ mt: 2 }}>
              {uploadedFiles.map((file, index) => (
                <Chip
                  key={index}
                  icon={<Description />}
                  label={file.name}
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              or click to select files
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supports PDF, DOC, and DOCX files
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 