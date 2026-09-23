import { Worker } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { UserModel } from '../../models/User.model';
import bcrypt from 'bcryptjs';
import { io } from '../../server'; // ⚡ WebSocket: Import Socket.IO instance

// Worker processing bulk records in background safely
export const startBulkUploadWorker = () => {
  const worker = new Worker(
    'bulk-upload-queue',
    async (job) => {
      const { usersData } = job.data;
      console.log(`⚙️ Processing bulk upload job: ${job.id} with ${usersData.length} records`);

      let processedCount = 0;

      for (const row of usersData) {
        if (!row.email) {
          console.warn(`⚠️ Skipping row with missing email:`, row);
          continue;
        }

        // Dynamically create default password from email prefix
        const emailPrefix = row.email.split('@')[0];
        const rawPassword = `${emailPrefix}123`;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 1. Build base update payload
        const updateData: Record<string, any> = {
          user_id: row.user_id,
          school_id: row.school_id,
          name: row.name,
          role: row.role,
          password_hash: hashedPassword,
        };

        // 2. Safely add class_id ONLY if it exists and is not an empty string
        if (row.class_id && String(row.class_id).trim() !== '') {
          updateData.class_id = row.class_id;
        }

        await UserModel.updateOne(
          { email: row.email },
          { $set: updateData },
          { upsert: true }
        );

        processedCount++;

        // ⚡ WebSocket: Emit bulk upload progress event
        io.emit('BULK_UPLOAD_PROGRESS', {
          jobId: job.id,
          processed: processedCount,
          total: usersData.length,
          percentage: Math.round((processedCount / usersData.length) * 100),
        });
      }

      console.log(`✅ Bulk upload job ${job.id} finished successfully.`);

      // ⚡ WebSocket: Emit completion event
      io.emit('BULK_UPLOAD_COMPLETED', {
        jobId: job.id,
        totalRecords: usersData.length,
      });
    },
    { connection: redisConnection }
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ Bulk upload job ${job?.id} failed:`, err);
    
    // ⚡ WebSocket: Emit failure event
    io.emit('BULK_UPLOAD_FAILED', { jobId: job?.id, error: err.message });
  });
};