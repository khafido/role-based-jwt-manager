import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class for input validation failures
 */
export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details: any = null) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let err: any = { ...error };
  err.message = error.message;

  // Log error
  logger.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = 'Validation Error';
    const details = Object.values((error as any).errors).map((val: any) => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    
    err = new ValidationError(message, details);
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    const value = (error as any).keyValue[field];
    const message = `${field} '${value}' already exists`;
    err = new ConflictError(message);
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    err = new NotFoundError(message);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AuthenticationError(message);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new AuthenticationError(message);
  }

  // Zod validation error
  if (error.name === 'ZodError') {
    const details = (error as any).errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    err = new ValidationError('Validation failed', details);
  }

  // Determine if error is operational (trusted) or programming error
  const isOperational = err instanceof AppError && err.isOperational;

  // Send operational error to client
  if (isOperational) {
    const response: any = {
      success: false,
      message: err.message
    };

    // Include error code if available
    if (err instanceof AppError && err.statusCode) {
      response.code = getErrorCode(err.statusCode);
    }

    // Include validation details if available
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode || 500).json(response);
    return;
  }

  // Programming or unknown errors: don't leak error details
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Get error code based on status code
 */
function getErrorCode(statusCode: number): string {
  const errorCodes: { [key: number]: string } = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_SERVER_ERROR'
  };

  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Async error wrapper to catch async errors
 * Wraps async route handlers to automatically catch and forward errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};
