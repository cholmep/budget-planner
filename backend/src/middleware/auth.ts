import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user: IUser;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    
    // Add user to request
    (req as AuthRequest).user = { _id: decoded.userId } as IUser;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};