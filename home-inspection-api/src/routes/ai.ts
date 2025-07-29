import { Router } from 'express';
import aiService from '../services/aiService';
import fileService from '../services/fileService';

const router = Router();

/**
 * Test OpenAI connectivity
 * POST /api/v1/ai/test
 */
router.post('/test', async (req, res) => {
  try {
    const result = await aiService.testConnection();
    
    res.json({
      success: result.success,
      message: result.message,
      model: result.model,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get usage statistics
 * GET /api/v1/ai/usage
 */
router.get('/usage', async (req, res) => {
  try {
    const stats = await aiService.getUsageStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalCostDollars: (stats.totalCostCents / 100).toFixed(2),
        averageCostPerRequest: stats.totalRequests > 0 
          ? (stats.totalCostCents / stats.totalRequests / 100).toFixed(4)
          : '0.0000',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get AI requests for a specific file
 * GET /api/v1/ai/requests/:fileId
 */
router.get('/requests/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Verify file exists
    const file = await fileService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    const requests = await aiService.getRequestsByFileId(fileId);
    
    res.json({
      success: true,
      data: {
        fileId,
        requests,
        totalRequests: requests.length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        failedRequests: requests.filter(r => r.status === 'failed').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Process text with AI
 * POST /api/v1/ai/process
 */
router.post('/process', async (req, res) => {
  try {
    const { fileId, prompt, text, requestType, options } = req.body;

    // Validate required fields
    if (!fileId || !prompt || !text) {
      return res.status(400).json({
        success: false,
        error: 'fileId, prompt, and text are required',
      });
    }

    // Verify file exists
    const file = await fileService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Check if file has extracted text
    if (!file.extracted_text) {
      return res.status(400).json({
        success: false,
        error: 'File has no extracted text. Please wait for processing to complete.',
      });
    }

    // Process with AI
    const response = await aiService.processText(
      prompt,
      text,
      fileId,
      {
        requestType: requestType || 'general',
        ...options,
      }
    );

    res.json({
      success: true,
      data: {
        response,
        fileId,
        requestType: requestType || 'general',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Trigger AI processing for a specific file
 * POST /api/v1/ai/process-file/:fileId
 */
router.post('/process-file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Verify file exists
    const file = await fileService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Check if file has extracted text
    if (!file.extracted_text) {
      return res.status(400).json({
        success: false,
        error: 'File has no extracted text. Please wait for processing to complete.',
      });
    }

    // Check if AI processing is already in progress or completed
    if (file.ai_status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'AI processing is already in progress for this file.',
      });
    }

    if (file.ai_status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'AI processing has already been completed for this file.',
      });
    }

    // Update AI status to processing
    await fileService.updateAIStatus(fileId, 'processing');

    // Process with AI
    const result = await aiService.processFile(fileId, file.extracted_text);

    if (result.success) {
      // Update AI results and status
      await fileService.updateAIResults(fileId, result.summary || '', result.recommendations || '');
      await fileService.updateAIStatus(fileId, 'completed');

      res.json({
        success: true,
        data: {
          fileId,
          summary: result.summary,
          recommendations: result.recommendations,
          costCents: result.costCents,
          message: 'AI processing completed successfully',
        },
      });
    } else {
      // Update AI status to failed
      await fileService.updateAIStatus(fileId, 'failed');

      res.status(500).json({
        success: false,
        error: result.error || 'AI processing failed',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get AI configuration
 * GET /api/v1/ai/config
 */
router.get('/config', async (req, res) => {
  try {
    const config = aiService.getConfig();
    const models = aiService.getAvailableModels();
    
    res.json({
      success: true,
      data: {
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        availableModels: models,
        hasApiKey: !!config.apiKey,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Estimate tokens for text
 * POST /api/v1/ai/estimate-tokens
 */
router.post('/estimate-tokens', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text is required',
      });
    }

    const estimatedTokens = aiService.estimateTokens(text);
    const config = aiService.getConfig();
    
    res.json({
      success: true,
      data: {
        estimatedTokens,
        textLength: text.length,
        maxAllowedTokens: config.maxTokens,
        withinLimit: estimatedTokens <= config.maxTokens,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 

