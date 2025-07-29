import { Router, Request, Response } from 'express';
import fileProcessingQueue from '../config/queue';
import fileService from '../services/fileService';
import aiService from '../services/aiService';

const router = Router();

// GET /api/v1/queue/status - Get overall queue statistics with AI tracking
router.get('/status', async (req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      fileProcessingQueue.getWaiting(),
      fileProcessingQueue.getActive(),
      fileProcessingQueue.getCompleted(),
      fileProcessingQueue.getFailed()
    ]);

    const totalJobs = waiting.length + active.length + completed.length + failed.length;
    
    // Calculate average processing time from completed jobs
    let avgProcessingTime = 0;
    if (completed.length > 0) {
      const processingTimes = completed.map(job => {
        const startTime = job.processedOn || job.timestamp;
        const endTime = job.finishedOn || Date.now();
        return (endTime - startTime) / 1000; // Convert to seconds
      });
      avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    }

    // Get AI usage statistics
    let aiStats = {
      totalRequests: 0,
      pendingRequests: 0,
      processingRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCostCents: 0
    };

    try {
      const aiUsageStats = await aiService.getUsageStats();
      aiStats = {
        totalRequests: aiUsageStats.totalRequests,
        pendingRequests: aiUsageStats.requestsByType.pending || 0,
        processingRequests: aiUsageStats.requestsByType.processing || 0,
        completedRequests: aiUsageStats.requestsByType.completed || 0,
        failedRequests: aiUsageStats.requestsByType.failed || 0,
        totalTokens: aiUsageStats.totalTokens,
        totalCostCents: aiUsageStats.totalCostCents
      };
    } catch (aiError) {
      console.warn('Could not fetch AI statistics:', aiError);
    }

    // Calculate error rates
    const fileErrorRate = totalJobs > 0 ? (failed.length / totalJobs * 100).toFixed(1) : '0.0';
    const aiErrorRate = aiStats.totalRequests > 0 ? (aiStats.failedRequests / aiStats.totalRequests * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: {
        queue_stats: {
          total_jobs: totalJobs,
          pending: waiting.length,
          processing: active.length,
          completed: completed.length,
          failed: failed.length,
          avg_processing_time: `${avgProcessingTime.toFixed(1)}s`,
          error_rate: `${fileErrorRate}%`
        },
        ai_stats: {
          total_requests: aiStats.totalRequests,
          pending: aiStats.pendingRequests,
          processing: aiStats.processingRequests,
          completed: aiStats.completedRequests,
          failed: aiStats.failedRequests,
          total_tokens: aiStats.totalTokens,
          total_cost_cents: aiStats.totalCostCents,
          error_rate: `${aiErrorRate}%`
        },
        summary_stats: {
          total_processed_files: completed.length,
          total_ai_requests: aiStats.completedRequests,
          overall_success_rate: totalJobs > 0 ? `${((completed.length / totalJobs) * 100).toFixed(1)}%` : '100%',
          total_cost: `$${(aiStats.totalCostCents / 100).toFixed(2)}`
        }
      }
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status'
    });
  }
});

// GET /api/v1/queue/jobs - Get all jobs with their status
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      fileProcessingQueue.getWaiting(),
      fileProcessingQueue.getActive(),
      fileProcessingQueue.getCompleted(),
      fileProcessingQueue.getFailed()
    ]);

    // Combine all jobs and add status
    const allJobs = [
      ...waiting.map(job => ({ ...job, status: 'pending' })),
      ...active.map(job => ({ ...job, status: 'processing' })),
      ...completed.map(job => ({ ...job, status: 'completed' })),
      ...failed.map(job => ({ ...job, status: 'failed' }))
    ];

    // Get file details for each job
    const jobsWithDetails = await Promise.all(
      allJobs.map(async (job) => {
        try {
          const fileData = job.data;
          const fileRecord = await fileService.getFileById(fileData.fileId);
          
          // Get AI requests for this file
          let aiRequests = [];
          let aiCost = 0;
          let aiTokens = 0;
          
          try {
            aiRequests = await aiService.getRequestsByFileId(fileData.fileId);
            aiCost = aiRequests.reduce((sum, req) => sum + (req.costCents || 0), 0);
            aiTokens = aiRequests.reduce((sum, req) => sum + (req.tokensUsed || 0), 0);
          } catch (aiError) {
            console.warn(`Could not fetch AI requests for file ${fileData.fileId}:`, aiError);
          }

          return {
            id: job.id,
            file_id: fileData.fileId,
            filename: fileRecord?.original_filename || 'Unknown',
            status: job.status,
            progress: job.status === 'processing' ? 50 : (job.status === 'completed' ? 100 : 0),
            created_at: new Date(job.timestamp).toISOString(),
            started_at: job.processedOn ? new Date(job.processedOn).toISOString() : null,
            completed_at: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
            error_message: job.failedReason || null,
            extracted_text_length: fileRecord?.extracted_text?.length || null,
            file_size: fileRecord?.size || null,
            ai_requests_count: aiRequests.length,
            ai_cost_cents: aiCost,
            ai_tokens: aiTokens,
            mime_type: fileRecord?.mime_type || null
          };
        } catch (error) {
          console.error(`Error getting details for job ${job.id}:`, error);
          return {
            id: job.id,
            file_id: job.data.fileId,
            filename: 'Error loading file',
            status: job.status,
            progress: 0,
            created_at: new Date(job.timestamp).toISOString(),
            started_at: null,
            completed_at: null,
            error_message: 'Failed to load file details',
            extracted_text_length: null,
            file_size: null,
            ai_requests_count: 0,
            ai_cost_cents: 0,
            ai_tokens: 0,
            mime_type: null
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        jobs: jobsWithDetails
      }
    });
  } catch (error) {
    console.error('Error getting queue jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue jobs'
    });
  }
});

// GET /api/v1/queue/jobs/:id - Get specific job details
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await fileProcessingQueue.getJob(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const fileData = job.data;
    const fileRecord = await fileService.getFileById(fileData.fileId);

    const jobDetails = {
      id: job.id,
      file_id: fileData.fileId,
      filename: fileRecord?.original_filename || 'Unknown',
      status: await job.getState(),
      progress: (await job.getState()) === 'active' ? 50 : ((await job.getState()) === 'completed' ? 100 : 0),
      created_at: new Date(job.timestamp).toISOString(),
      started_at: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      completed_at: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      error_message: job.failedReason || null,
      extracted_text: fileRecord?.extracted_text || null,
      extracted_text_length: fileRecord?.extracted_text?.length || null,
      file_size: fileRecord?.size || null,
      file_path: fileRecord?.file_path || null,
      mime_type: fileRecord?.mime_type || null
    };

    res.json({
      success: true,
      data: jobDetails
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job details'
    });
  }
});

// POST /api/v1/queue/jobs/:id/retry - Retry a failed or pending job
router.post('/jobs/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await fileProcessingQueue.getJob(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const jobState = await job.getState();
    
    // Only allow retry for failed or waiting jobs
    if (jobState !== 'failed' && jobState !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: `Cannot retry job in '${jobState}' state. Only failed or waiting jobs can be retried.`
      });
    }

    // For failed jobs, we need to create a new job with the same data
    if (jobState === 'failed') {
      const fileData = job.data;
      
      // Add new job to queue
      const newJob = await fileProcessingQueue.add({
        fileId: fileData.fileId,
        filePath: fileData.filePath,
        mimeType: fileData.mimeType
      });
      
      console.log(`Retried failed job ${id} as new job ${newJob.id}`);
      
      res.json({
        success: true,
        message: 'Job retried successfully',
        data: {
          original_job_id: id,
          new_job_id: newJob.id,
          status: 'queued'
        }
      });
    } else {
      // For waiting jobs, just move them to the front of the queue
      await job.promote();
      
      console.log(`Promoted waiting job ${id} to front of queue`);
      
      res.json({
        success: true,
        message: 'Job promoted to front of queue',
        data: {
          job_id: id,
          status: 'promoted'
        }
      });
    }
  } catch (error) {
    console.error('Error retrying job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry job'
    });
  }
});

// GET /api/v1/queue/stats - Get queue performance metrics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      fileProcessingQueue.getWaiting(),
      fileProcessingQueue.getActive(),
      fileProcessingQueue.getCompleted(),
      fileProcessingQueue.getFailed()
    ]);

    // Calculate success rate
    const totalProcessed = completed.length + failed.length;
    const successRate = totalProcessed > 0 ? (completed.length / totalProcessed * 100).toFixed(1) : '0.0';

    // Calculate average processing time
    let avgProcessingTime = 0;
    if (completed.length > 0) {
      const processingTimes = completed.map(job => {
        const startTime = job.processedOn || job.timestamp;
        const endTime = job.finishedOn || Date.now();
        return (endTime - startTime) / 1000;
      });
      avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    }

    res.json({
      success: true,
      data: {
        performance_metrics: {
          total_processed: totalProcessed,
          success_rate: `${successRate}%`,
          avg_processing_time: `${avgProcessingTime.toFixed(1)}s`,
          jobs_per_minute: completed.length > 0 ? (completed.length / (avgProcessingTime / 60)).toFixed(1) : '0.0'
        },
        queue_health: {
          pending_jobs: waiting.length,
          active_jobs: active.length,
          failed_jobs: failed.length,
          queue_size: waiting.length + active.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

export default router; 

