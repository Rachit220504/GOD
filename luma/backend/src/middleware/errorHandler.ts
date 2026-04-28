import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// ─── Custom Application Error ─────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Response Shape ─────────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    details?: unknown;
    stack?: string;
  };
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Operational errors (known, safe to expose)
  if (err instanceof AppError && err.isOperational) {
    const body: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
        details: err.details,
        ...(isDev && { stack: err.stack }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as Error & { code?: string; meta?: Record<string, unknown> };

    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'A record with this data already exists.',
          code: 409,
          details: prismaError.meta,
        },
      } satisfies ErrorResponse);
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { message: 'Record not found.', code: 404 },
      } satisfies ErrorResponse);
      return;
    }
  }

  // JWT errors handled in auth middleware, but catch here as fallback
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token.', code: 401 },
    } satisfies ErrorResponse);
    return;
  }

  // Unknown / programming errors — never leak internals in production
  logger.error('Unhandled Error:', { message: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : 'An internal server error occurred. Please try again.',
      code: 500,
      ...(isDev && { stack: err.stack }),
    },
  } satisfies ErrorResponse);
}

// ─── 404 Not Found Handler ────────────────────────────────────────────────────

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}
