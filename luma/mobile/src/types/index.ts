// ─── Global Type Definitions for LUMA ────────────────────────────────────────

export type UserRole = 'CHILD' | 'PARENT' | 'EDUCATOR';

export type ReadingLevel = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
  readingLevel: ReadingLevel;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ReadingComfortSettings {
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor: string;
  fontFamily: string;
}

export interface Profile extends ReadingComfortSettings {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  age: number | null;
  readingLevel: ReadingLevel;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  booksCompleted: number;
}

// ─── Content ──────────────────────────────────────────────────────────────────

export interface SyllableEntry {
  word: string;
  syllables: string[];
  chunks: string[];
  pronunciation: string;
}

export interface Story {
  id: string;
  title: string;
  body: string;
  syllableMap: SyllableEntry[];
  readingLevel: ReadingLevel;
  topic: string | null;
  ageGroup: string | null;
  wordCount: number;
  estimatedMins: number;
  tags: string[];
  createdAt: string;
}

export interface StoryListItem {
  id: string;
  title: string;
  readingLevel: ReadingLevel;
  topic: string | null;
  wordCount: number;
  estimatedMins: number;
  tags: string[];
}

export interface PaginatedStories {
  items: StoryListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface SessionRecord {
  contentId: string;
  wordsRead: number;
  wordsPerMinute: number;
  accuracyPercent: number;
  completionPct: number;
  durationSeconds: number;
  helpRequestCount?: number;
  fontSizeUsed?: number;
  letterSpacingUsed?: number;
  lineHeightUsed?: number;
  backgroundColorUsed?: string;
}

export interface WeeklyActivity {
  date: string;
  minutes: number;
  wordsRead: number;
}

export interface ProgressStats {
  totalSessions: number;
  totalReadingSeconds: number;
  totalWordsRead: number;
  avgWordsPerMinute: number;
  avgAccuracyPercent: number;
  avgCompletionPct: number;
  booksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  recentSessions: SessionSummary[];
  weeklyActivity: WeeklyActivity[];
}

export interface SessionSummary {
  id: string;
  contentId: string;
  contentTitle: string;
  wordsRead: number;
  wordsPerMinute: number;
  accuracyPercent: number;
  completionPct: number;
  durationSeconds: number;
  startedAt: string;
  finishedAt: string | null;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    details?: { field: string; message: string }[];
  };
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  OnboardingProfile: undefined;
  OnboardingAudioCheck: undefined;
  OnboardingSuccess: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Reading: { storyId?: string };
  Progress: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  StoryDetail: { storyId: string };
  ReadingMode: { storyId: string };
  GenerateStory: undefined;
  ParentDashboard: undefined;
};
