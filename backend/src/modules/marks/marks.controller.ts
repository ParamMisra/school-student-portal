import { Request, Response } from 'express';
import { MarkModel } from '../../models/Mark.model';
import { UserModel } from '../../models/User.model';
import { getPaginationParams } from '../../utils/helpers';
import { io } from '../../server';

export class MarksController {
  static async addMark(req: Request, res: Response) {
    try {
      const { mark_id, student_id, subject, marks_obtained, total_marks, date } = req.body;
      const student = await UserModel.findOne({ user_id: student_id });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const mark = await MarkModel.create({ mark_id, student_id: student._id, subject, marks_obtained, total_marks, date });

      io.emit('MARK_ADDED', mark);
      res.status(201).json({ message: 'Marks added successfully', data: mark });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getStudentsForTeacher(req: Request, res: Response) {
    try {
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      const schoolId = teacher?.school_id || req.user?.schoolId; 

      const query: any = { role: { $regex: /^student$/i } };
      if (schoolId) {
        query.school_id = schoolId;
      }

      const students = await UserModel.find(query).select('user_id name class_id email school_id');
      res.status(200).json({ data: students });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getClassMarks(req: Request, res: Response) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      const schoolQuery = teacher?.school_id ? { school_id: teacher.school_id } : {};

      const students = await UserModel.find({ role: { $regex: /^student$/i }, ...schoolQuery });
      const studentIds = students.map((s) => s._id);

      const totalRows = await MarkModel.countDocuments({ student_id: { $in: studentIds } });
      const marks = await MarkModel.find({ student_id: { $in: studentIds } })
        .skip(skip)
        .limit(limit)
        .populate('student_id', 'user_id name class_id school_id');

      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: marks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getStudentMarks(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      if (!student) return res.status(404).json({ error: 'Student user not found' });
      const marks = await MarkModel.find({ student_id: student._id });
      res.status(200).json({ data: marks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async calculateCGPA(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      if (!student) return res.status(200).json({ cgpa: 0 });
      const marks = await MarkModel.find({ student_id: student._id });
      if (marks.length === 0) return res.status(200).json({ cgpa: 0 });

      let totalPercentage = 0;
      marks.forEach((m) => {
        totalPercentage += (m.marks_obtained / m.total_marks) * 100;
      });

      const averagePercentage = totalPercentage / marks.length;
      const cgpa = Number((averagePercentage / 9.5).toFixed(2));

      res.status(200).json({ cgpa, averagePercentage });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAdminStudentMarks(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.params.studentId });
      const marks = await MarkModel.find({ student_id: student?._id });
      res.status(200).json({ data: marks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateMark(req: Request, res: Response) {
    try {
      const updated = await MarkModel.findOneAndUpdate({ mark_id: req.params.id }, { $set: req.body }, { new: true });
      io.emit('MARK_UPDATED', updated);
      res.status(200).json({ message: 'Mark updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteMark(req: Request, res: Response) {
    try {
      await MarkModel.findOneAndDelete({ mark_id: req.params.id });
      io.emit('MARK_DELETED', { mark_id: req.params.id });
      res.status(200).json({ message: 'Mark deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}