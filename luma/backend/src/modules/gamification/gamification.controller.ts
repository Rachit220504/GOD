import { Request, Response, NextFunction } from 'express';
import { gamificationService } from './gamification.service';

export class GamificationController {
  /**
   * GET /api/gamification/progress
   * Get user's complete gamification status
   */
  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await gamificationService.getGamificationStats(userId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/achievements
   * Get user's achievements
   */
  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const achievements = await gamificationService.getUserAchievements(userId);
      res.status(200).json({ success: true, data: achievements });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/plant
   * Get user's plant progress only
   */
  async getPlantProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const plant = await gamificationService.getPlantProgress(userId);
      res.status(200).json({ success: true, data: plant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/claim/:milestoneId
   * Claim a reward milestone
   */
  async claimMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const milestoneId = String(req.params['milestoneId']);
      
      // This would be implemented to handle claiming rewards
      // For now, just return success
      res.status(200).json({ 
        success: true, 
        message: 'Reward claimed successfully!',
        data: { milestoneId }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/history
   * Get user's XP history
   */
  async getXPHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(String(req.query['limit'] ?? '20'), 10);
      const history = await gamificationService.getRecentXP(userId, limit);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

export const gamificationController = new GamificationController();
