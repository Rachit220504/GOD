import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { GamificationData } from '../services/api';
import { GamificationEngine, ReadingActivity, XPCalculation } from '../utils/gamificationEngine';
import { GamificationStorage } from '../utils/gamificationStorage';

// Import TREE_STAGES from FruitTree component
const TREE_STAGES = [
  { level: 1, xp: 0, name: 'Seed', emoji: '🌰', fruits: 0, description: 'Plant your reading journey' },
  { level: 2, xp: 50, name: 'Sprout', emoji: '🌱', fruits: 0, description: 'Your tree is growing!' },
  { level: 3, xp: 150, name: 'Sapling', emoji: '🌿', fruits: 1, description: 'First branches appearing' },
  { level: 4, xp: 300, name: 'Young Tree', emoji: '🌳', fruits: 2, description: 'Small fruits growing' },
  { level: 5, xp: 500, name: 'Fruit Tree', emoji: '🌳', fruits: 3, description: 'Ready to harvest!' },
  { level: 6, xp: 800, name: 'Blooming Tree', emoji: '🌳', fruits: 4, description: 'Full of fruits!' },
  { level: 7, xp: 1200, name: 'Mature Tree', emoji: '🌳', fruits: 5, description: 'Bountiful harvests!' },
  { level: 8, xp: 1800, name: 'Grand Tree', emoji: '🌳', fruits: 6, description: 'Legendary reader!' },
  { level: 9, xp: 2500, name: 'Ancient Tree', emoji: '🌳', fruits: 8, description: 'Reading master!' },
  { level: 10, xp: 3500, name: 'Mythical Tree', emoji: '🌳', fruits: 10, description: 'Ultimate achievement!' },
];

// ─── Types ────────────────────────────────────────────────────────────

export type GamificationTab = 'tree' | 'pet';

export interface MilestoneReward {
  milestoneId: string;
  type: 'tree_growth' | 'streak' | 'total_words' | 'achievement' | 'pet_level';
  name: string;
  description: string;
  rewardType: string;
  rewardValue: any;
  isClaimed: boolean;
}

export interface XPBreakdown {
  baseXP: number;
  accuracyBonus: number;
  streakBonus: number;
  speedBonus: number;
  totalXP: number;
}

export interface FruitTreeProgress {
  totalXP: number;
  level: number;
  fruitsHarvested: number;
  wordsRead: number;
  booksCompleted: number;
  currentStreak: number;
  maxStreak: number;
}

export interface PetProgress {
  level: number;
  totalXP: number;
  currentStreak: number;
  lastActivityDate?: string;
  todayMinutesRead: number;
  dailyGoalMinutes: number;
  accessoriesUnlocked: string[];
}

export interface GamificationState extends GamificationData {
  milestones: MilestoneReward[];
  fruitTree: FruitTreeProgress;
  pet: PetProgress;
}

interface GamificationContextType {
  // State
  state: GamificationState | null;
  isLoading: boolean;
  isRefreshing: boolean;
  currentTab: GamificationTab;
  pendingMilestones: number;
  
  // Tab switching
  setCurrentTab: (tab: GamificationTab) => void;
  
  // Data operations
  refreshData: () => Promise<void>;
  claimMilestone: (milestoneId: string) => Promise<boolean>;
  
  // XP and progress
  awardXP: (sessionId: string) => Promise<{ success: boolean; xpBreakdown?: XPBreakdown; treeGrew?: boolean; petLeveled?: boolean }>;
  harvestFruit: () => Promise<boolean>;
  
  // Dynamic activity tracking
  trackReadingActivity: (activity: ReadingActivity) => Promise<{ success: boolean; xpEarned: number; breakdown?: XPCalculation }>;
  simulateReadingSession: (type: 'phonics' | 'story' | 'practice', duration: number) => Promise<void>;
  
  // Computed
  hasUnclaimedRewards: boolean;
  fruitTreeProgress: FruitTreeProgress | null;
  petProgress: PetProgress | null;
}

// ─── Context ──────────────────────────────────────────────────────────

const GamificationContext = createContext<GamificationContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [state, setState] = useState<GamificationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<GamificationTab>('tree');

  // Fetch full gamification state
  const fetchFullState = useCallback(async () => {
    try {
      // Get real data from storage and calculate dynamic state
      const activities = await GamificationStorage.getReadingActivities();
      const totalXP = await GamificationStorage.getTotalXP();
      
      // Calculate dynamic progress using the engine
      const fruitTreeProgress = await GamificationEngine.calculateTreeGrowth(totalXP);
      const petProgress = await GamificationEngine.calculatePetProgress(totalXP, activities);
      const achievements = GamificationEngine.generateAchievements({
        ...fruitTreeProgress,
        ...petProgress,
      });
      const dailyGoal = GamificationEngine.calculateDailyGoal(activities);
      const nextMilestone = GamificationEngine.calculateNextMilestone(totalXP);
      
      // Generate recent XP entries from activities
      const recentXP = activities.slice(0, 10).map((activity, index) => ({
        id: `xp_${activity.id}`,
        xpEarned: Math.round(activity.duration * 2), // Rough XP calculation
        source: activity.type,
        sourceId: activity.sessionId || activity.id,
        multiplier: 1,
        createdAt: activity.timestamp,
      }));
      
      // Generate milestones from achievements
      const milestones = achievements
        .filter(a => !a.isUnlocked)
        .map(achievement => ({
          milestoneId: achievement.id,
          type: achievement.type,
          name: achievement.name,
          description: achievement.description,
          rewardType: achievement.rewardType,
          rewardValue: achievement.rewardValue,
          isClaimed: false,
        }));

      // Calculate plant stage based on XP
      const getPlantStage = (xp: number) => {
        if (xp < 50) return { stage: 'Seed', nextStage: 'Sprout', progress: (xp / 50) * 100 };
        if (xp < 150) return { stage: 'Sprout', nextStage: 'Sapling', progress: ((xp - 50) / 100) * 100 };
        if (xp < 300) return { stage: 'Sapling', nextStage: 'Young Tree', progress: ((xp - 150) / 150) * 100 };
        if (xp < 500) return { stage: 'Young Tree', nextStage: 'Fruit Tree', progress: ((xp - 300) / 200) * 100 };
        if (xp < 800) return { stage: 'Fruit Tree', nextStage: 'Blooming Tree', progress: ((xp - 500) / 300) * 100 };
        return { stage: 'Blooming Tree', nextStage: 'Mature Tree', progress: Math.min(100, ((xp - 800) / 400) * 100) };
      };
      
      const plantStage = getPlantStage(totalXP);
      
      const dynamicData: GamificationState = {
        plant: {
          currentStage: plantStage.stage,
          currentXP: totalXP,
          totalXP,
          level: fruitTreeProgress.level,
          plantVariant: 'oak',
          decorations: [], // Would be calculated from unlocked achievements
          wordsRead: fruitTreeProgress.wordsRead,
          sessionsCompleted: activities.length,
          progressToNext: plantStage.progress,
          nextStage: plantStage.nextStage,
        },
        achievements,
        recentXP,
        milestones,
        fruitTree: fruitTreeProgress,
        pet: petProgress,
        totalUnlocked: achievements.filter(a => a.isUnlocked).length,
        dailyGoal,
        nextMilestone: nextMilestone || {
          type: 'tree_growth',
          value: 1000,
          reward: 'swing',
          progress: totalXP,
        },
      };
      
      setState(dynamicData);
    } catch (error) {
      console.error('Failed to fetch dynamic gamification state:', error);
      // Fallback to basic state
      setState({
        plant: {
          currentStage: 'Seed',
          currentXP: 0,
          totalXP: 0,
          level: 1,
          plantVariant: 'oak',
          decorations: [],
          wordsRead: 0,
          sessionsCompleted: 0,
          progressToNext: 0,
          nextStage: 'Sprout',
        },
        achievements: [],
        recentXP: [],
        milestones: [],
        fruitTree: {
          totalXP: 0,
          level: 1,
          fruitsHarvested: 0,
          wordsRead: 0,
          booksCompleted: 0,
          currentStreak: 0,
          maxStreak: 0,
        },
        pet: {
          level: 1,
          totalXP: 0,
          currentStreak: 0,
          lastActivityDate: undefined,
          todayMinutesRead: 0,
          dailyGoalMinutes: 15,
          accessoriesUnlocked: [],
        },
        totalUnlocked: 0,
        dailyGoal: null,
        nextMilestone: {
          type: 'tree_growth',
          value: 50,
          reward: 'birdhouse',
          progress: 0,
        },
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Clean up old data first
      await GamificationStorage.cleanupOldData();
      await fetchFullState();
      setIsLoading(false);
    };
    loadData();
  }, [fetchFullState]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchFullState();
    setIsRefreshing(false);
  }, [fetchFullState]);

  // Claim milestone
  const claimMilestone = useCallback(async (milestoneId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/gamification/claim/${milestoneId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to claim');

      const data = await response.json();
      if (data.success) {
        // Refresh to get updated state
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to claim milestone:', error);
      return false;
    }
  }, [refreshData]);

  // Award XP for a session
  const awardXP = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/gamification/award-xp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            source: 'reading_session',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to award XP');

      const data = await response.json();
      
      if (data.success) {
        // Refresh state after awarding XP
        await refreshData();
        return {
          success: true,
          xpBreakdown: data.data.breakdown,
          treeGrew: data.data.treeGrew,
          petLeveled: data.data.petLeveled,
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to award XP:', error);
      return { success: false };
    }
  }, [refreshData]);

  // Harvest fruit from tree (only available when tree has fruits from real XP)
  const harvestFruit = useCallback(async (): Promise<boolean> => {
    try {
      // Clean up old data to prevent storage bloat
      await GamificationStorage.cleanupOldData();
      
      // Only allow harvesting if tree actually has fruits (based on real XP)
      const currentXP = await GamificationStorage.getTotalXP();
      const treeStage = TREE_STAGES.slice().reverse().find(s => currentXP >= s.xp) || TREE_STAGES[0];
      
      if (treeStage.fruits === 0) {
        console.log('No fruits available to harvest - need more reading XP!');
        return false;
      }
      
      // Check if fruits are available to harvest (not already harvested)
      const currentData = await GamificationStorage.getReadingActivities();
      const fruitsHarvestedToday = currentData.filter(a => 
        a.type === 'harvest' && 
        new Date(a.timestamp).toDateString() === new Date().toDateString()
      ).length;
      
      if (fruitsHarvestedToday >= treeStage.fruits) {
        console.log('All fruits already harvested today!');
        return false;
      }
      
      // Record harvest activity (no XP reward - fruits are the reward)
      const harvestActivity: ReadingActivity = {
        id: `harvest_${Date.now()}`,
        type: 'harvest',
        duration: 0,
        wordsRead: 0,
        accuracy: 100,
        timestamp: new Date(),
        sessionId: `harvest_${Date.now()}`,
      };
      
      await GamificationStorage.saveReadingActivity(harvestActivity);
      
      // Refresh the context data
      await refreshData();
      return true;
    } catch (error) {
      console.error('Failed to harvest fruit:', error);
      return false;
    }
  }, [refreshData]);

  // Dynamic activity tracking
  const trackReadingActivity = useCallback(async (activity: ReadingActivity) => {
    try {
      // Get current streak
      const currentStreak = await GamificationStorage.updateStreak();
      
      // Calculate XP
      const xpCalculation = GamificationEngine.calculateXP(activity, currentStreak);
      
      // Save activity and add XP
      await GamificationStorage.saveReadingActivity(activity);
      await GamificationStorage.addXP(xpCalculation.totalXP);
      
      // Refresh state to show updated progress
      await refreshData();
      
      return {
        success: true,
        xpEarned: xpCalculation.totalXP,
        breakdown: xpCalculation,
      };
    } catch (error) {
      console.error('Failed to track reading activity:', error);
      return { success: false, xpEarned: 0 };
    }
  }, [refreshData]);

  // Simulate reading session for testing
  const simulateReadingSession = useCallback(async (type: 'phonics' | 'story' | 'practice', duration: number) => {
    const activity: ReadingActivity = {
      id: `activity_${Date.now()}`,
      type,
      duration,
      wordsRead: Math.floor(duration * (type === 'story' ? 3 : type === 'phonics' ? 5 : 2)),
      accuracy: 85 + Math.floor(Math.random() * 15), // 85-100% accuracy
      timestamp: new Date(),
      sessionId: `session_${Date.now()}`,
    };
    
    await trackReadingActivity(activity);
  }, [trackReadingActivity]);

  // Computed values
  const pendingMilestones = state?.milestones?.filter(m => !m.isClaimed).length || 0;
  const hasUnclaimedRewards = pendingMilestones > 0;
  const fruitTreeProgress = state?.fruitTree || null;
  const petProgress = state?.pet || null;

  const value: GamificationContextType = {
    state,
    isLoading,
    isRefreshing,
    currentTab,
    pendingMilestones,
    setCurrentTab,
    refreshData,
    claimMilestone,
    awardXP,
    harvestFruit,
    trackReadingActivity,
    simulateReadingSession,
    hasUnclaimedRewards,
    fruitTreeProgress,
    petProgress,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}

// ─── Helper ───────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  // Import dynamically to avoid circular dependency
  const { TokenStorage } = await import('../services/api');
  const token = await TokenStorage.getAccessToken();
  return token || '';
}
