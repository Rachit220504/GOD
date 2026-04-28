import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { param } from 'express-validator';
import { validate } from '../../middleware/validate';

const router = Router();
const userIdParam = [param('userId').isUUID().withMessage('userId must be a valid UUID')];

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/:userId/summary
 * Overall reading summary — accessible by self, parent of child, educator
 */
router.get('/:userId/summary', userIdParam, validate, analyticsController.getSummary.bind(analyticsController));

/**
 * GET /api/analytics/:userId/skills
 * Phonics, fluency, comprehension scores + trends
 */
router.get('/:userId/skills', userIdParam, validate, analyticsController.getSkills.bind(analyticsController));

/**
 * GET /api/analytics/:userId/history?page=1&limit=10
 * Paginated session history
 */
router.get('/:userId/history', userIdParam, validate, analyticsController.getHistory.bind(analyticsController));

/**
 * GET /api/analytics/:userId/tips
 * AI-generated personalised reading tips (PARENT / EDUCATOR only)
 */
router.get(
  '/:userId/tips',
  userIdParam,
  validate,
  requireRole('PARENT', 'EDUCATOR'),
  analyticsController.getTips.bind(analyticsController),
);

export { router as analyticsRouter };
