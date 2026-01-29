// src/middleware/checkLevel.ts

import { Request, Response, NextFunction } from 'express';

export const checkLevel = (requiredLevel: number) => {
  return (req: any, res: Response, next: NextFunction) => {
    // req.user comes from your JWT auth middleware
    if (req.user && req.user.level >= requiredLevel) {
      return next();
    }
    return res.status(403).json({ 
      message: `Access denied. Requires level ${requiredLevel} or higher.` 
    });
  };
};

/*
  Usage:
  router.delete('/delete-user', checkLevel(5), userController.deleteUser); // Admin/Owner only
  router.post('/send-announcement', checkLevel(4), emailController.broadcast); // Mod/Admin/Owner
*/