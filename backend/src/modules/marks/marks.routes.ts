import { Router } from 'express';
import { MarksController } from './marks.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();

router.post('/teacher/marks/add', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.addMark);
router.get('/teacher/students', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.getStudentsForTeacher);
router.get('/teacher/marks-list', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.getClassMarks);
router.get('/teacher/marks/:classId', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.getClassMarks);
router.put('/teacher/marks/:id', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.updateMark);
router.delete('/teacher/marks/:id', authenticate, authorizeRole([UserRole.TEACHER]), MarksController.deleteMark);

router.get('/student/marks', authenticate, authorizeRole([UserRole.STUDENT]), MarksController.getStudentMarks);
router.get('/student/cgpa', authenticate, authorizeRole([UserRole.STUDENT]), MarksController.calculateCGPA);

router.get('/admin/marks/:studentId', authenticate, authorizeRole([UserRole.ADMIN]), MarksController.getAdminStudentMarks);

export default router;