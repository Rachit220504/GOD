import { prisma, PlantStage, AchievementType, RewardType } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────

export interface XPBreakdown {
  baseXP: number;
  accuracyBonus: number;
  streakBonus: number;
  speedBonus: number;
  totalXP: number;
}

export interface MilestoneReward {
  milestoneId: string;
  type: 'plant_growth' | 'streak' | 'total_words' | 'achievement';
  name: string;
  description: string;
  rewardType: RewardType;
  rewardValue: any;
  isClaimed: boolean;
}

export interface GamificationTheme {
  id: string;
  name: string;
  type: 'plant' | 'pet';
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
}

// ─── XP Calculation Rules ───────────────────────────────────────────

const XP_RULES = {
  // Base XP per activity
  BASE: {
    READING_SESSION: 10,
    PHONICS_COMPLETE: 15,
    STORY_GENERATED: 5,
    DAILY_GOAL_COMPLETE: 20,
    STREAK_MAINTAINED: 5,
  },
  // Multipliers
  ACCURACY_BONUS: {
    threshold: 90,
    multiplier: 1.5,
  },
  SPEED_BONUS: {
    threshold: 80, // WPM
    multiplier: 1.3,
  },
  STREAK_MULTIPLIER: {
    3: 1.2,
    7: 1.5,
    14: 2.0,
    30: 2.5,
  },
};

// ─── Plant Growth Stages ─────────────────────────────────────────────

const PLANT_STAGES_CONFIG = {
  [PlantStage.SEED]: { xpRequired: 0, nextStage: PlantStage.SPROUT, name: 'Seed', emoji: '🌰' },
  [PlantStage.SPROUT]: { xpRequired: 50, nextStage: PlantStage.LEAVES, name: 'Sprout', emoji: '🌱' },
  [PlantStage.LEAVES]: { xpRequired: 150, nextStage: PlantStage.BUD, name: 'Leaves', emoji: '🌿' },
  [PlantStage.BUD]: { xpRequired: 350, nextStage: PlantStage.FLOWER, name: 'Bud', emoji: '🥀' },
  [PlantStage.FLOWER]: { xpRequired: 700, nextStage: PlantStage.BLOOM, name: 'Flower', emoji: '🌸' },
  [PlantStage.BLOOM]: { xpRequired: 1200, nextStage: PlantStage.RAINBOW, name: 'Bloom', emoji: '🌺' },
  [PlantStage.RAINBOW]: { xpRequired: 2000, nextStage: PlantStage.GOLDEN, name: 'Rainbow', emoji: '🌈' },
  [PlantStage.GOLDEN]: { xpRequired: 3500, nextStage: null, name: 'Golden', emoji: '✨' },
};

// ─── Gamification Engine Service ────────────────────────────────────

export class GamificationEngineService {
  /**
   * Calculate XP breakdown for a reading session using REAL data
   */
  async calculateSessionXP(
    userId: string,
    sessionId: string
  ): Promise<XPBreakdown> {
    const session = await prisma.sessionProgress.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Base XP from reading
    let baseXP = XP_RULES.BASE.READING_SESSION;

    // Bonus for words read (1 XP per 10 words, max 50)
    const wordsBonus = Math.min(50, Math.floor(session.wordsRead / 10));
    baseXP += wordsBonus;

    // Accuracy bonus
    let accuracyBonus = 0;
    if (session.accuracyPercent >= XP_RULES.ACCURACY_BONUS.threshold) {
      accuracyBonus = Math.floor(baseXP * (XP_RULES.ACCURACY_BONUS.multiplier - 1));
    }

    // Speed bonus (WPM)
    let speedBonus = 0;
    if (session.wordsPerMinute >= XP_RULES.SPEED_BONUS.threshold) {
      speedBonus = Math.floor(baseXP * (XP_RULES.SPEED_BONUS.multiplier - 1));
    }

    // Streak multiplier
    const streakDays = user?.profile?.currentStreak || 0;
    let streakMultiplier = 1.0;
    for (const [days, multiplier] of Object.entries(XP_RULES.STREAK_MULTIPLIER).reverse()) {
      if (streakDays >= parseInt(days)) {
        streakMultiplier = multiplier;
        break;
      }
    }

    const streakBonus = Math.floor((baseXP + accuracyBonus + speedBonus) * (streakMultiplier - 1));

    return {
      baseXP,
      accuracyBonus,
      streakBonus,
      speedBonus,
      totalXP: Math.round((baseXP + accuracyBonus + speedBonus + streakBonus) * streakMultiplier),
    };
  }

  /**
   * Award XP with full breakdown
   */
  async awardXPWithBreakdown(
    userId: string,
    sessionId: string,
    source: string
  ): Promise<{ breakdown: XPBreakdown; plantGrew: boolean; newStage?: PlantStage }> {
    const breakdown = await this.calculateSessionXP(userId, sessionId);

    // Record XP history with breakdown
    await prisma.xPHistory.create({
      data: {
        userId,
        xpEarned: breakdown.totalXP,
        source,
        sourceId: sessionId,
        multiplier: 1.0,
      },
    });

    // Update plant progress
    const plant = await this.getOrCreatePlantProgress(userId);
    const newTotalXP = plant.totalXP + breakdown.totalXP;
    const newStage = this.calculatePlantStage(newTotalXP);
    const plantGrew = newStage !== plant.currentStage;

    await prisma.plantProgress.update({
      where: { userId },
      data: {
        totalXP: newTotalXP,
        currentXP: plant.currentXP + breakdown.totalXP,
        currentStage: newStage,
        level: Math.floor(newTotalXP / 100) + 1,
        lastGrowthAt: plantGrew ? new Date() : plant.lastGrowthAt,
        wordsRead: { increment: breakdown.baseXP }, // Track words from this session
      },
    });

    // Check and unlock achievements
    await this.checkAndUnlockAchievements(userId, newTotalXP);

    // Create milestone if plant grew
    if (plantGrew) {
      await this.createMilestone(userId, 'plant_growth', newStage, {
        previousStage: plant.currentStage,
        xpEarned: breakdown.totalXP,
      });
    }

    return { breakdown, plantGrew, newStage: plantGrew ? newStage : undefined };
  }

  /**
   * Check and unlock achievements based on real user data
   */
  private async checkAndUnlockAchievements(userId: string, totalXP: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user?.profile) return;

    // Get all active achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
    });

    // Get user's unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));

    // Get real stats
    const totalSessions = await prisma.sessionProgress.count({ where: { userId } });
    const totalWords = await prisma.sessionProgress.aggregate({
      where: { userId },
      _sum: { wordsRead: true },
    });
    const bestSession = await prisma.sessionProgress.findFirst({
      where: { userId },
      orderBy: [{ accuracyPercent: 'desc' }, { wordsPerMinute: 'desc' }],
    });

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      // Check each condition type
      if (achievement.requiredXP && totalXP >= achievement.requiredXP) {
        shouldUnlock = true;
      }
      if (achievement.requiredStreak && user.profile.currentStreak >= achievement.requiredStreak) {
        shouldUnlock = true;
      }
      if (achievement.requiredBooks && totalSessions >= achievement.requiredBooks) {
        shouldUnlock = true;
      }
      if (achievement.requiredWPM && bestSession && bestSession.wordsPerMinute >= achievement.requiredWPM) {
        shouldUnlock = true;
      }
      if (achievement.requiredAccuracy && bestSession && bestSession.accuracyPercent >= achievement.requiredAccuracy) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Create milestone for achievement unlock
        await this.createMilestone(userId, 'achievement', achievement.id, {
          achievementName: achievement.name,
          rewardType: achievement.rewardType,
        });

        logger.info(`Achievement unlocked: ${achievement.name} for user ${userId}`);
      }
    }
  }

  /**
   * Get available milestones for claiming
   */
  async getAvailableMilestones(userId: string): Promise<MilestoneReward[]> {
    const milestones = await prisma.rewardMilestone.findMany({
      where: { userId, isClaimed: false },
      orderBy: { createdAt: 'desc' },
    });

    return milestones.map(m => ({
      milestoneId: m.id,
      type: m.milestoneType as any,
      name: this.getMilestoneName(m),
      description: this.getMilestoneDescription(m),
      rewardType: m.rewardType,
      rewardValue: m.rewardData,
      isClaimed: m.isClaimed,
    }));
  }

  /**
   * Claim a milestone reward
   */
  async claimMilestone(
    userId: string,
    milestoneId: string
  ): Promise<{ success: boolean; reward: any; message: string }> {
    const milestone = await prisma.rewardMilestone.findFirst({
      where: { id: milestoneId, userId, isClaimed: false },
    });

    if (!milestone) {
      throw new AppError('Milestone not found or already claimed', 404);
    }

    // Apply reward based on type
    const reward = await this.applyReward(userId, milestone.rewardType, milestone.rewardData);

    // Mark as claimed
    await prisma.rewardMilestone.update({
      where: { id: milestoneId },
      data: { isClaimed: true, claimedAt: new Date() },
    });

    return {
      success: true,
      reward,
      message: `Reward claimed successfully!`,
    };
  }

  /**
   * Apply reward to user
   */
  private async applyReward(
    userId: string,
    rewardType: RewardType,
    rewardData: any
  ): Promise<any> {
    switch (rewardType) {
      case RewardType.PLANT_VARIANT:
        await prisma.plantProgress.update({
          where: { userId },
          data: { plantVariant: rewardData.variant },
        });
        return { type: 'plant_variant', variant: rewardData.variant };

      case RewardType.CUSTOMIZATION:
        const plant = await prisma.plantProgress.findUnique({ where: { userId } });
        if (plant) {
          const newDecorations = [...plant.decorations, rewardData.decoration];
          await prisma.plantProgress.update({
            where: { userId },
            data: { decorations: newDecorations },
          });
        }
        return { type: 'decoration', decoration: rewardData.decoration };

      case RewardType.BADGE:
      case RewardType.TITLE:
        return { type: rewardType.toLowerCase(), value: rewardData };

      default:
        return { type: 'unknown', value: rewardData };
    }
  }

  /**
   * Create a milestone record
   */
  private async createMilestone(
    userId: string,
    type: string,
    value: string,
    data: any
  ): Promise<void> {
    await prisma.rewardMilestone.create({
      data: {
        userId,
        milestoneType: type,
        milestoneValue: 0,
        rewardType: RewardType.CUSTOMIZATION,
        rewardData: data,
        isClaimed: false,
      },
    });
  }

  /**
   * Calculate plant stage based on total XP
   */
  private calculatePlantStage(totalXP: number): PlantStage {
    for (const [stage, config] of Object.entries(PLANT_STAGES_CONFIG)) {
      if (totalXP < config.xpRequired) {
        return stage as PlantStage;
      }
    }
    return PlantStage.GOLDEN;
  }

  /**
   * Get or create plant progress
   */
  private async getOrCreatePlantProgress(userId: string) {
    let plant = await prisma.plantProgress.findUnique({ where: { userId } });

    if (!plant) {
      plant = await prisma.plantProgress.create({
        data: {
          userId,
          currentStage: PlantStage.SEED,
          currentXP: 0,
          totalXP: 0,
          level: 1,
          decorations: [],
        },
      });
    }

    return plant;
  }

  /**
   * Get milestone display name
   */
  private getMilestoneName(milestone: any): string {
    switch (milestone.milestoneType) {
      case 'plant_growth':
        return 'Plant Growth!';
      case 'streak':
        return 'Streak Milestone!';
      case 'achievement':
        return 'Achievement Unlocked!';
      default:
        return 'Milestone Reached!';
    }
  }

  /**
   * Get milestone description
   */
  private getMilestoneDescription(milestone: any): string {
    const data = milestone.rewardData as any;
    switch (milestone.milestoneType) {
      case 'plant_growth':
        return `Your plant grew from ${data?.previousStage || 'before'} to a new stage!`;
      case 'achievement':
        return `You unlocked: ${data?.achievementName || 'a new achievement'}!`;
      default:
        return 'You reached a new milestone!';
    }
  }

  /**
   * Get user's unlocked themes
   */
  async getUserThemes(userId: string): Promise<GamificationTheme[]> {
    const plant = await prisma.plantProgress.findUnique({ where: { userId } });

    // Fruit Tree theme is always unlocked
    const themes: GamificationTheme[] = [{
      id: 'tree',
      name: 'Fruit Tree',
      type: 'plant',
      isUnlocked: true,
      progress: this.calculateThemeProgress('tree', plant?.totalXP || 0),
    }];

    // Pet theme unlocks after level 3
    const petUnlocked = (plant?.level || 0) >= 3;
    themes.push({
      id: 'pet',
      name: 'Reading Pet',
      type: 'pet',
      isUnlocked: petUnlocked,
      progress: this.calculateThemeProgress('pet', plant?.totalXP || 0),
    });

    return themes;
  }

  /**
   * Calculate progress toward theme unlocks
   */
  private calculateThemeProgress(themeId: string, totalXP: number): number {
    switch (themeId) {
      case 'tree':
        return Math.min(100, (totalXP / 100) * 100);
      case 'pet':
        return Math.min(100, (totalXP / 300) * 100);
      default:
        return 0;
    }
  }
}

export const gamificationEngine = new GamificationEngineService();
