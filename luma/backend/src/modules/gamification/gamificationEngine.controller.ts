import { Request, Response, NextFunction } from 'express';
import { gamificationEngine } from './gamificationEngine.service';
import { gamificationService } from './gamification.service';

export class GamificationEngineController {
  /**
   * GET /api/gamification/xp-breakdown/:sessionId
   * Get XP breakdown for a session
   */
  async getXPBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = String(req.params['sessionId']);
      
      const breakdown = await gamificationEngine.calculateSessionXP(userId, sessionId);
      
      res.status(200).json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/award-xp
   * Award XP for a completed session
   */
  async awardXP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { sessionId, source } = req.body;

      const result = await gamificationEngine.awardXPWithBreakdown(
        userId,
        sessionId,
        source || 'reading_session'
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.plantGrew
          ? `🌱 Your plant grew to ${result.newStage}! +${result.breakdown.totalXP} XP`
          : `✨ +${result.breakdown.totalXP} XP earned!`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/milestones
   * Get available unclaimed milestones
   */
  async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const milestones = await gamificationEngine.getAvailableMilestones(userId);

      res.status(200).json({
        success: true,
        data: milestones,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/claim/:milestoneId
   * Claim a milestone reward
   */
  async claimMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const milestoneId = String(req.params['milestoneId']);

      const result = await gamificationEngine.claimMilestone(userId, milestoneId);

      res.status(200).json({
        success: true,
        data: result.reward,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/themes
   * Get user's unlocked themes
   */
  async getThemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const themes = await gamificationEngine.getUserThemes(userId);

      res.status(200).json({
        success: true,
        data: themes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/full-state
   * Get complete gamification state in one call
   */
  async getFullState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const [stats, milestones, themes] = await Promise.all([
        gamificationService.getGamificationStats(userId),
        gamificationEngine.getAvailableMilestones(userId),
        gamificationEngine.getUserThemes(userId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          milestones,
          themes,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const gamificationEngineController = new GamificationEngineController();
