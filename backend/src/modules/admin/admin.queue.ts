import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis';

// BullMQ setup for asynchronous bulk upload processing
export const bulkUploadQueue = new Queue('bulk-upload-queue', {
  connection: redisConnection,
});