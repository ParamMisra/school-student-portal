import { Redis } from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Required for BullMQ
});

redisConnection.on('connect', () => {
  console.log('⚡ Connected to Redis successfully.');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});