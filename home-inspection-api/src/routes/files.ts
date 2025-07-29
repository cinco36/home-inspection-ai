import { Router, Request, Response } from 'express';
import fileService from '../services/fileService';
import fileProcessingQueue from '../config/queue';
import aiService from '../services/aiService';

const router = Router();

// GET /api/v1/files - List all files
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await fileService.getAllFiles();
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files'
    });
  }
});

// POST /api/v1/files - Create a new file record
router.post('/', async (req: Request, res: Response) => {
  try {
    const fileData = req.body;
    const savedFile = await fileService.createFile(fileData);
    res.status(201).json({
      success: true,
      data: savedFile
    });
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create file'
    });
  }
});

// GET /api/v1/files/:id - Get a specific file
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = await fileService.getFileById(id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file'
    });
  }
});

// DELETE /api/v1/files/:id - Delete a file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await fileService.deleteFile(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// POST /api/v1/files/:id/reprocess - Re-run text extraction or AI processing
router.post('/:id/reprocess', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'text' or 'ai'
    
    const file = await fileService.getFileById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    if (type === 'text') {
      // Re-run text extraction
      await fileProcessingQueue.add('file-processing', {
        fileId: id,
        filePath: file.file_path,
        mimeType: file.mime_type
      });
      
      res.json({
        success: true,
        message: 'Text extraction job queued successfully'
      });
    } else if (type === 'ai') {
      // Re-run AI processing
      if (!file.extracted_text) {
        return res.status(400).json({
          success: false,
          error: 'No extracted text available for AI processing'
        });
      }
      
      // Update AI status to processing
      await fileService.updateAIStatus(id, 'processing');
      
      // Generate AI summary
      const summaryPrompt = `Please provide a concise summary of this home inspection report. Focus on key findings, major issues, and overall condition assessment.`;
      const aiSummary = await aiService.processText(summaryPrompt, file.extracted_text, id, { requestType: 'summary' });
      
      // Generate AI recommendations
      const recommendationsPrompt = `Based on this home inspection report, provide specific recommendations for the homeowner. Include priority levels (High/Medium/Low) and estimated costs where possible.`;
      const aiRecommendations = await aiService.processText(recommendationsPrompt, file.extracted_text, id, { requestType: 'recommendations' });
      
      // Update database with AI results
      await fileService.updateAIResults(id, aiSummary, aiRecommendations);
      await fileService.updateAIStatus(id, 'completed');
      
      res.json({
        success: true,
        message: 'AI processing completed successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "text" or "ai"'
      });
    }
  } catch (error) {
    console.error('Error reprocessing file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reprocess file'
    });
  }
});

export default router; 