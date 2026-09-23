import { Request, Response } from 'express';
import { AttendanceLogModel } from '../../models/AttendanceLog.model';
import { AttendancePercentageModel } from '../../models/AttendancePercentage.model';
import { UserModel } from '../../models/User.model';
import { getPaginationParams } from '../../utils/helpers';
import { io } from '../../server';

export class AttendanceController {
  static async markAttendance(req: Request, res: Response) {
    try {
      const { log_id, student_id, subject, date, status } = req.body;
      const student = await UserModel.findOne({ user_id: student_id });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const log = await AttendanceLogModel.create({ log_id, student_id: student._id, subject, date, status });

      let percentageRecord = await AttendancePercentageModel.findOne({ student_id: student._id, subject });
      if (!percentageRecord) {
        percentageRecord = await AttendancePercentageModel.create({
          percentage_id: `PER-${Date.now()}`,
          student_id: student._id,
          subject,
          classes_attended: 0,
          total_classes: 0,
          attendance_percentage: 0,
        });
      }

      percentageRecord.total_classes += 1;
      if (status === 'Present') percentageRecord.classes_attended += 1;
      percentageRecord.attendance_percentage = (percentageRecord.classes_attended / percentageRecord.total_classes) * 100;
      await percentageRecord.save();

      io.emit('ATTENDANCE_MARKED', { log, percentageRecord });

      res.status(201).json({ message: 'Attendance marked successfully', log });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getClassAttendance(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const students = await UserModel.find({ class_id: req.params.classId, role: 'student' });
      const studentIds = students.map((s) => s._id);

      const totalRows = await AttendanceLogModel.countDocuments({ student_id: { $in: studentIds } });
      const logs = await AttendanceLogModel.find({ student_id: { $in: studentIds } }).skip(skip).limit(limit).populate('student_id');
      
      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getStudentAttendance(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      const percentages = await AttendancePercentageModel.find({ student_id: student?._id });
      res.status(200).json({ data: percentages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAdminStudentAttendance(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.params.studentId });
      const percentages = await AttendancePercentageModel.find({ student_id: student?._id });
      res.status(200).json({ data: percentages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateAttendance(req: Request, res: Response) {
    try {
      const updated = await AttendanceLogModel.findOneAndUpdate({ log_id: req.params.id }, { $set: req.body }, { new: true });

      io.emit('ATTENDANCE_UPDATED', updated);
      
      res.status(200).json({ message: 'Attendance updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}