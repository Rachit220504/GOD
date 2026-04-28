import { prisma } from '../../config/database';
import { geminiService } from '../../services/gemini/geminiService';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  phonicsScore: number;       // 0–100, derived from accuracy
  comprehensionScore: number; // 0–100, derived from completion pct
  fluencyScore: number;       // 0–100, derived from wpm relative to level
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

// ─── Analytics Service ────────────────────────────────────────────────────────

export class AnalyticsService {
  /**
   * Comprehensive progress summary for a child or self.
   */
  async getSummary(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<ProgressSummary> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const [sessions, profile] = await Promise.all([
      prisma.sessionProgress.findMany({
        where: { userId: targetUserId },
        select: {
          wordsRead: true,
          wordsPerMinute: true,
          accuracyPercent: true,
          completionPct: true,
          durationSeconds: true,
          startedAt: true,
        },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: {
          currentStreak: true, longestStreak: true,
          totalPoints: true, booksCompleted: true,
        },
      }),
    ]);

    const total = sessions.length;
    const totalSecs = sessions.reduce((s, r) => s + r.durationSeconds, 0);
    const avgWpm = total > 0 ? sessions.reduce((s, r) => s + r.wordsPerMinute, 0) / total : 0;
    const avgAcc = total > 0 ? sessions.reduce((s, r) => s + r.accuracyPercent, 0) / total : 0;
    const avgComp = total > 0 ? sessions.reduce((s, r) => s + r.completionPct, 0) / total : 0;

    // Weekly activity (last 7 days)
    const weeklyActivity = this.buildWeeklyActivity(sessions);

    // Monthly progress (last 4 weeks as weekly buckets)
    const monthlyProgress = this.buildMonthlyProgress(sessions);

    return {
      totalSessions: total,
      totalReadingSeconds: totalSecs,
      avgWordsPerMinute: Math.round(avgWpm * 10) / 10,
      avgAccuracyPercent: Math.round(avgAcc * 10) / 10,
      avgCompletionPct: Math.round(avgComp * 10) / 10,
      booksCompleted: profile?.booksCompleted ?? 0,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
      weeklyActivity,
      monthlyProgress,
    };
  }

  /**
   * Skills breakdown — phonics, fluency, comprehension with trend.
   */
  async getSkills(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<SkillsData> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const sessions = await prisma.sessionProgress.findMany({
      where: { userId: targetUserId },
      select: {
        accuracyPercent: true,
        wordsPerMinute: true,
        completionPct: true,
        helpRequestCount: true,
        startedAt: true,
      },
      orderBy: { startedAt: 'asc' },
      take: 50,
    });

    if (sessions.length === 0) {
      return {
        phonicsScore: 0, comprehensionScore: 0, fluencyScore: 0,
        weakAreas: [], strongAreas: [],
        skillTrend: [],
      };
    }

    // Derive scores from session metrics
    const avgAccuracy = sessions.reduce((s, r) => s + r.accuracyPercent, 0) / sessions.length;
    const avgWpm = sessions.reduce((s, r) => s + r.wordsPerMinute, 0) / sessions.length;
    const avgCompletion = sessions.reduce((s, r) => s + r.completionPct, 0) / sessions.length;

    // Phonics = accuracy proxy
    const phonicsScore = Math.round(avgAccuracy);
    // Fluency = WPM normalised to 0–100 (target 120 wpm = 100%)
    const fluencyScore = Math.min(100, Math.round((avgWpm / 120) * 100));
    // Comprehension = completion pct proxy
    const comprehensionScore = Math.round(avgCompletion);

    const weakAreas: string[] = [];
    const strongAreas: string[] = [];
    if (phonicsScore < 70) weakAreas.push('Phonics & Word Recognition');
    else strongAreas.push('Phonics & Word Recognition');
    if (fluencyScore < 60) weakAreas.push('Reading Speed & Fluency');
    else strongAreas.push('Reading Speed & Fluency');
    if (comprehensionScore < 75) weakAreas.push('Story Comprehension');
    else strongAreas.push('Story Comprehension');

    // Skill trend (last 10 sessions)
    const skillTrend = sessions.slice(-10).map((s) => ({
      date: s.startedAt.toISOString().split('T')[0]!,
      phonics: Math.round(s.accuracyPercent),
      fluency: Math.min(100, Math.round((s.wordsPerMinute / 120) * 100)),
      comprehension: Math.round(s.completionPct),
    }));

    return { phonicsScore, comprehensionScore, fluencyScore, weakAreas, strongAreas, skillTrend };
  }

  /**
   * Paginated session history.
   */
  async getHistory(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedHistory> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.sessionProgress.findMany({
        where: { userId: targetUserId },
        include: { content: { select: { title: true, readingLevel: true } } },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sessionProgress.count({ where: { userId: targetUserId } }),
    ]);

    return {
      items: sessions.map((s) => ({
        id: s.id,
        contentTitle: s.content.title,
        readingLevel: s.content.readingLevel,
        wordsRead: s.wordsRead,
        wordsPerMinute: s.wordsPerMinute,
        accuracyPercent: s.accuracyPercent,
        completionPct: s.completionPct,
        durationSeconds: s.durationSeconds,
        helpRequestCount: s.helpRequestCount,
        startedAt: s.startedAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * AI-generated personalised reading tips.
   */
  async getReadingTips(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<ReadingTips> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const [profile, recentSessions] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: { readingLevel: true, currentStreak: true, booksCompleted: true, displayName: true },
      }),
      prisma.sessionProgress.findMany({
        where: { userId: targetUserId },
        select: { accuracyPercent: true, wordsPerMinute: true, completionPct: true },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

    const avgAcc = recentSessions.length > 0
      ? recentSessions.reduce((s, r) => s + r.accuracyPercent, 0) / recentSessions.length : 0;
    const avgWpm = recentSessions.length > 0
      ? recentSessions.reduce((s, r) => s + r.wordsPerMinute, 0) / recentSessions.length : 0;

    const general = [
      'Read together for 10–15 minutes every day.',
      'Celebrate every story completed — no matter how small!',
      'Let your child choose the story topic when possible.',
      'Use the Word Breakdown feature for tricky words.',
      'Consistency is more important than duration.',
    ];

    // Try AI-personalised tips (graceful fallback)
    let personalized: string[] = [];
    try {
      const prompt = `
You are a dyslexia reading specialist giving advice to a parent.
Child reading level: ${profile?.readingLevel ?? 'ELEMENTARY'}
Average accuracy: ${Math.round(avgAcc)}%
Average words per minute: ${Math.round(avgWpm)}
Current streak: ${profile?.currentStreak ?? 0} days
Books completed: ${profile?.booksCompleted ?? 0}

Generate exactly 4 short, friendly, actionable reading tips personalised for this child's situation.
Return ONLY a JSON array of 4 strings. No markdown, no preamble.
Example: ["Tip one here.", "Tip two here.", "Tip three here.", "Tip four here."]
`.trim();

      const result = await geminiService['model'].generateContent(prompt);
      const text = result.response.text().replace(/```json\s*/i, '').replace(/```\s*/i, '').trim();
      const parsed = JSON.parse(text) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        personalized = parsed.map((t) => String(t));
      }
    } catch {
      logger.warn('AI tips generation fell back to defaults');
      personalized = [
        `Focus on ${avgAcc < 70 ? 'accuracy — slow down and sound out each word' : 'maintaining your great accuracy'}.`,
        `${avgWpm < 60 ? 'Try reading aloud to build confidence and speed.' : 'Great reading speed! Try harder books next.'}`,
        `${(profile?.currentStreak ?? 0) > 3 ? 'Amazing streak! Keep the daily habit going.' : 'Try to read a little every day to build a streak.'}`,
        'Use the syllable breakdown feature whenever a word feels tricky.',
      ];
    }

    return { general, personalized, generatedAt: new Date().toISOString() };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private buildWeeklyActivity(
    sessions: { startedAt: Date; durationSeconds: number; wordsRead: number }[],
  ) {
    const map = new Map<string, { minutes: number; wordsRead: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().split('T')[0]!, { minutes: 0, wordsRead: 0 });
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    for (const s of sessions) {
      if (s.startedAt >= cutoff) {
        const key = s.startedAt.toISOString().split('T')[0]!;
        const existing = map.get(key);
        if (existing) {
          existing.minutes += Math.round(s.durationSeconds / 60);
          existing.wordsRead += s.wordsRead;
        }
      }
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildMonthlyProgress(
    sessions: { startedAt: Date; wordsPerMinute: number; accuracyPercent: number }[],
  ) {
    const weeks: Record<string, { wpmSum: number; accSum: number; count: number }> = {};
    for (const s of sessions) {
      const d = new Date(s.startedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0]!;
      if (!weeks[key]) weeks[key] = { wpmSum: 0, accSum: 0, count: 0 };
      weeks[key].wpmSum += s.wordsPerMinute;
      weeks[key].accSum += s.accuracyPercent;
      weeks[key].count++;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, v]) => ({
        week,
        avgWpm: Math.round(v.wpmSum / v.count),
        avgAccuracy: Math.round(v.accSum / v.count),
      }));
  }

  private async assertAccess(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    if (targetUserId === requesterId) return;
    if (requesterRole === 'EDUCATOR') return;
    if (requesterRole === 'PARENT') {
      const link = await prisma.childProfile.findFirst({
        where: { parentId: requesterId, childId: targetUserId },
      });
      if (link) return;
    }
    throw new AppError('Access denied to this analytics data.', 403);
  }
}

export const analyticsService = new AnalyticsService();
