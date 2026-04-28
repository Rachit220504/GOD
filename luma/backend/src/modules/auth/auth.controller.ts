import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await authService.refreshTokens(refreshToken);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  logout(_req: Request, res: Response): void {
    // Client-side token invalidation — instruct client to discard tokens
    // For stateless JWT, server-side blacklisting would need Redis (Phase 2 enhancement)
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please discard your tokens on the client.',
    });
  }
}

export const authController = new AuthController();
