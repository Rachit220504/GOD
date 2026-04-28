import { Request, Response, NextFunction } from 'express';
import { ReadingLevel } from '@prisma/client';
import { contentService } from './content.service';

export class ContentController {
  /**
   * POST /api/content/generate-story
   * Generate and persist an AI story.
   */
  async generateStory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topic, readingLevel, ageGroup, maxWords, includeCharacters } = req.body as {
        topic: string;
        readingLevel: ReadingLevel;
        ageGroup?: string;
        maxWords?: number;
        includeCharacters?: string[];
      };

      const story = await contentService.generateStory(req.user!.id, {
        topic,
        readingLevel,
        ageGroup,
        maxWords,
        includeCharacters,
      });

      res.status(201).json({ success: true, data: story });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/content/syllabify
   * Syllabify raw text without persisting.
   */
  async syllabify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = req.body as { text: string };
      const entries = await contentService.syllabifyText(text);
      res.status(200).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/content
   * List published stories with optional filters.
   */
  async listContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query['page'] ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query['limit'] ?? '20'), 10) || 20;
      const readingLevel = req.query['readingLevel']
        ? String(req.query['readingLevel']) as ReadingLevel
        : undefined;
      const search = req.query['search']
        ? String(req.query['search'])
        : undefined;

      const result = await contentService.listContent({ readingLevel, search, page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/content/:id
   * Get a single story by ID.
   */
  async getContentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const content = await contentService.getContentById(id);
      res.status(200).json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/content/:id
   * Archive (soft-delete) a story.
   */
  async archiveContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      await contentService.archiveContent(id, req.user!.id, req.user!.role);
      res.status(200).json({ success: true, message: 'Story archived successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const contentController = new ContentController();
