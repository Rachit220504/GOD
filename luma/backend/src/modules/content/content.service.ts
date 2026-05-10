import { ReadingLevel } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { geminiService, StoryGenerationOptions } from '../../services/gemini/geminiService';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentListItem {
  id: string;
  title: string;
  readingLevel: ReadingLevel;
  topic: string | null;
  ageGroup: string | null;
  wordCount: number;
  estimatedMins: number;
  tags: string[];
  createdAt: Date;
}

export interface ContentDetail {
  id: string;
  title: string;
  body: string;
  syllableMap: unknown;
  readingLevel: ReadingLevel;
  topic: string;
  ageGroup: string | null;
  wordCount: number;
  estimatedMins: number;
  tags: string[];
  createdAt: Date;
}

export interface PaginatedContent {
  items: ContentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Content Service ──────────────────────────────────────────────────────────

// ─── Mock Story Generator (Fallback when AI is unavailable) ─────────────────

function generateMockStory(options: StoryGenerationOptions) {
  const { topic, readingLevel, ageGroup } = options;
  const levelName = readingLevel.toLowerCase();

  const mockStories: Record<string, any> = {
    'a brave lion': {
      title: 'The Brave Little Lion',
      body: `Once upon a time, there was a young lion named Leo. Leo was smaller than the other lions, but he had the biggest heart.

One day, while playing near the river, Leo heard a cry for help. A little rabbit had fallen into the water and couldn't swim! Without thinking, Leo jumped in and pulled the rabbit to safety.

The other animals cheered for Leo. "You may be small," said the elephant, "but you are the bravest lion we know!"

From that day on, Leo knew that bravery comes from the heart, not from size. And he lived happily, helping all his friends in the jungle.`,
      tags: ['bravery', 'animals', 'jungle', 'kindness'],
    },
    default: {
      title: `A Wonderful Story About ${topic}`,
      body: `Once upon a time, there was a magical adventure about ${topic}. The hero of our story discovered that with courage and kindness, anything is possible.

Through forests and over mountains, our hero traveled far and wide. Along the way, they met friendly creatures who helped them on their journey.

In the end, the hero learned an important lesson: the greatest adventures are the ones we share with friends. And they all lived happily ever after.`,
      tags: ['adventure', 'magic', 'friendship'],
    },
  };

  const mock = mockStories[topic.toLowerCase()] || mockStories.default;

  // Generate simple syllable map for common words
  const syllableMap = [
    { word: 'once', syllables: ['once'], chunks: ['once'], pronunciation: 'WUNSS' },
    { word: 'upon', syllables: ['up', 'on'], chunks: ['up', 'on'], pronunciation: 'uh-PON' },
    { word: 'time', syllables: ['time'], chunks: ['time'], pronunciation: 'TYME' },
    { word: 'little', syllables: ['lit', 'tle'], chunks: ['lit', 'tle'], pronunciation: 'LIT-ul' },
    { word: 'adventure', syllables: ['ad', 'ven', 'ture'], chunks: ['ad', 'ven', 'ture'], pronunciation: 'ad-VEN-cher' },
    { word: 'discovered', syllables: ['dis', 'cov', 'ered'], chunks: ['dis', 'cov', 'ered'], pronunciation: 'dis-KUV-erd' },
    { word: 'courage', syllables: ['cou', 'rage'], chunks: ['cou', 'rage'], pronunciation: 'KUR-ij' },
    { word: 'kindness', syllables: ['kind', 'ness'], chunks: ['kind', 'ness'], pronunciation: 'KYND-ness' },
    { word: 'happily', syllables: ['hap', 'pi', 'ly'], chunks: ['hap', 'pi', 'ly'], pronunciation: 'HAP-ih-lee' },
  ];

  const words = mock.body.trim().split(/\s+/);
  const wordCount = words.length;
  const wordsPerMinute = readingLevel === 'BEGINNER' ? 50 : readingLevel === 'ELEMENTARY' ? 80 : 120;
  const estimatedReadingMinutes = Math.max(1, Math.round(wordCount / wordsPerMinute));

  return {
    title: mock.title,
    body: mock.body,
    syllableMap,
    wordCount,
    estimatedReadingMinutes,
    readingLevel,
    topic,
    ageGroup: ageGroup || '6-10',
    tags: mock.tags,
  };
}

export class ContentService {
  /**
   * Generate a new AI story and persist it to the database.
   */
  async generateStory(
    requesterId: string,
    options: StoryGenerationOptions,
  ): Promise<ContentDetail> {
    let story;
    try {
      // Try AI generation first
      story = await geminiService.generateStory(options);
      logger.info('Story generated using AI');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // If AI is unavailable or returns invalid data, use mock fallback
      const isServiceError = errorMsg.includes('503') ||
                            errorMsg.includes('404') ||
                            errorMsg.includes('high demand') ||
                            errorMsg.includes('exhausted') ||
                            errorMsg.includes('not found') ||
                            errorMsg.includes('Invalid JSON') ||
                            errorMsg.includes('Parse error') ||
                            errorMsg.includes('malformed');

      if (isServiceError) {
        logger.warn(`AI service error (${errorMsg.substring(0, 100)}), using mock story fallback`);
        story = generateMockStory(options);
      } else {
        throw err;
      }
    }

    const saved = await prisma.generatedContent.create({
      data: {
        createdById: requesterId,
        title: story.title,
        body: story.body,
        syllableMap: story.syllableMap as unknown as object[],
        readingLevel: story.readingLevel,
        topic: story.topic,
        ageGroup: story.ageGroup,
        wordCount: story.wordCount,
        estimatedMins: story.estimatedReadingMinutes,
        tags: story.tags,
        status: 'PUBLISHED',
      },
    });

    logger.info(`Content created: ${saved.id} "${saved.title}"`);

    return {
      id: saved.id,
      title: saved.title,
      body: saved.body,
      syllableMap: saved.syllableMap,
      readingLevel: saved.readingLevel,
      topic: saved.topic ?? '',
      ageGroup: saved.ageGroup,
      wordCount: saved.wordCount,
      estimatedMins: saved.estimatedMins,
      tags: saved.tags,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Syllabify arbitrary text — does NOT persist results.
   */
  async syllabifyText(text: string) {
    return geminiService.syllabifyText(text);
  }

  /**
   * Retrieve a single published story by ID.
   */
  async getContentById(id: string): Promise<ContentDetail> {
    const content = await prisma.generatedContent.findFirst({
      where: { id, status: 'PUBLISHED' },
    });

    if (!content) throw new AppError('Story not found.', 404);

    return {
      id: content.id,
      title: content.title,
      body: content.body,
      syllableMap: content.syllableMap,
      readingLevel: content.readingLevel,
      topic: content.topic ?? '',
      ageGroup: content.ageGroup,
      wordCount: content.wordCount,
      estimatedMins: content.estimatedMins,
      tags: content.tags,
      createdAt: content.createdAt,
    };
  }

  /**
   * List published stories with filtering and pagination.
   */
  async listContent(options: {
    readingLevel?: ReadingLevel;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedContent> {
    const { readingLevel, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = {
      status: 'PUBLISHED' as const,
      ...(readingLevel && { readingLevel }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { topic: { contains: search, mode: 'insensitive' as const } },
          { tags: { has: search.toLowerCase() } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          readingLevel: true,
          topic: true,
          ageGroup: true,
          wordCount: true,
          estimatedMins: true,
          tags: true,
          createdAt: true,
        },
      }),
      prisma.generatedContent.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Soft-delete (archive) a piece of content.
   * Only the creator or an EDUCATOR can archive.
   */
  async archiveContent(
    contentId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    const content = await prisma.generatedContent.findUnique({
      where: { id: contentId },
      select: { createdById: true, status: true },
    });

    if (!content) throw new AppError('Story not found.', 404);

    const isOwner = content.createdById === requesterId;
    const isEducator = requesterRole === 'EDUCATOR';

    if (!isOwner && !isEducator) {
      throw new AppError('You do not have permission to archive this story.', 403);
    }

    await prisma.generatedContent.update({
      where: { id: contentId },
      data: { status: 'ARCHIVED' },
    });

    logger.info(`Content archived: ${contentId} by user ${requesterId}`);
  }
}

export const contentService = new ContentService();
