import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';

export class ProgressController {
  /**
   * POST /api/progress/session
   * Record a reading session for the authenticated user.
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await progressService.createSession(req.user!.id, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/:userId
   * Get full progress stats for a user (own or linked child).
   */
  async getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const from = req.query['from'] ? String(req.query['from']) : undefined;
      const to = req.query['to'] ? String(req.query['to']) : undefined;
      const page = parseInt(String(req.query['page'] ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query['limit'] ?? '10'), 10) || 10;

      const stats = await progressService.getUserProgress(
        userId,
        req.user!.id,
        req.user!.role,
        { from, to, page, limit },
      );
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
