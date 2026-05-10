// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC GAMIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

import { FruitTreeProgress, PetProgress } from '../contexts/GamificationContext';
import { GamificationStorage } from './gamificationStorage';

// ─── XP CALCULATION SYSTEM ──────────────────────────────────────────────────────

export interface ReadingActivity {
  id: string;
  type: 'phonics' | 'story' | 'practice' | 'harvest';
  duration: number; // in minutes
  wordsRead: number;
  accuracy: number; // 0-100
  timestamp: Date;
  sessionId?: string;
}

export interface XPCalculation {
  baseXP: number;
  accuracyBonus: number;
  streakBonus: number;
  speedBonus: number;
  totalXP: number;
  breakdown: string[];
}

export class GamificationEngine {
  private static readonly XP_RATES = {
    phonics: { base: 5, per_minute: 1 },
    story: { base: 10, per_minute: 2 },
    practice: { base: 15, per_minute: 1.5 },
    harvest: { base: 0, per_minute: 0 }, // No XP for harvest - fruits are the reward
  } as const;

  private static readonly STREAK_BONUSES: Record<number, number> = {
    1: 0,
    3: 0.1, // 10% bonus
    7: 0.25, // 25% bonus
    14: 0.5, // 50% bonus
    30: 1.0, // 100% bonus
  };

  private static readonly ACCURACY_BONUSES: Record<number, number> = {
    90: 0.2, // 20% bonus for 90%+
    95: 0.3, // 30% bonus for 95%+
    100: 0.5, // 50% bonus for 100%
  };

  // Calculate XP for a reading activity
  static calculateXP(activity: ReadingActivity, currentStreak: number): XPCalculation {
    const rate = this.XP_RATES[activity.type];
    const breakdown: string[] = [];

    // Base XP
    const baseXP = rate.base + (activity.duration * rate.per_minute);
    breakdown.push(`Base: ${rate.base} + ${activity.duration} × ${rate.per_minute} = ${baseXP}`);

    // Accuracy bonus
    let accuracyBonus = 0;
    for (const threshold of [100, 95, 90]) {
      if (activity.accuracy >= threshold) {
        accuracyBonus = baseXP * this.ACCURACY_BONUSES[threshold];
        breakdown.push(`Accuracy bonus (${threshold}%): +${Math.round(accuracyBonus)}`);
        break;
      }
    }

    // Streak bonus
    let streakBonus = 0;
    for (const days of [30, 14, 7, 3, 1]) {
      if (currentStreak >= days) {
        streakBonus = baseXP * this.STREAK_BONUSES[days];
        if (days > 1) {
          breakdown.push(`Streak bonus (${days} days): +${Math.round(streakBonus)}`);
        }
        break;
      }
    }

    // Speed bonus (for fast readers)
    let speedBonus = 0;
    const wordsPerMinute = activity.wordsRead / Math.max(activity.duration, 1);
    if (wordsPerMinute > 20) {
      speedBonus = Math.min(baseXP * 0.1, 5); // Max 5 XP bonus
      breakdown.push(`Speed bonus (${Math.round(wordsPerMinute)} wpm): +${Math.round(speedBonus)}`);
    }

    const totalXP = Math.round(baseXP + accuracyBonus + streakBonus + speedBonus);

    return {
      baseXP: Math.round(baseXP),
      accuracyBonus: Math.round(accuracyBonus),
      streakBonus: Math.round(streakBonus),
      speedBonus: Math.round(speedBonus),
      totalXP,
      breakdown,
    };
  }

  // Calculate tree growth based on total XP
  static async calculateTreeGrowth(totalXP: number): Promise<FruitTreeProgress> {
    const level = Math.floor(totalXP / 100) + 1;
    const fruitsHarvested = Math.floor(totalXP / 200);
    const wordsRead = totalXP * 2; // Estimate: 1 XP = 2 words read
    const booksCompleted = Math.floor(totalXP / 50);
    const currentStreak = await this.getCurrentStreak(); // Would be calculated from actual activity
    const maxStreak = Math.max(currentStreak, 5);

    return {
      totalXP,
      level,
      fruitsHarvested,
      wordsRead,
      booksCompleted,
      currentStreak,
      maxStreak,
    };
  }

  // Calculate pet progress based on total XP and recent activity
  static async calculatePetProgress(totalXP: number, recentActivities: ReadingActivity[]): Promise<PetProgress> {
    const level = Math.floor(totalXP / 150) + 1;
    const todayActivities = recentActivities.filter(
      activity => activity.timestamp.toDateString() === new Date().toDateString()
    );
    const todayMinutesRead = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const currentStreak = await this.getCurrentStreak();
    
    const accessoriesUnlocked = this.getUnlockedAccessories(level);

    return {
      level,
      totalXP,
      currentStreak,
      lastActivityDate: recentActivities[0]?.timestamp.toISOString(),
      todayMinutesRead,
      dailyGoalMinutes: 15,
      accessoriesUnlocked,
    };
  }

  // Get unlocked accessories based on pet level
  private static getUnlockedAccessories(level: number): string[] {
    const accessories: string[] = [];
    if (level >= 2) accessories.push('small_hat');
    if (level >= 3) accessories.push('collar');
    if (level >= 5) accessories.push('toy');
    if (level >= 7) accessories.push('special_collar');
    if (level >= 10) accessories.push('crown');
    return accessories;
  }

  // Calculate current streak from activities
  static async getCurrentStreak(): Promise<number> {
    try {
      const activities = await GamificationStorage.getReadingActivities();
      if (activities.length === 0) return 0;

      // Sort activities by date (most recent first)
      const sortedActivities = activities.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day

      for (const activity of sortedActivities) {
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0); // Set to start of day

        if (activityDate.getTime() === currentDate.getTime()) {
          streak++;
          // Move to previous day
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (activityDate.getTime() < currentDate.getTime()) {
          // Check if it's exactly the previous day
          const expectedDate = new Date(currentDate);
          expectedDate.setDate(expectedDate.getDate() + 1);
          
          if (activityDate.getTime() === expectedDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break; // Streak broken
          }
        } else {
          break; // Future date, shouldn't happen
        }
      }

      return streak;
    } catch (error) {
      console.error('Failed to calculate streak:', error);
      return 0;
    }
  }

  // Generate dynamic achievements based on progress
  static generateAchievements(progress: FruitTreeProgress & PetProgress): any[] {
    const achievements = [];

    // Word count achievements
    if (progress.wordsRead >= 1) {
      achievements.push({
        id: 'first_word',
        type: 'milestone',
        name: 'First Word Read',
        description: 'Read your first word!',
        icon: '🎖️',
        rarity: 'common',
        rewardType: 'xp',
        rewardValue: 10,
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    // Streak achievements
    if (progress.currentStreak >= 3) {
      achievements.push({
        id: 'streak_3',
        type: 'streak',
        name: '3 Day Streak',
        description: 'Read for 3 days in a row',
        icon: '🔥',
        rarity: 'common',
        rewardType: 'xp',
        rewardValue: 25,
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    if (progress.currentStreak >= 7) {
      achievements.push({
        id: 'streak_7',
        type: 'streak',
        name: 'Week Warrior',
        description: 'Read for 7 days in a row',
        icon: '🔥',
        rarity: 'rare',
        rewardType: 'xp',
        rewardValue: 50,
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    // Level achievements
    if (progress.level >= 5) {
      achievements.push({
        id: 'level_5',
        type: 'level',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        rarity: 'uncommon',
        rewardType: 'accessory',
        rewardValue: 'special_collar',
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    // Fruit achievements
    if (progress.fruitsHarvested >= 1) {
      achievements.push({
        id: 'first_fruit',
        type: 'harvest',
        name: 'First Harvest',
        description: 'Harvest your first fruit',
        icon: '🍎',
        rarity: 'common',
        rewardType: 'xp',
        rewardValue: 15,
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }

    return achievements;
  }

  // Calculate next milestone
  static calculateNextMilestone(currentXP: number): any {
    const milestones = [
      { xp: 100, type: 'tree_growth', reward: 'birdhouse', name: 'Young Tree' },
      { xp: 250, type: 'tree_growth', reward: 'fairy_lights', name: 'Fruit Tree' },
      { xp: 500, type: 'pet_level', reward: 'collar', name: 'Pet Level Up' },
      { xp: 1000, type: 'tree_growth', reward: 'swing', name: 'Mature Tree' },
      { xp: 2000, type: 'pet_level', reward: 'toy', name: 'Pet Companion' },
    ];

    const next = milestones.find(m => m.xp > currentXP);
    if (!next) return null;

    return {
      type: next.type,
      value: next.xp,
      reward: next.reward,
      progress: currentXP,
    };
  }

  // Calculate daily goal progress
  static calculateDailyGoal(activities: ReadingActivity[]): any {
    const today = new Date().toDateString();
    const todayActivities = activities.filter(activity => 
      activity.timestamp.toDateString() === today
    );

    const minutesRead = todayActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const wordsRead = todayActivities.reduce((sum, activity) => sum + activity.wordsRead, 0);
    const sessionsCompleted = todayActivities.length;

    const targetMinutes = 15;
    const targetWords = 50;
    const progressPercent = Math.min(100, (minutesRead / targetMinutes) * 100);

    return {
      id: 'daily_goal_' + today,
      date: new Date(),
      targetMinutes,
      targetWords,
      minutesRead,
      wordsRead,
      sessionsCompleted,
      isCompleted: progressPercent >= 100,
      progressPercent,
    };
  }
}
