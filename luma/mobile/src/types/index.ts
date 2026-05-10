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

export interface LinkedChild {
  id: string;
  email: string;
  displayName: string;
  readingLevel: ReadingLevel;
  totalPoints: number;
  currentStreak: number;
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

// ─── Weekly Activity (for Home Screen circles) ────────────────────────────────

export interface DayActivity {
  day: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  label: string; // 'Mon', 'Tue', etc.
  hasRead: boolean;
  isToday: boolean;
}

export interface ContinueReadingStory {
  contentId: string;
  title: string;
  readingLevel: ReadingLevel;
  completionPct: number;
  lastReadAt: string;
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

export interface SkillProgress {
  name: string;
  percentage: number;
  color: string;
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
  skillProgress: SkillProgress[];
  lettersLearned: number;
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
  Phonics: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  StoryDetail: { storyId: string };
  ReadingMode: { storyId: string };
  GenerateStory: undefined;
  ParentDashboard: undefined;
  LinkChild: undefined;
  Phonics: undefined;
};

// ─── Phonics ──────────────────────────────────────────────────────────────────

export interface PhonicsLesson {
  id: string;
  letter: string;
  sound: string;
  examples: string[]; // Correct words that start with the letter sound
  wrongExamples: string[]; // Distractor words for word selection game
  colorTheme: string;
  difficulty: number;
  order: number;
}

export interface PhonicsProgress {
  id: string;
  userId: string;
  lessonId: string;
  attempts: number;
  correctCount: number;
  masteryLevel: number;
  lastPracticedAt: string;
}
