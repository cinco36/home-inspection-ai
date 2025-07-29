import Queue from 'bull';
import redisConfig from './redis';

// Create file processing queue
export const fileProcessingQueue = new Queue('file-processing', {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  },
});

// Queue event handlers
fileProcessingQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed. File: ${job.data.fileId}`);
});

fileProcessingQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed. File: ${job.data.fileId}`, err);
});

fileProcessingQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

export default fileProcessingQueue; 

