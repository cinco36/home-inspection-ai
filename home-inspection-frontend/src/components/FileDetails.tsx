import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { Close, Download, Description, SmartToy, Psychology, AttachMoney, Refresh } from '@mui/icons-material';
import { fileApi } from '../services/api';
import { FileData, FileText } from '../types';

interface FileDetailsProps {
  file: FileData | null;
  open: boolean;
  onClose: () => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({ file, open, onClose }) => {
  const [text, setText] = useState<string>('');
  const [currentFileStatus, setCurrentFileStatus] = useState<string>('');
  const [aiData, setAiData] = useState<{
    ai_summary?: string;
    ai_recommendations?: string;
    ai_cost_cents?: number;
    ai_processed_at?: string;
    ai_status?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && open) {
      // Always try to load the latest status and text when dialog opens
      loadLatestStatus();
      loadFileText();
    }
  }, [file, open]);

  const loadLatestStatus = async () => {
    if (!file) return;
    
    try {
      const response = await fileApi.getFileStatus(file.id);
      if (response.success) {
        setCurrentFileStatus(response.data.processing_status);
      }
    } catch (err) {
      // Fall back to the cached status if API call fails
      setCurrentFileStatus(file.processing_status);
    }
  };

  const loadFileText = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fileApi.getFileText(file.id);
      if (response.success) {
        setText(response.data.text);
        // Extract AI data from the response
        setAiData({
          ai_summary: response.data.ai_summary,
          ai_recommendations: response.data.ai_recommendations,
          ai_cost_cents: response.data.ai_cost_cents,
          ai_processed_at: response.data.ai_processed_at,
          ai_status: response.data.ai_status,
        });
      } else {
        // If text loading fails, it might be because processing is still in progress
        // Don't show this as an error, just leave text empty
        setText('');
        setAiData({});
      }
    } catch (err) {
      // Don't show error for text loading failures - file might still be processing
      setText('');
      setAiData({});
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadLatestStatus();
    await loadFileText();
  };

  const downloadFile = async () => {
    if (!file) return;
    
    try {
      const blob = await fileApi.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
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

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

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

  const getAiStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!file) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            File Details: {file.original_filename}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Refresh />}
              onClick={refreshData}
              disabled={loading}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
            <Button
              startIcon={<Close />}
              onClick={onClose}
              color="inherit"
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* File Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                File Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Original Filename
                  </Typography>
                  <Typography variant="body1">
                    {file.original_filename}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body1">
                    {formatFileSize(file.size)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    File Type
                  </Typography>
                  <Chip
                    label={file.mime_type}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Processing Status
                  </Typography>
                  <Chip
                    label={currentFileStatus}
                    color={getStatusColor(currentFileStatus) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    AI Processing Status
                  </Typography>
                  <Chip
                    label={file.ai_status || 'pending'}
                    color={getAiStatusColor(file.ai_status) as any}
                    size="small"
                    icon={<SmartToy />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    AI Processing Cost
                  </Typography>
                  <Typography variant="body1">
                    {file.ai_cost_cents ? formatCost(file.ai_cost_cents) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(file.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(file.updated_at)}
                  </Typography>
                </Grid>
                {file.ai_processed_at && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      AI Processed At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(file.ai_processed_at)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* AI Analysis Section */}
          {(file.ai_status === 'completed' || aiData.ai_status === 'completed') && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToy />
                  AI Analysis
                </Typography>
                
                <Grid container spacing={2}>
                  {/* AI Summary */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Summary"
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        avatar={<Description />}
                      />
                      <CardContent>
                        {aiData.ai_summary ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {aiData.ai_summary}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No summary available
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* AI Recommendations */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Recommendations"
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        avatar={<Psychology />}
                      />
                      <CardContent>
                        {aiData.ai_recommendations ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {aiData.ai_recommendations}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No recommendations available
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* AI Cost */}
                  {aiData.ai_cost_cents && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardHeader
                          title="Processing Cost"
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          avatar={<AttachMoney />}
                        />
                        <CardContent>
                          <Typography variant="h6" color="primary">
                            {formatCost(aiData.ai_cost_cents)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* AI Processing Status */}
          {file.ai_status === 'processing' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    AI is analyzing the document... Please wait.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* AI Processing Failed */}
          {file.ai_status === 'failed' && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                AI processing failed. The document may not have been suitable for AI analysis.
              </Alert>
            </Grid>
          )}

          {/* Extracted Text */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Extracted Text
                </Typography>
                <Button
                  startIcon={<Download />}
                  onClick={downloadFile}
                  variant="outlined"
                  size="small"
                >
                  Download Original
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : currentFileStatus === 'completed' ? (
                <Box
                  sx={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    backgroundColor: 'grey.50',
                  }}
                >
                  {text ? (
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'inherit',
                        margin: 0,
                      }}
                    >
                      {text}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No text content available
                    </Typography>
                  )}
                </Box>
              ) : currentFileStatus === 'processing' ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing file... Please wait.
                  </Typography>
                </Box>
              ) : currentFileStatus === 'failed' ? (
                <Alert severity="error">
                  File processing failed. Please try uploading the file again.
                </Alert>
              ) : (
                <Alert severity="info">
                  File is pending processing.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileDetails; 