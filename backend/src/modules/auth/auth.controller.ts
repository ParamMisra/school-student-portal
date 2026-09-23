import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserRole } from '../../constants/enums';

export class AuthController {
  static async loginAdmin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, UserRole.ADMIN);
      res.status(200).json({ message: 'Admin login successful', ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async registerAdmin(req: Request, res: Response) {
    try {
      const result = await AuthService.registerAdmin(req.body);
      res.status(201).json({ message: 'Admin registered successfully', ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
  
  static async loginTeacher(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, UserRole.TEACHER);
      res.status(200).json({ message: 'Teacher login successful', ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async loginStudent(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, UserRole.STUDENT);
      res.status(200).json({ message: 'Student login successful', ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const { newPassword } = req.body;
      const userId = (req as any).user.userId; // Retrieved from authenticate middleware
      
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      const result = await AuthService.changePassword(userId, newPassword);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async logout(req: Request, res: Response) {
    res.status(200).json({ message: 'Logged out successfully' });
  }

  static async verify(req: Request, res: Response) {
    res.status(200).json({ message: 'Token is valid', user: req.user });
  }
}