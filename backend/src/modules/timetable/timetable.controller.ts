import { Request, Response } from 'express';
import { TimeTableModel } from '../../models/TimeTable.model';
import { UserModel } from '../../models/User.model';
import { io } from '../../server';

export class TimeTableController {
  static async getTimetableByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const rawClassId = String(classId).trim();
      const cleanClassId = rawClassId.replace(/^class\s*/i, '').replace(/\.0$/, '').trim();

      const timetable = await TimeTableModel.find({
        class_id: { $regex: new RegExp(`^(${rawClassId}|${cleanClassId}|Class\\s*${cleanClassId})$`, 'i') }
      })
        .populate('teacher_id', 'user_id name email')
        .populate('substitute_id', 'user_id name email');

      res.status(200).json({ data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async upsertSlot(req: Request, res: Response) {
    try {
      const { class_id, school_id, day, period, subject, teacher_user_id, substitute_user_id } = req.body;

      const teacher = await UserModel.findOne({ user_id: teacher_user_id });
      if (!teacher) return res.status(404).json({ error: `Teacher with ID ${teacher_user_id} not found` });

      let subUserObj = null;
      if (substitute_user_id) {
        subUserObj = await UserModel.findOne({ user_id: substitute_user_id });
      }

      const timetable_id = `TT-${class_id}-${day}-P${period}`;

      const updatedSlot = await TimeTableModel.findOneAndUpdate(
        { class_id, day, period },
        {
          timetable_id,
          class_id,
          school_id: school_id || req.user?.schoolId || 'SCH001',
          teacher_id: teacher._id,
          substitute_id: subUserObj ? subUserObj._id : null,
          subject,
          day,
          period,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate('teacher_id substitute_id');

      io.emit('TIMETABLE_UPDATED', updatedSlot);

      res.status(200).json({ message: 'Timetable slot saved successfully', data: updatedSlot });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async assignSubstitute(req: Request, res: Response) {
    try {
      const { substitute_user_id, timetable_id } = req.body;
      const subUser = await UserModel.findOne({ user_id: substitute_user_id });
      if (!subUser) return res.status(404).json({ error: 'Substitute teacher not found' });

      const updated = await TimeTableModel.findOneAndUpdate(
        { timetable_id },
        { $set: { substitute_id: subUser._id } },
        { new: true }
      ).populate('teacher_id substitute_id');

      io.emit('SUBSTITUTE_ASSIGNED', updated);
      res.status(200).json({ message: 'Substitute assigned successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getTeacherTimetable(req: Request, res: Response) {
    try {
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      if (!teacher) return res.status(404).json({ error: 'Teacher account not found' });

      const timetable = await TimeTableModel.find({
        $or: [{ teacher_id: teacher._id }, { substitute_id: teacher._id }]
      })
      .populate('teacher_id', 'user_id name')
      .populate('substitute_id', 'user_id name');

      res.status(200).json({ data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getStudentTimetable(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      if (!student || !student.class_id) {
        return res.status(400).json({ error: 'Student is not assigned to any class ID' });
      }

      const rawClassId = String(student.class_id).trim();
      const cleanClassId = rawClassId.replace(/^class\s*/i, '').replace(/\.0$/, '').trim();
      const classRegex = new RegExp(`^(${rawClassId}|${cleanClassId}|Class\\s*${cleanClassId})$`, 'i');

      const query: any = { class_id: { $regex: classRegex } };

      if (student.school_id) {
        query.$or = [
          { school_id: { $regex: new RegExp(`^${student.school_id}$`, 'i') } },
          { school_id: { $exists: false } }
        ];
      }

      const timetable = await TimeTableModel.find(query)
        .populate('teacher_id', 'user_id name')
        .populate('substitute_id', 'user_id name');

      res.status(200).json({ class_id: student.class_id, data: timetable });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAllTeachers(req: Request, res: Response) {
    try {
      const { school_id, subject } = req.query; 
      const query: any = { role: { $regex: /^teacher$/i } };

      const targetSchool = (school_id as string) || req.user?.schoolId;
      if (targetSchool) {
        query.school_id = { $regex: new RegExp(`^${targetSchool}$`, 'i') }; 
      }

      if (subject) {
        query.subjects = subject; 
      }

      const teachers = await UserModel.find(query).select('user_id name email school_id subjects');
      res.status(200).json({ data: teachers });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}