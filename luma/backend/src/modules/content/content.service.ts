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

export class ContentService {
  /**
   * Generate a new AI story and persist it to the database.
   */
  async generateStory(
    requesterId: string,
    options: StoryGenerationOptions,
  ): Promise<ContentDetail> {
    // Check AI health before burning generation quota
    const aiReady = await geminiService.ping();
    if (!aiReady) {
      throw new AppError('AI service is temporarily unavailable. Please try again shortly.', 503);
    }

    const story = await geminiService.generateStory(options);

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
