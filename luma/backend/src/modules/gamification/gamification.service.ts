import { prisma, PlantStage, AchievementType, RewardType } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────

export interface PlantProgressResponse {
  id: string;
  currentStage: PlantStage;
  currentXP: number;
  totalXP: number;
  level: number;
  plantVariant?: string;
  decorations: string[];
  wordsRead: number;
  sessionsCompleted: number;
  lastGrowthAt?: Date;
  progressToNext: number; // 0-100 percentage to next stage
  nextStage: PlantStage;
}

export interface AchievementResponse {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  rewardType: RewardType;
  rewardValue: any;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress?: number; // For multi-step achievements
}

export interface XPHistoryEntry {
  id: string;
  xpEarned: number;
  source: string;
  sourceId?: string;
  multiplier: number;
  createdAt: Date;
}

export interface DailyGoalResponse {
  id: string;
  date: Date;
  targetMinutes: number;
  targetWords: number;
  minutesRead: number;
  wordsRead: number;
  sessionsCompleted: number;
  isCompleted: boolean;
  progressPercent: number;
}

export interface GamificationStats {
  plant: PlantProgressResponse;
  achievements: AchievementResponse[];
  dailyGoal: DailyGoalResponse | null;
  recentXP: XPHistoryEntry[];
  totalUnlocked: number;
  nextMilestone: {
    type: string;
    value: number;
    reward: string;
    progress: number;
  } | null;
}

// ─── Plant Growth Configuration ─────────────────────────────────────

const PLANT_STAGES = {
  [PlantStage.SEED]: { xpRequired: 0, nextStage: PlantStage.SPROUT },
  [PlantStage.SPROUT]: { xpRequired: 100, nextStage: PlantStage.LEAVES },
  [PlantStage.LEAVES]: { xpRequired: 300, nextStage: PlantStage.BUD },
  [PlantStage.BUD]: { xpRequired: 600, nextStage: PlantStage.FLOWER },
  [PlantStage.FLOWER]: { xpRequired: 1200, nextStage: PlantStage.BLOOM },
  [PlantStage.BLOOM]: { xpRequired: 2500, nextStage: PlantStage.RAINBOW },
  [PlantStage.RAINBOW]: { xpRequired: 5000, nextStage: PlantStage.GOLDEN },
  [PlantStage.GOLDEN]: { xpRequired: 10000, nextStage: null },
} as const;

// ─── Achievement Definitions ───────────────────────────────────────

const DEFAULT_ACHIEVEMENTS = [
  {
    type: AchievementType.FIRST_STORY,
    name: 'First Chapter',
    description: 'Complete your first reading session',
    icon: '📖',
    rarity: 'common',
    requiredXP: 0,
    requiredBooks: 1,
    rewardType: RewardType.BADGE,
    rewardValue: { badge: 'first_reader' },
  },
  {
    type: AchievementType.STREAK_WARRIOR,
    name: 'Streak Warrior',
    description: 'Maintain a 7-day reading streak',
    icon: '🔥',
    rarity: 'rare',
    requiredStreak: 7,
    rewardType: RewardType.PLANT_VARIANT,
    rewardValue: { variant: 'rainbow' },
  },
  {
    type: AchievementType.SPEED_READER,
    name: 'Speed Reader',
    description: 'Read 100+ words per minute in a session',
    icon: '⚡',
    rarity: 'epic',
    requiredWPM: 100,
    rewardType: RewardType.TITLE,
    rewardValue: { title: 'Speed Reader' },
  },
  {
    type: AchievementType.ACCURACY_MASTER,
    name: 'Accuracy Master',
    description: 'Achieve 95%+ accuracy in a session',
    icon: '🎯',
    rarity: 'epic',
    requiredAccuracy: 95,
    rewardType: RewardType.CUSTOMIZATION,
    rewardValue: { decoration: 'star' },
  },
  {
    type: AchievementType.BOOK_WORM,
    name: 'Book Worm',
    description: 'Complete 10 books',
    icon: '🐛',
    rarity: 'rare',
    requiredBooks: 10,
    rewardType: RewardType.BADGE,
    rewardValue: { badge: 'book_worm' },
  },
  {
    type: AchievementType.PHONICS_EXPERT,
    name: 'Phonics Expert',
    description: 'Complete all phonics lessons',
    icon: '🔤',
    rarity: 'legendary',
    rewardType: RewardType.PLANT_VARIANT,
    rewardValue: { variant: 'golden' },
  },
  {
    type: AchievementType.CREATIVITY_BONUS,
    name: 'Creative Mind',
    description: 'Generate 5 AI stories',
    icon: '✨',
    rarity: 'rare',
    rewardType: RewardType.CUSTOMIZATION,
    rewardValue: { decoration: 'sparkle' },
  },
  {
    type: AchievementType.CONSISTENCY_HERO,
    name: 'Consistency Hero',
    description: 'Read for 30 days in a month',
    icon: '📅',
    rarity: 'epic',
    rewardType: RewardType.TITLE,
    rewardValue: { title: 'Dedicated Reader' },
  },
];

// ─── Gamification Service ───────────────────────────────────────────

export class GamificationService {
  /**
   * Initialize gamification for a new user
   */
  async initializeUserProgress(userId: string): Promise<void> {
    try {
      const existing = await prisma.plantProgress.findUnique({
        where: { userId },
      });

      if (!existing) {
        await prisma.plantProgress.create({
          data: {
            userId,
            currentStage: PlantStage.SEED,
            currentXP: 0,
            totalXP: 0,
            level: 1,
            decorations: [],
          },
        });
        logger.info(`Initialized plant progress for user: ${userId}`);
      }

      // Seed default achievements
      await this.seedAchievements();
    } catch (error) {
      logger.error('Failed to initialize user progress:', error);
      throw new AppError('Failed to initialize gamification', 500);
    }
  }

  /**
   * Award XP for various activities
   */
  async awardXP(
    userId: string,
    xpEarned: number,
    source: string,
    sourceId?: string,
    multiplier: number = 1.0,
  ): Promise<void> {
    try {
      const finalXP = Math.round(xpEarned * multiplier);
      
      // Record XP history
      await prisma.xPHistory.create({
        data: {
          userId,
          xpEarned: finalXP,
          source,
          sourceId,
          multiplier,
        },
      });

      // Update plant progress
      const plant = await this.getOrCreatePlantProgress(userId);
      const newTotalXP = plant.totalXP + finalXP;
      const newStage = this.calculatePlantStage(newTotalXP);
      const leveledUp = newStage !== plant.currentStage;

      await prisma.plantProgress.update({
        where: { userId },
        data: {
          totalXP: newTotalXP,
          currentXP: plant.currentXP + finalXP,
          currentStage: newStage,
          level: Math.floor(newTotalXP / 100) + 1,
          lastGrowthAt: leveledUp ? new Date() : plant.lastGrowthAt,
        },
      });

      if (leveledUp) {
        await this.checkAchievements(userId, newTotalXP);
        logger.info(`User ${userId} plant grew to ${newStage}!`);
      }

      // Update daily goals
      await this.updateDailyGoals(userId, {
        wordsRead: source === 'reading_session' ? 50 : 0, // Estimate words read
        minutesRead: source === 'reading_session' ? 15 : 0, // Estimate time
        sessionsCompleted: source === 'reading_session' ? 1 : 0,
      });

    } catch (error) {
      logger.error('Failed to award XP:', error);
      throw new AppError('Failed to award XP', 500);
    }
  }

  /**
   * Get user's complete gamification status
   */
  async getGamificationStats(userId: string): Promise<GamificationStats> {
    try {
      const [plant, achievements, dailyGoal, recentXP, unlockedCount] = await Promise.all([
        this.getPlantProgress(userId),
        this.getUserAchievements(userId),
        this.getTodayDailyGoal(userId),
        this.getRecentXP(userId, 10),
        prisma.userAchievement.count({ where: { userId } }),
      ]);

      const nextMilestone = this.calculateNextMilestone(plant);

      return {
        plant,
        achievements,
        dailyGoal,
        recentXP,
        totalUnlocked: unlockedCount,
        nextMilestone,
      };
    } catch (error) {
      logger.error('Failed to get gamification stats:', error);
      throw new AppError('Failed to load gamification data', 500);
    }
  }

  /**
   * Get user's plant progress with stage calculations
   */
  async getPlantProgress(userId: string): Promise<PlantProgressResponse> {
    const plant = await this.getOrCreatePlantProgress(userId);
    
    const currentStageConfig = PLANT_STAGES[plant.currentStage];
    const nextStageConfig = currentStageConfig.nextStage ? PLANT_STAGES[currentStageConfig.nextStage] : null;
    
    let progressToNext = 100;
    if (nextStageConfig) {
      const stageStartXP = currentStageConfig.xpRequired;
      const nextStageXP = nextStageConfig.xpRequired;
      const progressInStage = plant.currentXP - stageStartXP;
      const stageRange = nextStageXP - stageStartXP;
      progressToNext = Math.min(100, Math.max(0, (progressInStage / stageRange) * 100));
    }

    return {
      id: plant.id,
      currentStage: plant.currentStage,
      currentXP: plant.currentXP,
      totalXP: plant.totalXP,
      level: plant.level,
      plantVariant: plant.plantVariant,
      decorations: plant.decorations,
      wordsRead: plant.wordsRead,
      sessionsCompleted: plant.sessionsCompleted,
      lastGrowthAt: plant.lastGrowthAt,
      progressToNext,
      nextStage: nextStageConfig?.nextStage || plant.currentStage,
    };
  }

  /**
   * Get user's achievements with unlock status
   */
  async getUserAchievements(userId: string): Promise<AchievementResponse[]> {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
    });

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
    );

    return achievements.map(achievement => ({
      id: achievement.id,
      type: achievement.type,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      rewardType: achievement.rewardType,
      rewardValue: achievement.rewardValue,
      isUnlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id),
    }));
  }

  /**
   * Check and unlock achievements based on user progress
   */
  async checkAchievements(userId: string, totalXP: number): Promise<void> {
    const userStats = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userStats?.profile) return;

    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      // Skip if already unlocked
      const alreadyUnlocked = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
      });

      if (alreadyUnlocked) continue;

      // Check achievement conditions
      let shouldUnlock = false;

      if (achievement.requiredXP && totalXP >= achievement.requiredXP) {
        shouldUnlock = true;
      }
      if (achievement.requiredStreak && userStats.profile.currentStreak >= achievement.requiredStreak) {
        shouldUnlock = true;
      }
      if (achievement.requiredBooks && userStats.profile.booksCompleted >= achievement.requiredBooks) {
        shouldUnlock = true;
      }

      // Check session-based achievements
      const recentSession = await prisma.sessionProgress.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
      });

      if (achievement.requiredWPM && recentSession && recentSession.wordsPerMinute >= achievement.requiredWPM) {
        shouldUnlock = true;
      }
      if (achievement.requiredAccuracy && recentSession && recentSession.accuracyPercent >= achievement.requiredAccuracy) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        logger.info(`User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }
  }

  /**
   * Calculate plant stage based on total XP
   */
  private calculatePlantStage(totalXP: number): PlantStage {
    for (const [stage, config] of Object.entries(PLANT_STAGES)) {
      if (totalXP < config.xpRequired) {
        return stage as PlantStage;
      }
    }
    return PlantStage.GOLDEN;
  }

  /**
   * Get or create plant progress for user
   */
  private async getOrCreatePlantProgress(userId: string) {
    let plant = await prisma.plantProgress.findUnique({
      where: { userId },
    });

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
   * Seed default achievements
   */
  private async seedAchievements(): Promise<void> {
    const existingCount = await prisma.achievement.count();
    if (existingCount > 0) return;

    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      await prisma.achievement.create({ data: achievement });
    }

    logger.info(`Seeded ${DEFAULT_ACHIEVEMENTS.length} default achievements`);
  }

  /**
   * Get today's daily goal for user
   */
  private async getTodayDailyGoal(userId: string): Promise<DailyGoalResponse | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goal = await prisma.dailyGoal.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!goal) return null;

    const progressPercent = Math.min(100, Math.max(0, (goal.wordsRead / goal.targetWords) * 100));

    return {
      id: goal.id,
      date: goal.date,
      targetMinutes: goal.targetMinutes,
      targetWords: goal.targetWords,
      minutesRead: goal.minutesRead,
      wordsRead: goal.wordsRead,
      sessionsCompleted: goal.sessionsCompleted,
      isCompleted: goal.isCompleted,
      progressPercent,
    };
  }

  /**
   * Update daily goals with new progress
   */
  private async updateDailyGoals(
    userId: string,
    progress: { wordsRead?: number; minutesRead?: number; sessionsCompleted?: number }
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goal = await prisma.dailyGoal.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      update: {
        minutesRead: { increment: progress.minutesRead || 0 },
        wordsRead: { increment: progress.wordsRead || 0 },
        sessionsCompleted: { increment: progress.sessionsCompleted || 0 },
        isCompleted: true, // Will be updated by a separate process
      },
      create: {
        userId,
        date: today,
        targetMinutes: 15,
        targetWords: 100,
        minutesRead: progress.minutesRead || 0,
        wordsRead: progress.wordsRead || 0,
        sessionsCompleted: progress.sessionsCompleted || 0,
        isCompleted: false,
      },
    });
  }

  /**
   * Get recent XP history
   */
  async getRecentXP(userId: string, limit: number): Promise<XPHistoryEntry[]> {
    const history = await prisma.xPHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history.map(entry => ({
      id: entry.id,
      xpEarned: entry.xpEarned,
      source: entry.source,
      sourceId: entry.sourceId,
      multiplier: entry.multiplier,
      createdAt: entry.createdAt,
    }));
  }

  /**
   * Calculate next milestone for user
   */
  private calculateNextMilestone(plant: any): any {
    const currentStageConfig = PLANT_STAGES[plant.currentStage];
    if (!currentStageConfig.nextStage) return null;

    const nextStageConfig = PLANT_STAGES[currentStageConfig.nextStage];
    const progressInStage = plant.currentXP - currentStageConfig.xpRequired;
    const stageRange = nextStageConfig.xpRequired - currentStageConfig.xpRequired;

    return {
      type: 'plant_growth',
      value: nextStageConfig.xpRequired,
      reward: `Reach ${currentStageConfig.nextStage} stage`,
      progress: Math.min(100, (progressInStage / stageRange) * 100),
    };
  }
}

export const gamificationService = new GamificationService();
