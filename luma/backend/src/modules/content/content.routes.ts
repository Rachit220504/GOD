import { Router } from 'express';
import { contentController } from './content.controller';
import {
  generateStoryValidators,
  syllabifyValidators,
  contentIdParamValidator,
  listContentValidators,
} from './content.validators';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// All content routes require authentication
router.use(authenticate);

/**
 * @route  POST /api/content/generate-story
 * @desc   Generate an AI-powered dyslexia-friendly story
 * @access Private
 */
router.post(
  '/generate-story',
  generateStoryValidators,
  validate,
  contentController.generateStory.bind(contentController),
);

/**
 * @route  POST /api/content/syllabify
 * @desc   Break arbitrary text into syllables using AI
 * @access Private
 */
router.post(
  '/syllabify',
  syllabifyValidators,
  validate,
  contentController.syllabify.bind(contentController),
);

/**
 * @route  GET /api/content
 * @desc   List published stories (with optional readingLevel, search, page, limit filters)
 * @access Private
 */
router.get(
  '/',
  listContentValidators,
  validate,
  contentController.listContent.bind(contentController),
);

/**
 * @route  GET /api/content/:id
 * @desc   Get a single story by ID
 * @access Private
 */
router.get(
  '/:id',
  contentIdParamValidator,
  validate,
  contentController.getContentById.bind(contentController),
);

/**
 * @route  DELETE /api/content/:id
 * @desc   Archive (soft-delete) a story
 * @access Private — creator or EDUCATOR only
 */
router.delete(
  '/:id',
  contentIdParamValidator,
  validate,
  requireRole('PARENT', 'EDUCATOR'),
  contentController.archiveContent.bind(contentController),
);

export default router;
