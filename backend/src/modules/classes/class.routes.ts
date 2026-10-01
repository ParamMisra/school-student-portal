import { Router } from 'express';
import { ClassController } from './class.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();
router.use(authenticate);

router.get('/schools', ClassController.getSchools);
router.get('/', ClassController.getClasses);
router.post('/', authorizeRole([UserRole.ADMIN]), ClassController.createClass);
router.put('/:classId', authorizeRole([UserRole.ADMIN]), ClassController.updateClass);
router.delete('/:classId', authorizeRole([UserRole.ADMIN]), ClassController.deleteClass);
router.get('/:classId/students', ClassController.getClassStudents);

export default router;