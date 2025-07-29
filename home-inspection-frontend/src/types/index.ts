export interface FileData {
  id: string;
  filename: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_path: string;
  size: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  // AI fields
  ai_summary?: string;
  ai_recommendations?: string;
  ai_cost_cents?: number;
  ai_processed_at?: string;
  ai_status?: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface FileStatus {
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

export interface FileText {
  id: string;
  text: string;
  extracted_at: string;
  // AI fields
  ai_summary?: string;
  ai_recommendations?: string;
  ai_cost_cents?: number;
  ai_processed_at?: string;
  ai_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: FileData;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
} 