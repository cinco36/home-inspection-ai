import pool from '../database/connection';

export interface FileRecord {
  id: string;
  filename: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_path: string;
  size: number;
  processing_status: string;
  extracted_text?: string;
  error_message?: string;
  // AI fields
  ai_summary?: string;
  ai_recommendations?: string;
  ai_cost_cents?: number;
  ai_processed_at?: Date;
  ai_status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFileRequest {
  filename: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_path: string;
  size: number;
}

export class FileService {
    async createFile(fileData: CreateFileRequest): Promise<FileRecord> {
    const { filename, original_filename, stored_filename, mime_type, file_path, size } = fileData;

    const query = `
      INSERT INTO files (filename, original_filename, stored_filename, mime_type, file_path, size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, filename, original_filename, stored_filename, mime_type, file_path, size, processing_status, extracted_text, error_message, ai_summary, ai_recommendations, ai_cost_cents, ai_processed_at, ai_status, created_at, updated_at
    `;

    const result = await pool.query(query, [filename, original_filename, stored_filename, mime_type, file_path, size]);
    return result.rows[0];
  }

  async getAllFiles(): Promise<FileRecord[]> {
    const query = `
      SELECT id, filename, original_filename, stored_filename, mime_type, file_path, size, processing_status, extracted_text, error_message, ai_summary, ai_recommendations, ai_cost_cents, ai_processed_at, ai_status, created_at, updated_at
      FROM files
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  async getFileById(id: string): Promise<FileRecord | null> {
    const query = `
      SELECT id, filename, original_filename, stored_filename, mime_type, file_path, size, processing_status, extracted_text, error_message, ai_summary, ai_recommendations, ai_cost_cents, ai_processed_at, ai_status, created_at, updated_at
      FROM files
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async deleteFile(id: string): Promise<boolean> {
    const query = `
      DELETE FROM files
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getFileStatus(id: string): Promise<{ processing_status: string; error_message?: string; ai_status?: string } | null> {
    const query = `
      SELECT processing_status, error_message, ai_status
      FROM files
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getFileText(id: string): Promise<{ extracted_text?: string; processing_status: string; ai_summary?: string; ai_recommendations?: string; ai_cost_cents?: number; ai_processed_at?: Date; ai_status?: string } | null> {
    const query = `
      SELECT extracted_text, processing_status, ai_summary, ai_recommendations, ai_cost_cents, ai_processed_at, ai_status
      FROM files
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateAIStatus(id: string, status: string): Promise<void> {
    const query = 'UPDATE files SET ai_status = $1 WHERE id = $2';
    await pool.query(query, [status, id]);
  }

  async updateAIResults(id: string, summary: string, recommendations: string): Promise<void> {
    const query = 'UPDATE files SET ai_summary = $1, ai_recommendations = $2, ai_processed_at = CURRENT_TIMESTAMP WHERE id = $3';
    await pool.query(query, [summary, recommendations, id]);
  }

  async updateProcessingStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const query = `
      UPDATE files 
      SET processing_status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `;
    await pool.query(query, [status, errorMessage || null, id]);
  }

  async updateExtractedText(id: string, text: string): Promise<void> {
    const query = `
      UPDATE files 
      SET extracted_text = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(query, [text, id]);
  }
}

export default new FileService(); 