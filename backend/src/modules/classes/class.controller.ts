import { Request, Response } from 'express';
import { ClassModel } from '../../models/Class.model';
import { UserModel } from '../../models/User.model';
import { SchoolModel } from '../../models/School.model';
import { getPaginationParams } from '../../utils/helpers';
import { io } from '../../server';

export class ClassController {
  static async getClasses(req: Request, res: Response) {
    try {
      const schoolId = req.query.school_id || req.user?.schoolId;
      const schoolQuery = schoolId ? { school_id: schoolId } : {};

      const createdClasses = await ClassModel.find(schoolQuery);

      const userClassIds = await UserModel.distinct('class_id', {
        ...schoolQuery,
        class_id: { $exists: true,$ne: '' },
      });

      const classMap = new Map<string, any>();

      const defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'];

      userClassIds.forEach((cId) => {
        classMap.set(cId, {
          class_id: cId,
          class_name: `Class ${cId}`,
          grade: cId,
          school_id: schoolId || 'SCH001',
          subjects: defaultSubjects,
        });
      });

      createdClasses.forEach((c) => {
        classMap.set(c.class_id, {
          ...c.toObject(),
          subjects: c.subjects && c.subjects.length > 0 ? c.subjects : defaultSubjects,
        });
      });

      const combinedClasses = Array.from(classMap.values());
      res.status(200).json({ data: combinedClasses });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getSchools(req: Request, res: Response) {
    try {
      // Upsert SCH001 and SCH002 so MongoDB always holds active school records
      await SchoolModel.findOneAndUpdate(
        { school_id: 'SCH001' },
        { school_id: 'SCH001', school_name: 'Apex Public School', location: 'Main Campus' },
        { upsert: true, new: true }
      );

      await SchoolModel.findOneAndUpdate(
        { school_id: 'SCH002' },
        { school_id: 'SCH002', school_name: 'Beacon International School', location: 'West Campus' },
        { upsert: true, new: true }
      );

      const schools = await SchoolModel.find();
      res.status(200).json({ data: schools });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createClass(req: Request, res: Response) {
    try {
      const { class_id, class_name, grade, school_id, subjects } = req.body;
      const targetSchoolId = school_id || req.user?.schoolId || 'SCH001';

      const existing = await ClassModel.findOne({ class_id });
      if (existing) return res.status(400).json({ error: `Class ID ${class_id} already exists` });

      const newClass = await ClassModel.create({
        class_id,
        class_name: class_name || `Class ${class_id}`,
        grade: grade || class_id,
        school_id: targetSchoolId,
        subjects: subjects || ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'],
      });

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
      const query = { class_id: req.params.classId, role: { $regex: /^student$/i } };
      const totalRows = await UserModel.countDocuments(query);
      const students = await UserModel.find(query).skip(skip).limit(limit).select('-password_hash');

      res.status(200).json({ page, limit, totalRows, totalPages: Math.ceil(totalRows / limit), data: students });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}