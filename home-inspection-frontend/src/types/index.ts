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
  // Token estimation fields
  estimated_tokens?: number;
  estimated_cost_cents?: number;
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
  // Token estimation fields
  estimated_tokens?: number;
  estimated_cost_cents?: number;
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

export interface TokenAnalysis {
  estimatedTokens: number;
  textLength: number;
  wordCount: number;
  characterCount: number;
  estimatedCostCents: number;
  model: string;
  maxAllowedTokens: number;
  withinLimit: boolean;
}

export interface BatchTokenAnalysis {
  totalFiles: number;
  totalTokens: number;
  totalCostCents: number;
  averageTokensPerFile: number;
  files: Array<{
    fileId: string;
    filename: string;
    estimatedTokens: number;
    estimatedCostCents: number;
  }>;
}

export interface TokenStats {
  totalFiles: number;
  totalTokens: number;
  totalCostCents: number;
  averageTokensPerFile: number;
  tokenDistribution: {
    low: number;
    moderate: number;
    high: number;
    excessive: number;
  };
} 