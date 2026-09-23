import { Router } from 'express';
import { TimeTableController } from './timetable.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();

router.get('/admin/timetable', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.getAdminTimetable);
router.post('/admin/timetable', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.createTimetable);
router.put('/admin/timetable/:id', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.updateTimetable);
router.delete('/admin/timetable/:id', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.deleteTimetable);

router.post('/admin/substitute', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.assignSubstitute);
router.put('/admin/substitute/:id', authenticate, authorizeRole([UserRole.ADMIN]), TimeTableController.assignSubstitute);

router.get('/teacher/timetable', authenticate, authorizeRole([UserRole.TEACHER]), TimeTableController.getTeacherTimetable);
router.get('/teacher/substitutes', authenticate, authorizeRole([UserRole.TEACHER]), TimeTableController.getTeacherSubstitutes);
router.get('/student/timetable', authenticate, authorizeRole([UserRole.STUDENT]), TimeTableController.getStudentTimetable);

export default router;