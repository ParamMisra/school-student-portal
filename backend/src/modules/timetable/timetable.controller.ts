import { Request, Response } from 'express';
import { TimeTableModel } from '../../models/TimeTable.model';
import { UserModel } from '../../models/User.model';
import { getPaginationParams } from '../../utils/helpers';
import { io } from '../../server';

export class TimeTableController {
  static async getAdminTimetable(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const totalRows = await TimeTableModel.countDocuments();
      const timetable = await TimeTableModel.find().skip(skip).limit(limit).populate('class_id teacher_id substitute_id');
      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createTimetable(req: Request, res: Response) {
    try {
      const entry = await TimeTableModel.create(req.body);

      io.emit('TIMETABLE_CREATED', entry);

      res.status(201).json({ message: 'Timetable created', data: entry });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateTimetable(req: Request, res: Response) {
    try {
      const updated = await TimeTableModel.findOneAndUpdate({ timetable_id: req.params.id }, { $set: req.body }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Entry not found' });

      io.emit('TIMETABLE_UPDATED', updated);

      res.status(200).json({ message: 'Timetable updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteTimetable(req: Request, res: Response) {
    try {
      const deleted = await TimeTableModel.findOneAndDelete({ timetable_id: req.params.id });
      if (!deleted) return res.status(404).json({ message: 'Entry not found' });

      io.emit('TIMETABLE_DELETED', { timetable_id: req.params.id });

      res.status(200).json({ message: 'Timetable deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTeacherTimetable(req: Request, res: Response) {
    try {
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      const timetable = await TimeTableModel.find({ $or: [{ teacher_id: teacher?._id }, { substitute_id: teacher?._id }] }).populate('class_id');
      res.status(200).json({ data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getStudentTimetable(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      const timetable = await TimeTableModel.find({ class_id: student?.class_id }).populate('teacher_id substitute_id');
      res.status(200).json({ data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async assignSubstitute(req: Request, res: Response) {
    try {
      const { substitute_id } = req.body;
      const subUser = await UserModel.findOne({ user_id: substitute_id });
      const updated = await TimeTableModel.findOneAndUpdate(
        { timetable_id: req.params.id },
        { $set: { substitute_id: subUser?._id } },
        { new: true }
      );

      io.emit('SUBSTITUTE_ASSIGNED', updated);
      
      res.status(200).json({ message: 'Substitute assigned successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getTeacherSubstitutes(req: Request, res: Response) {
    try {
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      const subs = await TimeTableModel.find({ substitute_id: teacher?._id }).populate('class_id teacher_id');
      res.status(200).json({ data: subs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}