import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import { gamificationService } from '../gamification/gamification.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  contentId: string;
  wordsRead: number;
  wordsPerMinute: number;
  accuracyPercent: number;
  completionPct: number;
  durationSeconds: number;
  helpRequestCount?: number;
  // Reading comfort snapshot
  fontSizeUsed?: number;
  letterSpacingUsed?: number;
  lineHeightUsed?: number;
  backgroundColorUsed?: string;
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
  helpRequestCount: number;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface SkillProgress {
  name: string;
  percentage: number;
  color: string;
}

export interface UserProgressStats {
  totalSessions: number;
  totalReadingSeconds: number;
  totalWordsRead: number;
  avgWordsPerMinute: number;
  avgAccuracyPercent: number;
  avgCompletionPct: number;
  booksCompleted: number;   // sessions where completionPct === 100
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  recentSessions: SessionSummary[];
  // Weekly breakdown (last 7 days)
  weeklyActivity: { date: string; minutes: number; wordsRead: number }[];
  // Skill progress for reading development
  skillProgress: SkillProgress[];
  // Letters learned count
  lettersLearned: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPointsForSession(session: CreateSessionInput): number {
  // Base: 1 point per 10 words read
  let points = Math.floor(session.wordsRead / 10);
  // Accuracy bonus: +10 pts if ≥ 90%
  if (session.accuracyPercent >= 90) points += 10;
  // Completion bonus: +15 pts for full completion
  if (session.completionPct >= 100) points += 15;
  // Speed bonus: +5 pts if WPM ≥ 80
  if (session.wordsPerMinute >= 80) points += 5;
  return Math.max(0, points);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

// ─── Progress Service ─────────────────────────────────────────────────────────

export class ProgressService {
  /**
   * Record a completed (or partial) reading session and update profile stats.
   */
  async createSession(
    userId: string,
    input: CreateSessionInput,
  ): Promise<SessionSummary> {
    // Verify content exists
    const content = await prisma.generatedContent.findUnique({
      where: { id: input.contentId },
      select: { id: true, title: true, status: true },
    });
    if (!content || content.status !== 'PUBLISHED') {
      throw new AppError('Content not found or unavailable.', 404);
    }

    const now = new Date();

    // Persist session
    const session = await prisma.sessionProgress.create({
      data: {
        userId,
        contentId: input.contentId,
        wordsRead: input.wordsRead,
        wordsPerMinute: input.wordsPerMinute,
        accuracyPercent: input.accuracyPercent,
        completionPct: input.completionPct,
        durationSeconds: input.durationSeconds,
        helpRequestCount: input.helpRequestCount ?? 0,
        fontSizeUsed: input.fontSizeUsed ?? null,
        letterSpacingUsed: input.letterSpacingUsed ?? null,
        lineHeightUsed: input.lineHeightUsed ?? null,
        backgroundColorUsed: input.backgroundColorUsed ?? null,
        finishedAt: now,
      },
    });

    // Update profile stats atomically
    const earnedPoints = calcPointsForSession(input);
    const isCompleted = input.completionPct >= 100;

    await prisma.profile.update({
      where: { userId },
      data: {
        totalPoints: { increment: earnedPoints },
        ...(isCompleted && { booksCompleted: { increment: 1 } }),
      },
    });

    // Award XP using new Gamification Engine with detailed breakdown
    try {
      const { gamificationEngine } = await import('../gamification/gamificationEngine.service');
      const xpResult = await gamificationEngine.awardXPWithBreakdown(
        userId,
        session.id,
        'reading_session'
      );
      
      logger.info(
        `Gamification XP awarded: user=${userId}, total=${xpResult.breakdown.totalXP}, ` +
        `base=${xpResult.breakdown.baseXP}, accuracy=${xpResult.breakdown.accuracyBonus}, ` +
        `streak=${xpResult.breakdown.streakBonus}, speed=${xpResult.breakdown.speedBonus}` +
        `${xpResult.plantGrew ? `, PLANT GREW to ${xpResult.newStage}!` : ''}`
      );
    } catch (error) {
      logger.warn('Failed to award gamification XP:', error);
      // Don't fail the session if gamification fails
    }

    // Update streak (if session happened today, increment; else reset if gap > 1 day)
    await this.updateStreak(userId);

    logger.info(
      `Session saved: user=${userId}, content=${input.contentId}, ` +
      `wpm=${input.wordsPerMinute}, accuracy=${input.accuracyPercent}%, ` +
      `points+${earnedPoints}`,
    );

    return {
      id: session.id,
      contentId: session.contentId,
      contentTitle: content.title,
      wordsRead: session.wordsRead,
      wordsPerMinute: session.wordsPerMinute,
      accuracyPercent: session.accuracyPercent,
      completionPct: session.completionPct,
      durationSeconds: session.durationSeconds,
      helpRequestCount: session.helpRequestCount,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
    };
  }

  /**
   * Get comprehensive progress statistics for a user.
   */
  async getUserProgress(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
    filters: { from?: string; to?: string; page?: number; limit?: number },
  ): Promise<UserProgressStats> {
    // Access control
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const { from, to, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };

    const [sessions, profile] = await Promise.all([
      prisma.sessionProgress.findMany({
        where: {
          userId: targetUserId,
          ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
        },
        include: { content: { select: { title: true } } },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: {
          totalPoints: true,
          currentStreak: true,
          longestStreak: true,
          booksCompleted: true,
        },
      }),
    ]);

    // Aggregate stats from ALL sessions (not just paginated)
    const allSessions = await prisma.sessionProgress.findMany({
      where: {
        userId: targetUserId,
        ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
      },
      select: {
        wordsRead: true,
        wordsPerMinute: true,
        accuracyPercent: true,
        completionPct: true,
        durationSeconds: true,
        startedAt: true,
      },
    });

    const totalSessions = allSessions.length;
    const totalReadingSeconds = allSessions.reduce((s, r) => s + r.durationSeconds, 0);
    const totalWordsRead = allSessions.reduce((s, r) => s + r.wordsRead, 0);
    const avgWordsPerMinute =
      totalSessions > 0
        ? allSessions.reduce((s, r) => s + r.wordsPerMinute, 0) / totalSessions
        : 0;
    const avgAccuracyPercent =
      totalSessions > 0
        ? allSessions.reduce((s, r) => s + r.accuracyPercent, 0) / totalSessions
        : 0;
    const avgCompletionPct =
      totalSessions > 0
        ? allSessions.reduce((s, r) => s + r.completionPct, 0) / totalSessions
        : 0;

    // Weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyMap = new Map<string, { minutes: number; wordsRead: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weeklyMap.set(formatDate(d), { minutes: 0, wordsRead: 0 });
    }

    for (const s of allSessions) {
      if (s.startedAt >= sevenDaysAgo) {
        const key = formatDate(s.startedAt);
        const existing = weeklyMap.get(key);
        if (existing) {
          existing.minutes += Math.round(s.durationSeconds / 60);
          existing.wordsRead += s.wordsRead;
        }
      }
    }

    const weeklyActivity = Array.from(weeklyMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentSessions: SessionSummary[] = sessions.map((s) => ({
      id: s.id,
      contentId: s.contentId,
      contentTitle: s.content.title,
      wordsRead: s.wordsRead,
      wordsPerMinute: s.wordsPerMinute,
      accuracyPercent: s.accuracyPercent,
      completionPct: s.completionPct,
      durationSeconds: s.durationSeconds,
      helpRequestCount: s.helpRequestCount,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
    }));

    // Calculate skill progress based on reading metrics
    const skillProgress: SkillProgress[] = [
      {
        name: 'Letter Recognition',
        percentage: Math.min(100, Math.round((totalSessions > 0 ? 70 + (avgAccuracyPercent / 100) * 30 : 0))),
        color: '#6C5CE7', // purple
      },
      {
        name: 'Sound Blending',
        percentage: Math.min(100, Math.round((totalSessions > 0 ? 50 + (avgWordsPerMinute / 150) * 50 : 0))),
        color: '#00B894', // green
      },
      {
        name: 'Syllable Awareness',
        percentage: Math.min(100, Math.round((totalSessions > 0 ? 30 + (totalWordsRead / 1000) * 70 : 0))),
        color: '#E84393', // pink
      },
      {
        name: 'Reading Fluency',
        percentage: Math.min(100, Math.round((totalSessions > 0 ? 40 + (avgCompletionPct / 100) * 60 : 0))),
        color: '#E17055', // orange
      },
    ];

    // Get letters learned from phonics progress
    const phonicsProgressCount = await prisma.phonicsProgress.count({
      where: { userId: targetUserId },
    });
    const lettersLearned = phonicsProgressCount;

    return {
      totalSessions,
      totalReadingSeconds,
      totalWordsRead,
      avgWordsPerMinute: Math.round(avgWordsPerMinute * 10) / 10,
      avgAccuracyPercent: Math.round(avgAccuracyPercent * 10) / 10,
      avgCompletionPct: Math.round(avgCompletionPct * 10) / 10,
      booksCompleted: profile?.booksCompleted ?? 0,
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      totalPoints: profile?.totalPoints ?? 0,
      recentSessions,
      weeklyActivity,
      skillProgress,
      lettersLearned,
    };
  }

  // ─── Streak Logic ───────────────────────────────────────────────────────────

  private async updateStreak(userId: string): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    });
    if (!profile) return;

    // Find last session before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastSession = await prisma.sessionProgress.findFirst({
      where: {
        userId,
        startedAt: { lt: today },
      },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    });

    let newStreak = profile.currentStreak;

    if (!lastSession) {
      // First ever session
      newStreak = 1;
    } else {
      const lastDate = new Date(lastSession.startedAt);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        // Consecutive day
        newStreak = profile.currentStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // diffDays === 0 means same day, don't change streak
    }

    const newLongest = Math.max(newStreak, profile.longestStreak);

    await prisma.profile.update({
      where: { userId },
      data: { currentStreak: newStreak, longestStreak: newLongest },
    });
  }

  /**
   * Get weekly reading activity (Mon-Sun) for the day circles UI.
   */
  async getWeeklyActivity(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{ day: string; label: string; hasRead: boolean; isToday: boolean }[]> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay(); // 0 = Sunday

    // Get sessions from the past 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const sessions = await prisma.sessionProgress.findMany({
      where: {
        userId: targetUserId,
        startedAt: { gte: sevenDaysAgo },
      },
      select: { startedAt: true },
    });

    // Build day-by-day activity
    const activity: { day: string; label: string; hasRead: boolean; isToday: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // Start from Monday of current week
      d.setHours(0, 0, 0, 0);

      const dayIndex = d.getDay();
      const isToday = d.getTime() === today.getTime();

      // Check if user read on this day
      const hasRead = sessions.some((s) => {
        const sDate = new Date(s.startedAt);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === d.getTime();
      });

      activity.push({
        day: days[dayIndex]!,
        label: dayLabels[dayIndex]!,
        hasRead,
        isToday,
      });
    }

    return activity;
  }

  /**
   * Get the story to continue reading (most recent incomplete session).
   */
  async getContinueReading(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{
    contentId: string;
    title: string;
    completionPct: number;
    lastReadAt: Date;
  } | null> {
    await this.assertAccess(targetUserId, requesterId, requesterRole);

    // Find most recent incomplete session (< 100% completion)
    const incompleteSession = await prisma.sessionProgress.findFirst({
      where: {
        userId: targetUserId,
        completionPct: { lt: 100 },
      },
      orderBy: { startedAt: 'desc' },
      include: { content: { select: { title: true } } },
    });

    if (!incompleteSession) return null;

    return {
      contentId: incompleteSession.contentId,
      title: incompleteSession.content.title,
      completionPct: incompleteSession.completionPct,
      lastReadAt: incompleteSession.startedAt,
    };
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
    throw new AppError('You do not have permission to view this progress data.', 403);
  }
}

export const progressService = new ProgressService();
