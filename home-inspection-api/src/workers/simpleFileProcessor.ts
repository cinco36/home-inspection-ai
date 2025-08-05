import { Job } from 'bull';
import fileProcessingQueue from '../config/queue';
import fileService from '../services/fileService';
import fileValidationService from '../services/fileValidationService';
import aiService from '../services/aiService';
import fs from 'fs-extra';
import path from 'path';
import pdf from 'pdf-parse';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface SimpleFileProcessingJob {
  fileId: string;
  filePath: string;
  originalFilename?: string;
  mimeType?: string;
}

interface ProcessingResult {
  success: boolean;
  fileId: string;
  textLength: number;
  totalChunks: number;
  totalTokens: number;
  totalCost: number;
  message: string;
  error?: string;
}

interface TextChunk {
  id: string;
  fileId: string;
  chunkIndex: number;
  content: string;
  startPosition: number;
  endPosition: number;
  overlapWithPrevious: number;
  overlapWithNext: number;
  wordCount: number;
  createdAt: Date;
}

class SimpleFileProcessor {
  private db: Pool;
  private readonly CHUNK_SIZE = 4000; // characters
  private readonly OVERLAP_PERCENTAGE = 0.10; // 10% overlap

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Process file with simple chunking and AI analysis
   */
  async processFile(job: Job<SimpleFileProcessingJob>): Promise<ProcessingResult> {
    const { fileId, filePath, originalFilename, mimeType } = job.data;
    const fileName = originalFilename || path.basename(filePath);

    console.log(`🔄 Processing file: ${fileName} (ID: ${fileId})`);
    console.log(`📁 File path: ${filePath}`);

    try {
      // Step 1: Update file status to processing
      await fileService.updateProcessingStatus(fileId, 'processing');

      // Step 2: Validate file exists
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      // Step 3: Extract text from file
      console.log(`📄 Extracting text from ${fileName}...`);
      const extractedText = await this.extractTextFromFile(filePath, fileName);
      console.log(`✅ Extracted ${extractedText.length} characters`);

      // Step 4: Estimate tokens and update file with extracted text
      console.log(`🔢 Estimating tokens...`);
      const tokenAnalysis = aiService.estimateTokensEnhanced(extractedText);
      await fileService.updateExtractedTextWithTokens(fileId, extractedText, tokenAnalysis.estimatedTokens, tokenAnalysis.estimatedCostCents);
      console.log(`✅ Token estimation: ${tokenAnalysis.estimatedTokens} tokens, $${(tokenAnalysis.estimatedCostCents / 100).toFixed(2)} cost`);

      // Step 5: Create overlapping chunks
      console.log(`📦 Creating overlapping chunks...`);
      const chunks = this.createOverlappingChunks(extractedText, fileId);
      console.log(`✅ Created ${chunks.length} chunks with 10% overlap`);

      // Step 6: Store chunks in database
      await this.storeChunks(chunks);

      // Step 7: Process chunks with AI
      console.log(`🤖 Processing chunks with AI...`);
      const aiResults = await this.processChunksWithAI(chunks, fileId);
      console.log(`✅ Processed ${aiResults.length} chunks with AI`);

      // Step 8: Calculate statistics
      const totalTokens = aiResults.reduce((sum, result) => sum + (result.tokens_used || 0), 0);
      const totalCost = aiResults.reduce((sum, result) => sum + (result.cost_cents || 0), 0);

      // Step 9: Update file status to completed
      await fileService.updateProcessingStatus(fileId, 'completed');

      console.log(`✅ File processing completed successfully`);
      console.log(`📊 Statistics: ${chunks.length} chunks, ${totalTokens} tokens, $${(totalCost / 100).toFixed(2)} cost`);

      return {
        success: true,
        fileId,
        textLength: extractedText.length,
        totalChunks: chunks.length,
        totalTokens,
        totalCost,
        message: 'File processed successfully'
      };

    } catch (error) {
      console.error(`❌ File processing error for ${fileName}:`, error);
      
      // Update file status to failed
      await fileService.updateProcessingStatus(fileId, 'failed', error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        fileId,
        textLength: 0,
        totalChunks: 0,
        totalTokens: 0,
        totalCost: 0,
        message: 'File processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create overlapping chunks with 10% overlap
   */
  private createOverlappingChunks(text: string, fileId: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const overlapSize = Math.floor(this.CHUNK_SIZE * this.OVERLAP_PERCENTAGE);
    const stepSize = this.CHUNK_SIZE - overlapSize;
    
    let position = 0;
    let chunkIndex = 0;

    while (position < text.length) {
      const endPosition = Math.min(position + this.CHUNK_SIZE, text.length);
      const content = text.substring(position, endPosition);
      
      // Calculate overlap with previous chunk
      const overlapWithPrevious = chunkIndex > 0 ? overlapSize : 0;
      
      // Calculate overlap with next chunk
      const overlapWithNext = endPosition < text.length ? overlapSize : 0;

      const chunk: TextChunk = {
        id: uuidv4(),
        fileId,
        chunkIndex,
        content,
        startPosition: position,
        endPosition,
        overlapWithPrevious,
        overlapWithNext,
        wordCount: content.split(/\s+/).length,
        createdAt: new Date()
      };

      chunks.push(chunk);
      
      position += stepSize;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Store chunks in database
   */
  private async storeChunks(chunks: TextChunk[]): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Create chunks table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS text_chunks (
          id VARCHAR(255) PRIMARY KEY,
          file_id UUID REFERENCES files(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          start_position INTEGER NOT NULL,
          end_position INTEGER NOT NULL,
          overlap_with_previous INTEGER NOT NULL,
          overlap_with_next INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert chunks
      for (const chunk of chunks) {
        await client.query(`
          INSERT INTO text_chunks (
            id, file_id, chunk_index, content, start_position, end_position,
            overlap_with_previous, overlap_with_next, word_count, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            start_position = EXCLUDED.start_position,
            end_position = EXCLUDED.end_position,
            overlap_with_previous = EXCLUDED.overlap_with_previous,
            overlap_with_next = EXCLUDED.overlap_with_next,
            word_count = EXCLUDED.word_count
        `, [
          chunk.id, chunk.fileId, chunk.chunkIndex, chunk.content,
          chunk.startPosition, chunk.endPosition, chunk.overlapWithPrevious,
          chunk.overlapWithNext, chunk.wordCount, chunk.createdAt
        ]);
      }

      await client.query('COMMIT');
      console.log(`✅ Stored ${chunks.length} chunks in database`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process chunks with AI
   */
  private async processChunksWithAI(chunks: TextChunk[], fileId: string): Promise<any[]> {
    const results = [];
    let allSummaries = [];
    let allRecommendations = [];

    for (const chunk of chunks) {
      try {
        console.log(`🤖 Processing chunk ${chunk.chunkIndex + 1}/${chunks.length}...`);
        
        const prompt = this.createPromptForChunk(chunk);
        const response = await aiService.processText(prompt, chunk.content, fileId, { requestType: 'chunk_analysis' });
        
        // Store AI result
        const aiResult = await this.storeAIResult(fileId, chunk.id, prompt, chunk.content, response);
        results.push(aiResult);
        
        // Extract summary and recommendations from response
        if (response) {
          try {
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.summary) {
              allSummaries.push(parsedResponse.summary);
            }
            if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
              allRecommendations.push(...parsedResponse.recommendations);
            }
          } catch (parseError) {
            // If JSON parsing fails, treat the entire response as summary
            allSummaries.push(response);
          }
        }
        
        console.log(`✅ Chunk ${chunk.chunkIndex + 1} processed successfully`);
      } catch (error) {
        console.error(`❌ Error processing chunk ${chunk.chunkIndex + 1}:`, error);
        // Continue with next chunk instead of failing entire process
      }
    }

    // Update the main file record with consolidated AI results
    if (allSummaries.length > 0 || allRecommendations.length > 0) {
      const consolidatedSummary = allSummaries.join(' ');
      const consolidatedRecommendations = allRecommendations.length > 0 
        ? allRecommendations.map(rec => `- ${rec}`).join('\\n')
        : '';
      
      await fileService.updateAIResults(fileId, consolidatedSummary, consolidatedRecommendations);
      await fileService.updateAIStatus(fileId, 'completed');
      console.log('✅ AI results consolidated and stored in main file record');
    }

    return results;
  }

  /**
   * Store AI processing result
   */
  private async storeAIResult(fileId: string, chunkId: string, prompt: string, inputText: string, response: any): Promise<any> {
    const client = await this.db.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO ai_requests (
          file_id, request_type, prompt_used, input_text, response_text,
          tokens_used, cost_cents, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        fileId,
        'chunk_analysis',
        prompt,
        inputText,
        JSON.stringify(response),
        response.tokens_used || 0,
        response.cost_cents || 0,
        'completed',
        new Date()
      ]);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Create prompt for chunk analysis
   */
  private createPromptForChunk(chunk: TextChunk): string {
    return `Analyze this text chunk from a home inspection report and extract the following information:

1. **Findings**: List any issues, problems, or concerns found during the inspection
2. **Recommendations**: Provide specific recommendations for addressing any issues
3. **Summary**: Brief summary of this section's key points
4. **Severity**: Rate the overall severity of issues in this section (Low/Medium/High/Critical)

Text to analyze:
${chunk.content}

Please provide your analysis in JSON format with the following structure:
{
  "findings": ["finding1", "finding2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "brief summary",
  "severity": "Low/Medium/High/Critical"
}`;
  }

  /**
   * Update file with extracted text
   */
  private async updateFileWithExtractedText(fileId: string, extractedText: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query(`
        UPDATE files 
        SET extracted_text = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [extractedText, fileId]);
    } finally {
      client.release();
    }
  }

  /**
   * Extract text from file based on type
   */
  private async extractTextFromFile(filePath: string, fileName: string): Promise<string> {
    const fileExtension = path.extname(fileName).toLowerCase();
    
    switch (fileExtension) {
      case '.pdf':
        return await this.extractTextFromPDF(filePath, fileName);
      case '.txt':
        return await this.extractTextFromTXT(filePath);
      case '.doc':
      case '.docx':
        return await this.extractTextFromDOC(filePath, fileName);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(filePath: string, fileName: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error(`Error extracting text from PDF ${fileName}:`, error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from TXT file
   */
  private async extractTextFromTXT(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading TXT file:', error);
      throw new Error(`Failed to read TXT file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOC/DOCX file
   */
  private async extractTextFromDOC(filePath: string, fileName: string): Promise<string> {
    // For now, return a placeholder message
    // In a real implementation, you would use a library like mammoth or textract
    console.warn(`DOC/DOCX extraction not implemented for ${fileName}`);
    return `[DOC/DOCX content extraction not implemented for ${fileName}]`;
  }
}

export default SimpleFileProcessor; 