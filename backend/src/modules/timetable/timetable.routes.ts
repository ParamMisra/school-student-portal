import { Router } from 'express';
import { TimeTableController } from './timetable.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();
router.use(authenticate);

// Resolves to: GET /api/timetable/class/:classId
router.get('/class/:classId', TimeTableController.getTimetableByClass);

// Resolves to: POST /api/timetable/admin/slot
router.post('/admin/slot', authorizeRole([UserRole.ADMIN]), TimeTableController.upsertSlot);

// Resolves to: POST /api/timetable/admin/substitute
router.post('/admin/substitute', authorizeRole([UserRole.ADMIN]), TimeTableController.assignSubstitute);

// Resolves to: GET /api/timetable/admin/teachers-list
router.get('/admin/teachers-list', authorizeRole([UserRole.ADMIN]), TimeTableController.getAllTeachers);

// Resolves to: GET /api/timetable/teacher/my-timetable
router.get('/teacher/my-timetable', authorizeRole([UserRole.TEACHER]), TimeTableController.getTeacherTimetable);

// Resolves to: GET /api/timetable/student/my-timetable
router.get('/student/my-timetable', authorizeRole([UserRole.STUDENT]), TimeTableController.getStudentTimetable);

export default router;