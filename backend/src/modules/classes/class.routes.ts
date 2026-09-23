import { Router } from 'express';
import { ClassController } from './class.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';

const router = Router();
router.use(authenticate, authorizeRole([UserRole.ADMIN]));

router.get('/', ClassController.getClasses);
router.post('/', ClassController.createClass);
router.put('/:classId', ClassController.updateClass);
router.delete('/:classId', ClassController.deleteClass);
router.get('/:classId/students', ClassController.getClassStudents);

export default router;