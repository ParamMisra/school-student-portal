import { Router, Request, Response, NextFunction } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorizeRole } from '../../middleware/auth.middleware';
import { UserRole } from '../../constants/enums';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

// Secure all admin routes
router.use(authenticate, authorizeRole([UserRole.ADMIN]));

router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserById);
router.put('/users/:userId', AdminController.updateUser);
router.delete('/users/:userId', AdminController.deleteUser);

router.post(
  '/bulk-upload',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('❌ Multer Error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  AdminController.bulkUpload
);

export default router;