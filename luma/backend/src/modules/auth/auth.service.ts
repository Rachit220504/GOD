import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  JwtPayload,
} from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const SALT_ROUNDS = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  role?: Role;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: Role;
    displayName: string;
    avatarUrl: string | null;
    readingLevel: string;
  };
  tokens: AuthTokens;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, role = Role.CHILD, displayName, age, gender } = input;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        gender: gender || null,
        profile: {
          create: {
            displayName,
            age: age ?? null,
            // Set defaults based on role
            fontSize: role === 'CHILD' ? 22 : 18,
            letterSpacing: role === 'CHILD' ? 0.12 : 0.08,
            lineHeight: 1.5,
            backgroundColor: '#FDFBF7',
            fontFamily: 'Lexend',
          },
        },
      },
      include: { profile: true },
    });

    const tokens = this.createTokens(user.id, user.email, user.role);

    logger.info(`New user registered: ${email} (${role})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile!.displayName,
        avatarUrl: user.profile!.avatarUrl,
        readingLevel: user.profile!.readingLevel,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.hash('dummy_prevent_timing_attack', SALT_ROUNDS);
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Please contact support.', 403);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const tokens = this.createTokens(user.id, user.email, user.role);

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName ?? email,
        avatarUrl: user.profile?.avatarUrl ?? null,
        readingLevel: user.profile?.readingLevel ?? 'BEGINNER',
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new AppError('JWT_REFRESH_SECRET not configured', 500);

    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, secret, {
        issuer: 'luma-api',
        audience: 'luma-client',
      }) as { sub: string };
    } catch {
      throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated.', 401);
    }

    return this.createTokens(user.id, user.email, user.role);
  }

  async getMe(userId: string): Promise<AuthResult['user']> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) throw new AppError('User not found.', 404);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.profile?.displayName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? null,
      readingLevel: user.profile?.readingLevel ?? 'BEGINNER',
    };
  }

  private createTokens(userId: string, email: string, role: string): AuthTokens {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    };
  }
}

export const authService = new AuthService();
