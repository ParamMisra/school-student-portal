import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();

router.post('/teacher/attendance/mark', authenticate, authorizeRole([UserRole.TEACHER]), AttendanceController.markAttendance);
router.get('/teacher/attendance/:classId', authenticate, authorizeRole([UserRole.TEACHER]), AttendanceController.getClassAttendance);
router.put('/teacher/attendance/:id', authenticate, authorizeRole([UserRole.TEACHER]), AttendanceController.updateAttendance);

router.get('/student/attendance', authenticate, authorizeRole([UserRole.STUDENT]), AttendanceController.getStudentAttendance);

router.get('/admin/attendance/:studentId', authenticate, authorizeRole([UserRole.ADMIN]), AttendanceController.getAdminStudentAttendance);
router.get('/admin/attendance/:studentId/%', authenticate, authorizeRole([UserRole.ADMIN]), AttendanceController.getAdminStudentAttendance);

export default router;