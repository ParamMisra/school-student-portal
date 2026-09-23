import { Request, Response } from 'express';
import { MarkModel } from '../../models/Mark.model';
import { UserModel } from '../../models/User.model';
import { ClassModel } from '../../models/Class.model';
import { AttendancePercentageModel } from '../../models/AttendancePercentage.model';
import { TimeTableModel } from '../../models/TimeTable.model';

export class AnalyticsController {
  static async getSubjectAnalytics(req: Request, res: Response) {
    try {
      const { classId, subject } = req.params;
      const classObj = await ClassModel.findOne({ class_id: classId });
      const students = await UserModel.find({ class_id: classObj?._id, role: 'student' });
      const studentIds = students.map((s) => s._id);

      const marks = await MarkModel.find({ student_id: { $in: studentIds }, subject });
      if (marks.length === 0) return res.status(200).json({ subject, averageMarks: 0, totalStudents: students.length });

      const totalObtained = marks.reduce((acc, m) => acc + m.marks_obtained, 0);
      const averageMarks = totalObtained / marks.length;

      res.status(200).json({ subject, averageMarks, totalStudentsEvaluated: marks.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getGeneralDashboard(req: Request, res: Response) {
    res.status(200).json({ message: 'Welcome to School Management Dashboard API' });
  }

  static async getAdminDashboard(req: Request, res: Response) {
    try {
      const totalUsers = await UserModel.countDocuments();
      const totalClasses = await ClassModel.countDocuments();
      res.status(200).json({ role: 'admin', totalUsers, totalClasses });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Upgraded Teacher Dashboard
  static async getTeacherDashboard(req: Request, res: Response) {
    try {
      const teacher = await UserModel.findOne({ user_id: req.user?.userId });
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

      // Fetch classes taught or timetable slots assigned to this teacher
      const teachingSchedule = await TimeTableModel.find({ 
        $or: [{ teacher_id: teacher._id }, { substitute_id: teacher._id }] 
      }).populate('class_id');

      res.status(200).json({
        role: 'teacher',
        teacherName: teacher.name,
        assignedSchedulesCount: teachingSchedule.length,
        schedule: teachingSchedule,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Upgraded Student Dashboard (Returns Marks, CGPA, and Attendance summary)
  static async getStudentDashboard(req: Request, res: Response) {
    try {
      const student = await UserModel.findOne({ user_id: req.user?.userId });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      // Fetch student's marks
      const marks = await MarkModel.find({ student_id: student._id });
      
      // Calculate CGPA on the fly
      let cgpa = 0;
      if (marks.length > 0) {
        const totalPercentage = marks.reduce((acc, m) => acc + (m.marks_obtained / m.total_marks) * 100, 0);
        const avgPercentage = totalPercentage / marks.length;
        cgpa = Number((avgPercentage / 9.5).toFixed(2));
      }

      // Fetch attendance percentages per subject
      const attendance = await AttendancePercentageModel.find({ student_id: student._id });

      // Fetch class timetable
      const timetable = await TimeTableModel.find({ class_id: student.class_id }).populate('teacher_id');

      res.status(200).json({
        role: 'student',
        studentName: student.name,
        cgpa,
        marksSummary: marks,
        attendanceSummary: attendance,
        timetable,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}