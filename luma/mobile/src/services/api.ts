import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  ApiResponse,
  AuthResult,
  Profile,
  ReadingComfortSettings,
  Story,
  PaginatedStories,
  SessionRecord,
  SessionSummary,
  ProgressStats,
  SyllableEntry,
  ReadingLevel,
  LinkedChild,
  DayActivity,
  ContinueReadingStory,
  PhonicsLesson,
  PhonicsProgress,
  StoryListItem,
} from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'luma_access_token';
const REFRESH_KEY = 'luma_refresh_token';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor — attach access token ────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor — auto-refresh on 401 ───────────────────────────────

let isRefreshing = false;
let refreshSubscribers: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (error: any) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: any) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          }, (err) => {
            reject(err);
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>
          (`${BASE_URL}/auth/refresh`, { refreshToken });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
        await SecureStore.setItemAsync(REFRESH_KEY, newRefreshToken);

        onRefreshed(newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        isRefreshing = false;
        onRefreshFailed(err);
        await TokenStorage.clear();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ─── Token Storage Helpers ────────────────────────────────────────────────────

export const TokenStorage = {
  async save(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  async register(payload: {
    email: string;
    password: string;
    role: string;
    displayName: string;
    age?: number;
  }): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/register', payload);
    return data.data;
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/login', { email, password });
    return data.data;
  },

  async me(): Promise<AuthResult['user']> {
    const { data } = await api.get<ApiResponse<AuthResult['user']>>('/auth/me');
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      // Use _retry to avoid getting stuck in refresh loops if offline
      await api.post('/auth/logout', undefined, { _retry: true } as any);
    } catch (error) {
      // Ignore server errors during logout (like the 401 you are seeing)
      console.log('Server logout rejected, clearing local tokens anyway');
    } finally {
      // ALWAYS clear local tokens so the user isn't stuck
      await TokenStorage.clear();
    }
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  async getProfile(userId: string): Promise<Profile> {
    const { data } = await api.get<ApiResponse<Profile>>(`/profile/${userId}`);
    return data.data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data } = await api.put<ApiResponse<Profile>>(`/profile/${userId}`, updates);
    return data.data;
  },

  async updateReadingComfort(userId: string, comfort: Partial<ReadingComfortSettings>): Promise<Profile> {
    const { data } = await api.put<ApiResponse<Profile>>(`/profile/${userId}`, comfort);
    return data.data;
  },

  async linkChild(childEmail: string): Promise<{ message: string }> {
    const { data } = await api.post<ApiResponse<{ message: string }>>('/profile/link-child', { childEmail });
    return data.data;
  },

  async getMyChildren(): Promise<LinkedChild[]> {
    const { data } = await api.get<ApiResponse<LinkedChild[]>>('/profile/my-children');
    return data.data;
  },
};

// ─── Content API ──────────────────────────────────────────────────────────────

export const contentApi = {
  async listStories(params?: {
    readingLevel?: ReadingLevel;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedStories> {
    const { data } = await api.get<ApiResponse<PaginatedStories>>('/content', { params });
    return data.data;
  },

  async getStory(id: string): Promise<Story> {
    const { data } = await api.get<ApiResponse<Story>>(`/content/${id}`);
    return data.data;
  },

  async generateStory(payload: {
    topic: string;
    readingLevel: ReadingLevel;
    ageGroup?: string;
    maxWords?: number;
  }): Promise<Story> {
    const { data } = await api.post<ApiResponse<Story>>('/content/generate-story', payload, { timeout: 60000 });
    return data.data;
  },

  async syllabify(text: string): Promise<SyllableEntry[]> {
    const { data } = await api.post<ApiResponse<SyllableEntry[]>>('/content/syllabify', { text });
    return data.data;
  },
};

// ─── Progress API ─────────────────────────────────────────────────────────────

export const progressApi = {
  async recordSession(session: SessionRecord): Promise<SessionSummary> {
    const { data } = await api.post<ApiResponse<SessionSummary>>('/progress/session', session);
    return data.data;
  },

  async getProgress(userId: string, params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<ProgressStats> {
    const { data } = await api.get<ApiResponse<ProgressStats>>(`/progress/${userId}`, { params });
    return data.data;
  },

  async getWeeklyActivity(userId: string): Promise<DayActivity[]> {
    const { data } = await api.get<ApiResponse<DayActivity[]>>(`/progress/${userId}/weekly`);
    return data.data;
  },

  async getContinueReading(userId: string): Promise<ContinueReadingStory | null> {
    const { data } = await api.get<ApiResponse<ContinueReadingStory | null>>(`/progress/${userId}/continue-reading`);
    return data.data;
  },
};

// ─── Content with Progress API ────────────────────────────────────────────────

export interface StoryWithProgress extends StoryListItem {
  completionPct: number;
}

export const libraryApi = {
  async getStoriesWithProgress(userId: string): Promise<StoryWithProgress[]> {
    // Get all stories and user's progress, merge them (max 50 per API limit)
    const [stories, progress] = await Promise.all([
      contentApi.listStories({ limit: 50 }),
      progressApi.getProgress(userId),
    ]);

    // Map stories with their completion percentage from sessions
    return stories.items.map((story) => {
      const session = progress.recentSessions.find((s) => s.contentId === story.id);
      return {
        ...story,
        completionPct: session?.completionPct ?? 0,
      };
    });
  },
};

// ─── Phonics API ──────────────────────────────────────────────────────────────

export const phonicsApi = {
  async getLessons(): Promise<PhonicsLesson[]> {
    const { data } = await api.get<ApiResponse<PhonicsLesson[]>>('/phonics/lessons');
    return data.data;
  },

  async getMyProgress(): Promise<PhonicsProgress[]> {
    const { data } = await api.get<ApiResponse<PhonicsProgress[]>>('/phonics/my-progress');
    return data.data;
  },

  async recordPractice(lessonId: string, correct: boolean): Promise<PhonicsProgress> {
    const { data } = await api.post<ApiResponse<PhonicsProgress>>('/phonics/practice', { lessonId, correct });
    return data.data;
  },
};

// ─── Gamification Types ─────────────────────────────────────────

export interface GamificationData {
  plant: {
    currentStage: string;
    currentXP: number;
    totalXP: number;
    level: number;
    plantVariant?: string;
    decorations: string[];
    wordsRead: number;
    sessionsCompleted: number;
    progressToNext: number;
    nextStage: string;
  };
  achievements: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    rewardType: string;
    rewardValue: any;
    isUnlocked: boolean;
    unlockedAt?: Date;
    progress?: number;
  }>;
  recentXP: Array<{
    id: string;
    xpEarned: number;
    source: string;
    sourceId?: string;
    multiplier: number;
    createdAt: Date;
  }>;
  dailyGoal: {
    id: string;
    date: Date;
    targetMinutes: number;
    targetWords: number;
    minutesRead: number;
    wordsRead: number;
    sessionsCompleted: number;
    isCompleted: boolean;
    progressPercent: number;
  } | null;
  totalUnlocked: number;
  nextMilestone: {
    type: string;
    value: number;
    reward: string;
    progress: number;
  } | null;
}

// ─── Gamification API ────────────────────────────────────────────

export const gamificationApi = {
  async getProgress(): Promise<GamificationData> {
    const { data } = await api.get<ApiResponse<GamificationData>>('/gamification/progress');
    return data.data;
  },

  async getAchievements(): Promise<GamificationData['achievements']> {
    const { data } = await api.get<ApiResponse<GamificationData['achievements']>>('/gamification/achievements');
    return data.data;
  },

  async getXPHistory(limit = 20): Promise<GamificationData['recentXP']> {
    const { data } = await api.get<ApiResponse<GamificationData['recentXP']>>(`/gamification/history?limit=${limit}`);
    return data.data;
  },

  async claimMilestone(milestoneId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<ApiResponse<{ success: boolean; message: string }>>(`/gamification/claim/${milestoneId}`);
    return data.data;
  },
};

export default api;
