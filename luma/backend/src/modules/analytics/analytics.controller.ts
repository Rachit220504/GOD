import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const data = await analyticsService.getSummary(userId, req.user!.id, req.user!.role);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const data = await analyticsService.getSkills(userId, req.user!.id, req.user!.role);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const page = parseInt(String(req.query['page'] ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query['limit'] ?? '10'), 10) || 10;
      const data = await analyticsService.getHistory(userId, req.user!.id, req.user!.role, page, limit);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getTips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const data = await analyticsService.getReadingTips(userId, req.user!.id, req.user!.role);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export const analyticsController = new AnalyticsController();
