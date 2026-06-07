import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message} | Path: ${req.path} | Method: ${req.method} | Stack: ${err.stack}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || (err.errors && Array.isArray(err.errors))) {
    statusCode = 400;
    message = 'Request validation failed';
    details = err.errors;
  }

  // Handle Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      message = 'Duplicate field value entered. A record with this unique constraint already exists.';
      details = { target: err.meta?.target };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested database record not found.';
    } else {
      message = `Database transaction error: ${err.code}`;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  });
};
