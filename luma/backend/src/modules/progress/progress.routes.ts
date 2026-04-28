import { Router } from 'express';
import { progressController } from './progress.controller';
import {
  createSessionValidators,
  userIdParamValidator,
  progressQueryValidators,
} from './progress.validators';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @route  POST /api/progress/session
 * @desc   Record a reading session for the authenticated user
 * @access Private
 */
router.post(
  '/session',
  createSessionValidators,
  validate,
  progressController.createSession.bind(progressController),
);

/**
 * @route  GET /api/progress/:userId
 * @desc   Get progress stats for a user (self, linked child, or any as EDUCATOR)
 * @access Private
 * @query  from, to (ISO 8601), page, limit
 */
router.get(
  '/:userId',
  userIdParamValidator,
  progressQueryValidators,
  validate,
  progressController.getUserProgress.bind(progressController),
);

export default router;
