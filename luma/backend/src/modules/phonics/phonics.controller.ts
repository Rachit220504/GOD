import { Request, Response, NextFunction } from 'express';
import { phonicsService } from './phonics.service';

export class PhonicsController {
  /**
   * GET /api/phonics/lessons
   * Get all phonics lessons.
   */
  async getLessons(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessons = await phonicsService.getAllLessons();
      res.status(200).json({ success: true, data: lessons });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/phonics/my-progress
   * Get current user's phonics progress.
   */
  async getMyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await phonicsService.getUserProgress(req.user!.id);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/phonics/practice
   * Record a phonics practice attempt.
   */
  async recordPractice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lessonId, correct } = req.body;
      const result = await phonicsService.recordPractice(req.user!.id, lessonId, correct === true);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/phonics/seed (admin only - for initial setup)
   * Seed default phonics lessons.
   */
  async seedLessons(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await phonicsService.seedLessons();
      res.status(200).json({ success: true, message: 'Phonics lessons seeded successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const phonicsController = new PhonicsController();
