import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Create Redis client
export const redisClient = createClient(redisConfig);

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
redisClient.connect().catch(console.error);

export default redisConfig; 

