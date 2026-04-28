import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware that reads express-validator results and throws an AppError
 * with field-level details if any validation failed.
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg as string,
    }));

    return next(
      new AppError('Validation failed. Please check the provided data.', 422, details),
    );
  }

  next();
}
