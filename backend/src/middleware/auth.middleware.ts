import { Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/helpers';
import { UserRole } from '../constants/enums';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: any, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Access token missing or malformed' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Unauthorized access for this role' });
      return;
    }
    next();
  };
};