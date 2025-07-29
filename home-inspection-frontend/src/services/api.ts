import axios from 'axios';
import { FileData, FileStatus, FileText, UploadResponse, ApiResponse } from '../types';

// Point to the API server running on port 3000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fileApi = {
  // Upload a file
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get all files
  getFiles: async (): Promise<ApiResponse<FileData[]>> => {
    const response = await api.get('/api/v1/files');
    return response.data;
  },

  // Get a specific file
  getFile: async (id: string): Promise<ApiResponse<FileData>> => {
    const response = await api.get(`/api/v1/files/${id}`);
    return response.data;
  },

  // Get file status
  getFileStatus: async (id: string): Promise<ApiResponse<FileStatus>> => {
    const response = await api.get(`/api/v1/status/${id}/status`);
    return response.data;
  },

  // Get extracted text
  getFileText: async (id: string): Promise<ApiResponse<FileText>> => {
    const response = await api.get(`/api/v1/status/${id}/text`);
    return response.data;
  },

  // Download file
  downloadFile: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/v1/upload/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/v1/files/${id}`);
    return response.data;
  },

  // Reprocess file (text extraction or AI processing)
  reprocessFile: async (id: string, type: 'text' | 'ai'): Promise<ApiResponse<void>> => {
    const response = await api.post(`/api/v1/files/${id}/reprocess`, { type });
    return response.data;
  },
};

export default api; 