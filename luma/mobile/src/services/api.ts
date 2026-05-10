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
} from '../types';
import { PHONICS_PRONUNCIATIONS } from '../constants/phonics';

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
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
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
      } catch {
        isRefreshing = false;
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
      await api.post('/auth/logout');
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
    const { data } = await api.post<ApiResponse<Story>>('/content/generate-story', payload);
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

// Generate phonics lessons from local pronunciation data
const generatePhonicsLessons = (): PhonicsLesson[] => {
  const colors = [
    '#FFE5E5', '#E5F5FF', '#E5FFE5', '#FFF5E5', '#F5E5FF',
    '#FFE5F5', '#E5FFF5', '#F5FFE5', '#FFE5CC', '#CCE5FF'
  ];

  return PHONICS_PRONUNCIATIONS.map((pronunciation, index) => ({
    id: `phonics-${pronunciation.letter}`,
    letter: pronunciation.letter,
    sound: pronunciation.sound,
    examples: generateExampleWords(pronunciation.letter),
    wrongExamples: generateWrongExamples(pronunciation.letter),
    colorTheme: colors[index % colors.length],
    difficulty: 1,
    order: index + 1,
  }));
};

// Helper function to generate example words for each letter
const generateExampleWords = (letter: string): string[] => {
  const wordMap: Record<string, string[]> = {
    'A': ['apple', 'ant', 'alligator'],
    'B': ['ball', 'bear', 'banana'],
    'C': ['cat', 'car', 'cake'],
    'D': ['dog', 'duck', 'door'],
    'E': ['elephant', 'egg', 'engine'],
    'F': ['fish', 'frog', 'flower'],
    'G': ['goat', 'girl', 'green'],
    'H': ['hat', 'house', 'horse'],
    'I': ['ice cream', 'igloo', 'insect'],
    'J': ['juice', 'jump', 'jelly'],
    'K': ['kite', 'king', 'kitten'],
    'L': ['lion', 'lamp', 'leaf'],
    'M': ['moon', 'mouse', 'milk'],
    'N': ['nest', 'nose', 'net'],
    'O': ['orange', 'octopus', 'ocean'],
    'P': ['pencil', 'penguin', 'pizza'],
    'Q': ['queen', 'quiet', 'question'],
    'R': ['rabbit', 'rain', 'robot'],
    'S': ['sun', 'snake', 'star'],
    'T': ['tree', 'tiger', 'train'],
    'U': ['umbrella', 'unicorn', 'up'],
    'V': ['violin', 'vegetable', 'van'],
    'W': ['water', 'window', 'whale'],
    'X': ['x-ray', 'xylophone', 'box'],
    'Y': ['yacht', 'yarn', 'yellow'],
    'Z': ['zebra', 'zero', 'zoo'],
  };
  return wordMap[letter] || ['word1', 'word2', 'word3'];
};

// Helper function to generate wrong examples (distractors)
const generateWrongExamples = (letter: string): string[] => {
  const allDistractors = ['sun', 'moon', 'tree', 'car', 'house', 'book', 'ball', 'hat', 'shoe', 'cup'];
  // Filter out words that might be examples for this letter
  const examples = generateExampleWords(letter);
  const filteredDistractors = allDistractors.filter(d => !examples.includes(d));
  return filteredDistractors.slice(0, 3);
};

export const phonicsApi = {
  async getLessons(): Promise<PhonicsLesson[]> {
    // Return locally generated lessons instead of fetching from API
    return generatePhonicsLessons();
  },

  async getMyProgress(): Promise<PhonicsProgress[]> {
    // For now, return empty progress - in a real app this would come from storage/backend
    return [];
  },

  async recordPractice(lessonId: string, correct: boolean): Promise<PhonicsProgress> {
    // For now, return a mock progress object - in a real app this would save to backend
    return {
      id: `progress-${lessonId}`,
      userId: 'current-user',
      lessonId,
      attempts: 1,
      correctCount: correct ? 1 : 0,
      masteryLevel: correct ? 10 : 0,
      lastPracticedAt: new Date().toISOString(),
    };
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
