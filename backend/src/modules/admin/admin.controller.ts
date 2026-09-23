import { Request, Response } from 'express';
import { UserModel } from '../../models/User.model';
import { getPaginationParams } from '../../utils/helpers';
import { bulkUploadQueue } from './admin.queue';
import fs from 'fs';
import csv from 'csv-parser';



export class AdminController {
  static async getUsers(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const schoolId = req.user?.schoolId;

      const query = { school_id: schoolId };
      const totalRows = await UserModel.countDocuments(query);
      const users = await UserModel.find(query).skip(skip).limit(limit).select('-password_hash');

      res.status(200).json({
        page,
        limit,
        totalRows,
        totalPages: Math.ceil(totalRows / limit),
        data: users,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const user = await UserModel.findOne({ user_id: req.params.userId }).select('-password_hash');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const updated = await UserModel.findOneAndUpdate(
        { user_id: req.params.userId },
        { $set: req.body },
        { new: true }
      ).select('-password_hash');
      if (!updated) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User updated successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const deleted = await UserModel.findOneAndDelete({ user_id: req.params.userId });
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async bulkUpload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a CSV file' });
      }

      const results: Record<string, any>[] = [];
      const filePath = req.file.path;

      // Read and parse the uploaded CSV file using streams
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: Record<string, any>) => results.push(data))
        .on('end', async () => {
          // Clean up temporary uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          if (results.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or formatted incorrectly' });
          }

          // Add the parsed array to BullMQ background job
          const job = await bulkUploadQueue.add('bulk-user-insert', { usersData: results });

          res.status(202).json({
            message: 'CSV uploaded and bulk processing job queued successfully',
            jobId: job.id,
            totalRowsParsed: results.length,
          });
        })
        .on('error', (err: Error) => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({ error: 'Failed to parse CSV file: ' + err.message });
        });

    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
} 