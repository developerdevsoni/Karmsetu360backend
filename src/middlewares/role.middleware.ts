import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Session context missing.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access Denied. Insufficient role permissions.', 403));
    }

    next();
  };
};

export const authorizePermission = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Session context missing.', 401));
    }

    // Super Admin has global bypass capability
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const requiredPermission = `${action}:${resource}`.toUpperCase();
    const userHasPermission = req.user.permissions.some(
      (p) => p.toUpperCase() === requiredPermission
    );

    if (!userHasPermission) {
      return next(new AppError(`Access Denied. Missing required permission: ${action} on ${resource}.`, 403));
    }

    next();
  };
};
