import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Download,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { fileApi } from '../services/api';
import { FileData, FileStatus } from '../types';

interface FileListProps {
  files: FileData[];
  onFileUpdate: () => void;
  onViewFile: (file: FileData) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onFileUpdate, onViewFile }) => {
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return <CircularProgress size={16} />;
      case 'failed':
        return '✗';
      default:
        return '⏳';
    }
  };

  const refreshStatus = async (fileId: string) => {
    setLoading(prev => ({ ...prev, [fileId]: true }));
    try {
      const response = await fileApi.getFileStatus(fileId);
      if (response.success) {
        setStatuses(prev => ({ ...prev, [fileId]: response.data }));
      }
    } catch (err) {
      setError('Failed to refresh status');
    } finally {
      setLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const blob = await fileApi.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await fileApi.deleteFile(fileId);
      onFileUpdate();
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const reRunTextExtraction = async (fileId: string) => {
    try {
      setLoading(prev => ({ ...prev, [fileId]: true }));
      await fileApi.reprocessFile(fileId, 'text');
      onFileUpdate();
    } catch (err) {
      setError('Failed to re-run text extraction');
    } finally {
      setLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const reRunAISummary = async (fileId: string) => {
    try {
      setLoading(prev => ({ ...prev, [fileId]: true }));
      await fileApi.reprocessFile(fileId, 'ai');
      onFileUpdate();
    } catch (err) {
      setError('Failed to re-run AI summary');
    } finally {
      setLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get the current status for a file, using real-time status if available, otherwise fall back to file data
  const getCurrentStatus = (file: FileData) => {
    const realTimeStatus = statuses[file.id];
    return realTimeStatus?.processing_status || file.processing_status;
  };

  // Check if file is completed for enabling view button
  const isFileCompleted = (file: FileData) => {
    const currentStatus = getCurrentStatus(file);
    return currentStatus === 'completed';
  };

  useEffect(() => {
    // Initialize statuses with file data
    const initialStatuses: Record<string, FileStatus> = {};
    files.forEach(file => {
      initialStatuses[file.id] = {
        processing_status: file.processing_status
      };
    });
    setStatuses(initialStatuses);

    // Refresh statuses for processing files
    const interval = setInterval(() => {
      files.forEach(file => {
        const currentStatus = getCurrentStatus(file);
        if (currentStatus === 'processing' || currentStatus === 'pending') {
          refreshStatus(file.id);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [files]);

  if (files.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No files uploaded yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload some files to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Filename</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => {
              const currentStatus = getCurrentStatus(file);
              return (
                <TableRow key={file.id}>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {file.original_filename}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    <Chip
                      label={file.mime_type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(currentStatus)}
                      <Chip
                        label={currentStatus}
                        color={getStatusColor(currentStatus) as any}
                        size="small"
                      />
                      {loading[file.id] && <CircularProgress size={16} />}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(file.created_at)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => onViewFile(file)}
                          disabled={!isFileCompleted(file)}
                          sx={{ mb: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onViewFile(file)}
                          sx={{ 
                            fontSize: '12px',
                            padding: '4px 8px',
                            minWidth: 'auto'
                          }}
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => downloadFile(file.id, file.original_filename)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh status">
                          <IconButton
                            size="small"
                            onClick={() => refreshStatus(file.id)}
                            disabled={loading[file.id]}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Re-run Text Extraction">
                          <IconButton
                            size="small"
                            onClick={() => reRunTextExtraction(file.id)}
                            disabled={loading[file.id]}
                            sx={{ color: '#4CAF50' }}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Re-run AI Summary">
                          <IconButton
                            size="small"
                            onClick={() => reRunAISummary(file.id)}
                            disabled={loading[file.id]}
                            sx={{ color: '#2196F3' }}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => deleteFile(file.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FileList; 