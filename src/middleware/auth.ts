// src/middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include user data
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    level: number;
  };
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided. Authorization denied." });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      id: decodedData.id,
      email: decodedData.email,
      level: decodedData.level
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token is invalid or expired." });
  }
};

export default auth;