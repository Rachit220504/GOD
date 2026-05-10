// ═══════════════════════════════════════════════════════════════════════════
// GAMIFICATION DATA STORAGE
// ═══════════════════════════════════════════════════════════════════════════

import * as SecureStore from 'expo-secure-store';
import { ReadingActivity } from './gamificationEngine';

const STORAGE_KEYS = {
  READING_ACTIVITIES: 'gamification_activities',
  TOTAL_XP: 'gamification_total_xp',
  CURRENT_STREAK: 'gamification_current_streak',
  LAST_ACTIVITY_DATE: 'gamification_last_activity',
  ACHIEVEMENTS_UNLOCKED: 'gamification_achievements',
  DAILY_GOALS_COMPLETED: 'gamification_daily_goals',
} as const;

export class GamificationStorage {
  // Reading Activities
  static async saveReadingActivity(activity: ReadingActivity): Promise<void> {
    try {
      const existingActivities = await this.getReadingActivities();
      existingActivities.unshift(activity); // Add to beginning
      
      // Keep only last 30 activities to prevent storage bloat (reduced from 100)
      const limitedActivities = existingActivities.slice(0, 30);
      
      // Compress activity data by removing unnecessary fields
      const compressedActivities = limitedActivities.map(act => ({
        id: act.id,
        type: act.type,
        sessionId: act.sessionId,
        wordsRead: act.wordsRead,
        accuracy: act.accuracy,
        duration: act.duration,
        timestamp: act.timestamp.toISOString(), // Store as string instead of Date object
      }));
      
      await SecureStore.setItemAsync(
        STORAGE_KEYS.READING_ACTIVITIES,
        JSON.stringify(compressedActivities)
      );
    } catch (error) {
      console.error('Failed to save reading activity:', error);
    }
  }

  static async getReadingActivities(): Promise<ReadingActivity[]> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.READING_ACTIVITIES);
      if (!data) return [];
      
      const activities = JSON.parse(data);
      return activities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        sessionId: activity.sessionId,
        wordsRead: activity.wordsRead,
        accuracy: activity.accuracy,
        duration: activity.duration,
        timestamp: new Date(activity.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get reading activities:', error);
      return [];
    }
  }

  // XP Management
  static async addXP(xp: number): Promise<number> {
    try {
      const currentXP = await this.getTotalXP();
      const newTotal = currentXP + xp;
      await SecureStore.setItemAsync(STORAGE_KEYS.TOTAL_XP, newTotal.toString());
      return newTotal;
    } catch (error) {
      console.error('Failed to add XP:', error);
      return 0;
    }
  }

  static async getTotalXP(): Promise<number> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.TOTAL_XP);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Failed to get total XP:', error);
      return 0;
    }
  }

  // Streak Management
  static async updateStreak(): Promise<number> {
    try {
      const lastActivityDate = await this.getLastActivityDate();
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      let currentStreak = await this.getCurrentStreak();
      
      if (lastActivityDate === today) {
        // Already logged activity today, streak remains
        return currentStreak;
      } else if (lastActivityDate === yesterday) {
        // Continued streak
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
      
      await SecureStore.setItemAsync(STORAGE_KEYS.CURRENT_STREAK, currentStreak.toString());
      await SecureStore.setItemAsync(STORAGE_KEYS.LAST_ACTIVITY_DATE, today);
      
      return currentStreak;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return 1;
    }
  }

  static async getCurrentStreak(): Promise<number> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.CURRENT_STREAK);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Failed to get current streak:', error);
      return 0;
    }
  }

  static async getLastActivityDate(): Promise<string> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_ACTIVITY_DATE);
      return data || '';
    } catch (error) {
      console.error('Failed to get last activity date:', error);
      return '';
    }
  }

  // Achievements
  static async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const unlocked = await this.getUnlockedAchievements();
      if (!unlocked.includes(achievementId)) {
        unlocked.push(achievementId);
        await SecureStore.setItemAsync(
          STORAGE_KEYS.ACHIEVEMENTS_UNLOCKED,
          JSON.stringify(unlocked)
        );
      }
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  }

  static async getUnlockedAchievements(): Promise<string[]> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.ACHIEVEMENTS_UNLOCKED);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get unlocked achievements:', error);
      return [];
    }
  }

  // Daily Goals
  static async completeDailyGoal(date: string): Promise<void> {
    try {
      const completed = await this.getCompletedDailyGoals();
      if (!completed.includes(date)) {
        completed.push(date);
        await SecureStore.setItemAsync(
          STORAGE_KEYS.DAILY_GOALS_COMPLETED,
          JSON.stringify(completed)
        );
      }
    } catch (error) {
      console.error('Failed to complete daily goal:', error);
    }
  }

  static async getCompletedDailyGoals(): Promise<string[]> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.DAILY_GOALS_COMPLETED);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get completed daily goals:', error);
      return [];
    }
  }

  // Clean up old data to prevent storage bloat
  static async cleanupOldData(): Promise<void> {
    try {
      // Clean up old activities (keep only last 30)
      const activities = await this.getReadingActivities();
      if (activities.length > 30) {
        const recentActivities = activities.slice(0, 30);
        const compressedActivities = recentActivities.map(act => ({
          id: act.id,
          type: act.type,
          sessionId: act.sessionId,
          wordsRead: act.wordsRead,
          accuracy: act.accuracy,
          duration: act.duration,
          timestamp: act.timestamp.toISOString(),
        }));
        
        await SecureStore.setItemAsync(
          STORAGE_KEYS.READING_ACTIVITIES,
          JSON.stringify(compressedActivities)
        );
      }
      
      // Clean up old daily goals (keep only last 30 days)
      const completedGoals = await this.getCompletedDailyGoals();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentGoals = completedGoals.filter(date => {
        const goalDate = new Date(date);
        return goalDate >= thirtyDaysAgo;
      });
      
      if (recentGoals.length !== completedGoals.length) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.DAILY_GOALS_COMPLETED,
          JSON.stringify(recentGoals)
        );
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  // Reset all data (for testing/debugging)
  static async resetAllData(): Promise<void> {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map(key => 
          SecureStore.deleteItemAsync(key)
        )
      );
    } catch (error) {
      console.error('Failed to reset gamification data:', error);
    }
  }

  // Get summary stats
  static async getSummaryStats() {
    const activities = await this.getReadingActivities();
    const totalXP = await this.getTotalXP();
    const currentStreak = await this.getCurrentStreak();
    const unlockedAchievements = await this.getUnlockedAchievements();
    const completedDailyGoals = await this.getCompletedDailyGoals();

    const todayActivities = activities.filter(
      activity => activity.timestamp.toDateString() === new Date().toDateString()
    );

    const thisWeekActivities = activities.filter(
      activity => {
        const activityDate = new Date(activity.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= weekAgo;
      }
    );

    return {
      totalXP,
      currentStreak,
      totalActivities: activities.length,
      todayActivities: todayActivities.length,
      thisWeekActivities: thisWeekActivities.length,
      todayMinutesRead: todayActivities.reduce((sum, activity) => sum + activity.duration, 0),
      todayWordsRead: todayActivities.reduce((sum, activity) => sum + activity.wordsRead, 0),
      unlockedAchievements: unlockedAchievements.length,
      completedDailyGoals: completedDailyGoals.length,
    };
  }
}
