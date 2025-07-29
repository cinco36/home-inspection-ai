import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Description } from '@mui/icons-material';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FileDetails from './components/FileDetails';
import { fileApi } from './services/api';
import { FileData } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileApi.getFiles();
      if (response.success) {
        setFiles(response.data);
      } else {
        throw new Error(response.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileUploaded = (file: FileData) => {
    setFiles(prev => [file, ...prev]);
  };

  const handleFileUpdate = () => {
    loadFiles();
  };

  const handleViewFile = (file: FileData) => {
    setSelectedFile(file);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedFile(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Description sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Home Inspection File Processor
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            File Processing Dashboard
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Upload PDF, DOC, or DOCX files to extract text content. Monitor processing status and view extracted text.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FileUpload onFileUploaded={handleFileUploaded} />

          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Uploaded Files
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FileList
              files={files}
              onFileUpdate={handleFileUpdate}
              onViewFile={handleViewFile}
            />
          )}

          <FileDetails
            file={selectedFile}
            open={detailsOpen}
            onClose={handleCloseDetails}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 