import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Get user from database (excluding password)
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// For backward compatibility
export const authMiddleware = protect;