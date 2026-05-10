import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhonicsLessonResponse {
  id: string;
  letter: string;
  sound: string;
  examples: string[];
  wrongExamples: string[];
  colorTheme: string;
  difficulty: number;
  order: number;
}

export interface PhonicsProgressResponse {
  id: string;
  lessonId: string;
  letter: string;
  sound: string;
  attempts: number;
  correctCount: number;
  masteryLevel: number;
  lastPracticedAt: Date;
}

// ─── Default Phonics Lessons (A-Z) ────────────────────────────────────────────

const DEFAULT_LESSONS = [
  { letter: 'A', sound: 'aa', examples: ['apple', 'ant', 'ax'], wrongExamples: ['ball', 'cat'], colorTheme: '#E8E0FF', difficulty: 1, order: 1 },
  { letter: 'B', sound: 'buh', examples: ['ball', 'bat', 'big'], wrongExamples: ['cat', 'fish', 'dog', 'sun'], colorTheme: '#E8E0FF', difficulty: 1, order: 2 },
  { letter: 'C', sound: 'kuh', examples: ['cat', 'cup', 'car'], wrongExamples: ['bat', 'dog'], colorTheme: '#E0F5E8', difficulty: 1, order: 3 },
  { letter: 'D', sound: 'duh', examples: ['dog', 'day', 'dip'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 1, order: 4 },
  { letter: 'E', sound: 'eh', examples: ['egg', 'elf', 'end'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFF8E0', difficulty: 1, order: 5 },
  { letter: 'F', sound: 'ff', examples: ['fan', 'fun', 'fat'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 6 },
  { letter: 'G', sound: 'guh', examples: ['go', 'gap', 'get'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 1, order: 7 },
  { letter: 'H', sound: 'huh', examples: ['hat', 'hen', 'hi'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 1, order: 8 },
  { letter: 'I', sound: 'ih', examples: ['in', 'igloo', 'if'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFF8E0', difficulty: 1, order: 9 },
  { letter: 'J', sound: 'juh', examples: ['jump', 'jam', 'jet'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 2, order: 10 },
  { letter: 'K', sound: 'kuh', examples: ['kite', 'key', 'kit'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 1, order: 11 },
  { letter: 'L', sound: 'll', examples: ['leg', 'log', 'lip'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 12 },
  { letter: 'M', sound: 'mm', examples: ['man', 'map', 'mat'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 1, order: 13 },
  { letter: 'N', sound: 'nn', examples: ['nap', 'net', 'nod'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 1, order: 14 },
  { letter: 'O', sound: 'ah', examples: ['ox', 'octopus', 'on'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFF8E0', difficulty: 1, order: 15 },
  { letter: 'P', sound: 'puh', examples: ['pen', 'pan', 'pig'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 16 },
  { letter: 'Q', sound: 'kwuh', examples: ['queen', 'quiz', 'quit'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 2, order: 17 },
  { letter: 'R', sound: 'rr', examples: ['run', 'rat', 'red'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 1, order: 18 },
  { letter: 'S', sound: 'ss', examples: ['sun', 'sit', 'sap'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFF8E0', difficulty: 1, order: 19 },
  { letter: 'T', sound: 'tuh', examples: ['top', 'tap', 'ten'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 20 },
  { letter: 'U', sound: 'uh', examples: ['up', 'under', 'ugly'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 1, order: 21 },
  { letter: 'V', sound: 'vv', examples: ['van', 'vet', 'vote'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFE8F0', difficulty: 2, order: 22 },
  { letter: 'W', sound: 'wuh', examples: ['wet', 'win', 'wag'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 23 },
  { letter: 'X', sound: 'ks', examples: ['box', 'fox', 'six'], wrongExamples: ['bat', 'cat'], colorTheme: '#E8E0FF', difficulty: 2, order: 24 },
  { letter: 'Y', sound: 'yuh', examples: ['yes', 'yell', 'yam'], wrongExamples: ['bat', 'cat'], colorTheme: '#FFF8E0', difficulty: 1, order: 25 },
  { letter: 'Z', sound: 'zz', examples: ['zip', 'zap', 'zoo'], wrongExamples: ['bat', 'cat'], colorTheme: '#E0F5E8', difficulty: 1, order: 26 },
];

// ─── Phonics Service ──────────────────────────────────────────────────────────

export class PhonicsService {
  /**
   * Ensure default phonics lessons exist in the database.
   */
  async seedLessons(): Promise<void> {
    const existing = await prisma.phonicsLesson.count();
    if (existing > 0) {
      logger.info('Phonics lessons already seeded');
      return;
    }

    for (const lesson of DEFAULT_LESSONS) {
      await prisma.phonicsLesson.create({ data: lesson });
    }

    logger.info(`Seeded ${DEFAULT_LESSONS.length} phonics lessons`);
  }

  /**
   * Get all phonics lessons (ordered).
   */
  async getAllLessons(): Promise<PhonicsLessonResponse[]> {
    const lessons = await prisma.phonicsLesson.findMany({
      orderBy: { order: 'asc' },
    });

    return lessons.map((l) => ({
      id: l.id,
      letter: l.letter,
      sound: l.sound,
      examples: l.examples,
      wrongExamples: l.wrongExamples,
      colorTheme: l.colorTheme,
      difficulty: l.difficulty,
      order: l.order,
    }));
  }

  /**
   * Get user's phonics progress with lesson details.
   */
  async getUserProgress(userId: string): Promise<PhonicsProgressResponse[]> {
    const progress = await prisma.phonicsProgress.findMany({
      where: { userId },
      include: { lesson: true },
      orderBy: { lastPracticedAt: 'desc' },
    });

    return progress.map((p) => ({
      id: p.id,
      lessonId: p.lessonId,
      letter: p.lesson.letter,
      sound: p.lesson.sound,
      attempts: p.attempts,
      correctCount: p.correctCount,
      masteryLevel: p.masteryLevel,
      lastPracticedAt: p.lastPracticedAt,
    }));
  }

  /**
   * Record a phonics practice attempt.
   */
  async recordPractice(
    userId: string,
    lessonId: string,
    correct: boolean,
  ): Promise<{ id: string; attempts: number; correctCount: number; masteryLevel: number }> {
    const lesson = await prisma.phonicsLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new AppError('Phonics lesson not found', 404);

    // Get or create progress record
    let progress = await prisma.phonicsProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!progress) {
      progress = await prisma.phonicsProgress.create({
        data: {
          userId,
          lessonId,
          attempts: 0,
          correctCount: 0,
          masteryLevel: 0,
        },
      });
    }

    // Update progress
    const newAttempts = progress.attempts + 1;
    const newCorrectCount = progress.correctCount + (correct ? 1 : 0);
    const newMasteryLevel = Math.min(100, Math.round((newCorrectCount / newAttempts) * 100));

    const updated = await prisma.phonicsProgress.update({
      where: { id: progress.id },
      data: {
        attempts: newAttempts,
        correctCount: newCorrectCount,
        masteryLevel: newMasteryLevel,
        lastPracticedAt: new Date(),
      },
    });

    logger.info(`Phonics practice recorded: user=${userId}, lesson=${lessonId}, correct=${correct}`);

    return {
      id: updated.id,
      attempts: updated.attempts,
      correctCount: updated.correctCount,
      masteryLevel: updated.masteryLevel,
    };
  }
}

export const phonicsService = new PhonicsService();
