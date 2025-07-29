-- Comprehensive database migration to fix missing columns in files table
-- This script adds all missing AI fields and the updated_at column

-- Add AI-related columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_recommendations TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_cost_cents INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'pending';

-- Add updated_at column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when records are modified
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for AI status queries
CREATE INDEX IF NOT EXISTS idx_files_ai_status ON files(ai_status);

-- Update existing files to have 'pending' AI status
UPDATE files SET ai_status = 'pending' WHERE ai_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN files.ai_summary IS 'AI-generated summary of the document content';
COMMENT ON COLUMN files.ai_recommendations IS 'AI-generated recommendations based on document analysis';
COMMENT ON COLUMN files.ai_cost_cents IS 'Cost in cents for AI processing of this file';
COMMENT ON COLUMN files.ai_processed_at IS 'Timestamp when AI processing was completed';
COMMENT ON COLUMN files.ai_status IS 'Status of AI processing: pending, processing, completed, failed';
COMMENT ON COLUMN files.updated_at IS 'Timestamp when the record was last updated'; 