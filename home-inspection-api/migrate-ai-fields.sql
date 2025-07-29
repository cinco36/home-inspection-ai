-- Migration to add AI fields to files table
-- Run this script to add AI processing capabilities to existing files table

-- Add AI-related columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_recommendations TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_cost_cents INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP;
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'pending';

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