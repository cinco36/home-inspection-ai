import { Router, Request, Response } from 'express';
import fileService from '../services/fileService';

const router = Router();

// Get file processing status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
    }

    const status = await fileService.getFileStatus(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting file status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file status'
    });
  }
});

// Get extracted text and AI data from file
router.get('/:id/text', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required'
      });
    }

    const textData = await fileService.getFileText(id);
    
    if (!textData) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if processing is still in progress
    if (textData.processing_status === 'pending' || textData.processing_status === 'processing') {
      return res.status(202).json({
        success: true,
        data: {
          processing_status: textData.processing_status,
          message: 'File is still being processed'
        }
      });
    }

    // Check if processing failed
    if (textData.processing_status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'File processing failed',
        data: {
          processing_status: textData.processing_status
        }
      });
    }

    res.json({
      success: true,
      data: {
        processing_status: textData.processing_status,
        text: textData.extracted_text || 'No text content found',
        // Include AI data
        ai_summary: textData.ai_summary,
        ai_recommendations: textData.ai_recommendations,
        ai_cost_cents: textData.ai_cost_cents,
        ai_processed_at: textData.ai_processed_at,
        ai_status: textData.ai_status,
      }
    });
  } catch (error) {
    console.error('Error getting file text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file text'
    });
  }
});

export default router; 