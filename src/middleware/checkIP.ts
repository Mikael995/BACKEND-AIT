import { Request, Response, NextFunction } from 'express';
import BannedIP from '../models/BannedIP';

export const checkIP = async (req: Request, res: Response, next: NextFunction) => {
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  const isBanned = await BannedIP.findOne({ ip: userIP });
  
  if (isBanned) {
    return res.status(403).json({ 
      message: "Your IP has been permanently banned from AIT for community violations." 
    });
  }
  
  next();
};