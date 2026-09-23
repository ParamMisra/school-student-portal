import { Request, Response } from 'express';
import { ClassModel } from '../../models/Class.model';
import { UserModel } from '../../models/User.model';
import { getPaginationParams } from '../../utils/helpers';
import { io } from '../../server';

export class ClassController {
  static async getClasses(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const query = { school_id: req.user?.schoolId };
      const totalRows = await ClassModel.countDocuments(query);
      const classes = await ClassModel.find(query).skip(skip).limit(limit);
      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: classes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createClass(req: Request, res: Response) {
    try {
      const newClass = await ClassModel.create(req.body);

      io.emit('CLASS_CREATED', newClass);

      res.status(201).json({ message: 'Class created successfully', data: newClass });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateClass(req: Request, res: Response) {
    try {
      const updated = await ClassModel.findOneAndUpdate({ class_id: req.params.classId }, { $set: req.body }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Class not found' });

      io.emit('CLASS_UPDATED', updated);

      res.status(200).json({ message: 'Class updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteClass(req: Request, res: Response) {
    try {
      const deleted = await ClassModel.findOneAndDelete({ class_id: req.params.classId });
      if (!deleted) return res.status(404).json({ message: 'Class not found' });

      io.emit('CLASS_DELETED', { class_id: req.params.classId });
      
      res.status(200).json({ message: 'Class deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getClassStudents(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const classObj = await ClassModel.findOne({ class_id: req.params.classId });
      if (!classObj) return res.status(404).json({ message: 'Class not found' });

      const query = { class_id: classObj._id, role: 'student' };
      const totalRows = await UserModel.countDocuments(query);
      const students = await UserModel.find(query).skip(skip).limit(limit).select('-password_hash');
      
      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: students });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}