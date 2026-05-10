// ─── Gamification Module Exports ──────────────────────────────────────

export { gamificationService } from './gamification.service';
export { gamificationEngine } from './gamificationEngine.service';
export { gamificationController } from './gamification.controller';
export { gamificationEngineController } from './gamificationEngine.controller';

// Export types
export type { 
  XPBreakdown, 
  MilestoneReward, 
  GamificationTheme 
} from './gamificationEngine.service';

export type {
  PlantProgressResponse,
  AchievementResponse,
  XPHistoryEntry,
  DailyGoalResponse,
  GamificationStats,
} from './gamification.service';
