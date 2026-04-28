import { Router } from 'express';
import { profileController } from './profile.controller';
import {
  updateProfileValidators,
  linkChildValidators,
  userIdParamValidator,
} from './profile.validators';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * @route  GET /api/profile/:userId
 * @desc   Get a user's profile (own, or linked child for parents, any for educators)
 * @access Private
 */
router.get(
  '/:userId',
  userIdParamValidator,
  validate,
  profileController.getProfile.bind(profileController),
);

/**
 * @route  PUT /api/profile/:userId
 * @desc   Update profile & reading comfort settings
 * @access Private (own profile, or parent for child)
 */
router.put(
  '/:userId',
  updateProfileValidators,
  validate,
  profileController.updateProfile.bind(profileController),
);

/**
 * @route  POST /api/profile/link-child
 * @desc   Parent links a child account by email
 * @access Private — PARENT only
 */
router.post(
  '/link-child',
  requireRole('PARENT', 'EDUCATOR'),
  linkChildValidators,
  validate,
  profileController.linkChild.bind(profileController),
);

/**
 * @route  GET /api/profile/my-children
 * @desc   Get all children linked to the authenticated parent
 * @access Private — PARENT only
 */
router.get(
  '/my-children',
  requireRole('PARENT', 'EDUCATOR'),
  profileController.getMyChildren.bind(profileController),
);

export default router;
