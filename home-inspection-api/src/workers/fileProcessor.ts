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
      // Extract text from PDF with enhanced error handling
      try {
        const dataBuffer = await fs.readFile(filePath);
        
        // Check if file is actually a PDF by looking at the header
        const header = dataBuffer.toString('ascii', 0, 4);
        if (header !== '%PDF') {
          throw new Error('File does not appear to be a valid PDF (missing PDF header)');
        }
        
        // Try to parse the PDF with timeout and retry logic
        let pdfData;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            pdfData = await pdf(dataBuffer);
            break; // Success, exit retry loop
          } catch (pdfError) {
            retryCount++;
            const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error';
            console.warn(`⚠️ PDF parsing attempt ${retryCount} failed for ${fileName}: ${errorMessage}`);
            
            if (retryCount > maxRetries) {
              // If all retries failed, try a more lenient approach
              try {
                // Try with minimal options
                pdfData = await pdf(dataBuffer);
              } catch (finalError) {
                const finalErrorMessage = finalError instanceof Error ? finalError.message : 'Unknown error';
                throw new Error(`PDF parsing failed after ${maxRetries} attempts: ${finalErrorMessage}`);
              }
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        extractedText = pdfData.text || '';
        
        // Validate extracted text
        if (!extractedText || extractedText.trim().length === 0) {
          console.warn(`⚠️ No text extracted from PDF: ${fileName}`);
          extractedText = '[No text could be extracted from this PDF file]';
        }
        
        console.log(`📄 Extracted ${extractedText.length} characters from PDF`);
        
      } catch (pdfError) {
        const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF processing error';
        console.error(`❌ PDF processing error for ${fileName}:`, errorMessage);
        
        // Provide a more user-friendly error message
        if (errorMessage.includes('bad XRef entry') || errorMessage.includes('Illegal character')) {
          extractedText = '[PDF appears to be corrupted or password-protected. Please try uploading a different file.]';
        } else if (errorMessage.includes('PDF header')) {
          extractedText = '[File does not appear to be a valid PDF. Please check the file format.]';
        } else {
          extractedText = `[PDF processing failed: ${errorMessage}]`;
        }
        
        // Don't throw error, continue with the extracted text (even if it's an error message)
        console.log(`⚠️ Continuing with error message as extracted text for: ${fileName}`);
      }
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      // For now, just note that DOC/DOCX processing would go here
      // You'd typically use a library like mammoth or docx for this
      extractedText = '[DOC/DOCX text extraction not yet implemented]';
      console.log(`📝 DOC/DOCX processing placeholder for: ${fileName}`);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    // Calculate token estimation for the extracted text
    const tokenAnalysis = aiService.estimateTokensEnhanced(extractedText);
    console.log(`🔢 Token estimation: ${tokenAnalysis.estimatedTokens} tokens (estimated cost: $${(tokenAnalysis.estimatedCostCents / 100).toFixed(4)})`);
    
    // Update file with extracted text and token estimation
    await fileService.updateExtractedTextWithTokens(
      fileId, 
      extractedText, 
      tokenAnalysis.estimatedTokens, 
      tokenAnalysis.estimatedCostCents
    );
    
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
      estimatedTokens: tokenAnalysis.estimatedTokens,
      estimatedCostCents: tokenAnalysis.estimatedCostCents,
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