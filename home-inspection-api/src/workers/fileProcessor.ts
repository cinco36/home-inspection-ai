import { Job } from 'bull';
import fileProcessingQueue from '../config/queue';
import fileService from '../services/fileService';
import fileValidationService from '../services/fileValidationService';
import aiService from '../services/aiService';
import fs from 'fs-extra';
import path from 'path';
import pdf from 'pdf-parse';

interface FileProcessingJob {
  fileId: string;
  filePath: string;
  originalFilename?: string;
  mimeType?: string; // Handle old job format
}

// Process file uploads
fileProcessingQueue.process(async (job: Job<FileProcessingJob>) => {
  const { fileId, filePath, originalFilename, mimeType } = job.data;
  
  // Handle both old and new job formats
  const fileName = originalFilename || path.basename(filePath);
  
  console.log(`🔄 Processing file: ${fileName} (ID: ${fileId})`);
  console.log(`📁 File path: ${filePath}`);
  console.log(`📋 Job data:`, JSON.stringify(job.data, null, 2));
  
  try {
    // Update file status to processing
    await fileService.updateProcessingStatus(fileId, 'processing');
    
    // Validate file exists
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    
    // Extract text based on file type
    let extractedText = '';
    const fileExtension = path.extname(fileName).toLowerCase();
    
    if (fileExtension === '.pdf') {
      // Extract text from PDF
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      extractedText = pdfData.text;
      
      console.log(`📄 Extracted ${extractedText.length} characters from PDF`);
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      // For now, just note that DOC/DOCX processing would go here
      // You'd typically use a library like mammoth or docx for this
      extractedText = '[DOC/DOCX text extraction not yet implemented]';
      console.log(`📝 DOC/DOCX processing placeholder for: ${fileName}`);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    // Update file with extracted text
    await fileService.updateExtractedText(fileId, extractedText);
    
    // Update status to completed for text extraction
    await fileService.updateProcessingStatus(fileId, 'completed');
    
    console.log(`✅ Successfully processed file: ${fileName}`);
    
    // Now trigger AI processing
    console.log(`🤖 Starting AI processing for file: ${fileName}`);
    try {
      // Update AI status to processing
      await fileService.updateAIStatus(fileId, 'processing');
      
      // Process with AI
      const aiResult = await aiService.processFile(fileId, extractedText);
      
      if (aiResult.success) {
        // Update AI results and status
        await fileService.updateAIResults(fileId, aiResult.summary || '', aiResult.recommendations || '');
        await fileService.updateAIStatus(fileId, 'completed');
        console.log(`✅ AI processing completed for file: ${fileName}`);
      } else {
        // Update AI status to failed
        await fileService.updateAIStatus(fileId, 'failed');
        console.log(`❌ AI processing failed for file: ${fileName}: ${aiResult.error}`);
      }
    } catch (aiError) {
      console.error(`❌ AI processing error for file ${fileName}:`, aiError);
      await fileService.updateAIStatus(fileId, 'failed');
    }
    
    return {
      success: true,
      fileId,
      textLength: extractedText.length,
      message: 'File processed successfully with AI analysis'
    };
    
  } catch (error) {
    console.error(`❌ Error processing file ${fileName}:`, error);
    
    // Update file status to failed
    await fileService.updateProcessingStatus(fileId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    
    throw error;
  }
});

// Handle job completion
fileProcessingQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully:`, result);
});

// Handle job failure
fileProcessingQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} failed:`, error.message);
});

// Handle queue errors
fileProcessingQueue.on('error', (error) => {
  console.error('🚨 Queue error:', error);
});

console.log('📋 File processing worker initialized and ready to process jobs'); 