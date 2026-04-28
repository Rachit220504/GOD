// Analytics API layer additions for mobile
import api from './api';
import { ApiResponse } from '../types';

export interface ProgressSummary {
  totalSessions: number;
  totalReadingSeconds: number;
  avgWordsPerMinute: number;
  avgAccuracyPercent: number;
  avgCompletionPct: number;
  booksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  weeklyActivity: { date: string; minutes: number; wordsRead: number }[];
  monthlyProgress: { week: string; avgWpm: number; avgAccuracy: number }[];
}

export interface SkillsData {
  phonicsScore: number;
  comprehensionScore: number;
  fluencyScore: number;
  weakAreas: string[];
  strongAreas: string[];
  skillTrend: { date: string; phonics: number; fluency: number; comprehension: number }[];
}

export interface SessionHistoryItem {
  id: string;
  contentTitle: string;
  readingLevel: string;
  wordsRead: number;
  wordsPerMinute: number;
  accuracyPercent: number;
  completionPct: number;
  durationSeconds: number;
  helpRequestCount: number;
  startedAt: string;
}

export interface PaginatedHistory {
  items: SessionHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReadingTips {
  general: string[];
  personalized: string[];
  generatedAt: string;
}

export const analyticsApi = {
  async getSummary(userId: string): Promise<ProgressSummary> {
    const { data } = await api.get<ApiResponse<ProgressSummary>>(`/analytics/${userId}/summary`);
    return data.data;
  },

  async getSkills(userId: string): Promise<SkillsData> {
    const { data } = await api.get<ApiResponse<SkillsData>>(`/analytics/${userId}/skills`);
    return data.data;
  },

  async getHistory(userId: string, page = 1, limit = 10): Promise<PaginatedHistory> {
    const { data } = await api.get<ApiResponse<PaginatedHistory>>(
      `/analytics/${userId}/history`,
      { params: { page, limit } },
    );
    return data.data;
  },

  async getTips(userId: string): Promise<ReadingTips> {
    const { data } = await api.get<ApiResponse<ReadingTips>>(`/analytics/${userId}/tips`);
    return data.data;
  },
};
