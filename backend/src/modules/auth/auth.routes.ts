import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login-admin', AuthController.loginAdmin);
router.post('/register', AuthController.registerAdmin);
router.post('/login-teacher', AuthController.loginTeacher);
router.post('/login-student', AuthController.loginStudent);
router.post('/request-reset-otp', AuthController.requestPasswordReset);
router.post('/reset-password-otp', AuthController.resetPasswordWithOTP);
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);
router.get('/verify', authenticate, AuthController.verify);

export default router;