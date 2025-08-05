-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    extracted_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create text_chunks table for simplified chunking system
CREATE TABLE IF NOT EXISTS text_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    overlap_with_previous INTEGER DEFAULT 0,
    overlap_with_next INTEGER DEFAULT 0,
    word_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_requests table
CREATE TABLE IF NOT EXISTS ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    prompt_used TEXT NOT NULL,
    input_text TEXT NOT NULL,
    response_text TEXT,
    tokens_used INTEGER,
    cost_cents INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on filename for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- Create indexes for text_chunks table
CREATE INDEX IF NOT EXISTS idx_text_chunks_file_id ON text_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_text_chunks_chunk_index ON text_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_text_chunks_created_at ON text_chunks(created_at);

-- Create indexes for ai_requests table
CREATE INDEX IF NOT EXISTS idx_ai_requests_file_id ON ai_requests(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON ai_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_requests_request_type ON ai_requests(request_type); 