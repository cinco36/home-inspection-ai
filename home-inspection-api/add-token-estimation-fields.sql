-- Add token estimation fields to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER,
ADD COLUMN IF NOT EXISTS estimated_cost_cents INTEGER,
ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_recommendations TEXT;

-- Create index on estimated_tokens for faster queries
CREATE INDEX IF NOT EXISTS idx_files_estimated_tokens ON files(estimated_tokens);

-- Create index on ai_status for filtering
CREATE INDEX IF NOT EXISTS idx_files_ai_status ON files(ai_status); 