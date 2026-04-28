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
    await api.post('/auth/logout');
    await TokenStorage.clear();
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
};

export default api;
