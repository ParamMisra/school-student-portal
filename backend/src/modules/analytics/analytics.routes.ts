import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();

router.get('/dashboard', authenticate, AnalyticsController.getGeneralDashboard);
router.get('/admin/dashboard', authenticate, authorizeRole([UserRole.ADMIN]), AnalyticsController.getAdminDashboard);
router.get('/teacher/dashboard', authenticate, authorizeRole([UserRole.TEACHER]), AnalyticsController.getTeacherDashboard);
router.get('/student/dashboard', authenticate, authorizeRole([UserRole.STUDENT]), AnalyticsController.getStudentDashboard);

router.get('/admin/analytics/class/:classId/subject/:subject', authenticate, authorizeRole([UserRole.ADMIN]), AnalyticsController.getSubjectAnalytics);
router.get('/teacher/analytics/class/:classId/subject/:subject', authenticate, authorizeRole([UserRole.TEACHER]), AnalyticsController.getSubjectAnalytics);

export default router;