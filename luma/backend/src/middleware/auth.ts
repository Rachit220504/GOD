import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { logger } from '../config/logger';

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// ─── Token Generation ─────────────────────────────────────────────────────────

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    issuer: 'luma-api',
    audience: 'luma-client',
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');

  return jwt.sign({ sub: userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    issuer: 'luma-api',
    audience: 'luma-client',
  } as jwt.SignOptions);
}

// ─── Verify Token ─────────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.verify(token, secret, {
    issuer: 'luma-api',
    audience: 'luma-client',
  }) as JwtPayload;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Malformed authorization header', 401);
    }

    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError('Access token has expired. Please refresh your token.', 401);
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid access token.', 401);
      }
      throw jwtError;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User account not found or has been deactivated.', 401);
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

// ─── Role Guard ───────────────────────────────────────────────────────────────

export function requireRole(...roles: string[]) {
  return (req: Request, __res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Role guard: user ${req.user.id} (${req.user.role}) tried to access route requiring [${roles.join(', ')}]`);
      return next(
        new AppError(
          `Access denied. This route requires one of: [${roles.join(', ')}]`,
          403,
        ),
      );
    }

    next();
  };
}
