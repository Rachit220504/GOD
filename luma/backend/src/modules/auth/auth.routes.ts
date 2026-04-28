import { Router } from 'express';
import { authController } from './auth.controller';
import {
  registerValidators,
  loginValidators,
  refreshValidators,
} from './auth.validators';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user (child, parent, or educator)
 * @access Public
 */
router.post(
  '/register',
  registerValidators,
  validate,
  authController.register.bind(authController),
);

/**
 * @route  POST /api/auth/login
 * @desc   Authenticate user and receive JWT tokens
 * @access Public
 */
router.post(
  '/login',
  loginValidators,
  validate,
  authController.login.bind(authController),
);

/**
 * @route  POST /api/auth/refresh
 * @desc   Exchange a refresh token for new access + refresh tokens
 * @access Public
 */
router.post(
  '/refresh',
  refreshValidators,
  validate,
  authController.refresh.bind(authController),
);

/**
 * @route  GET /api/auth/me
 * @desc   Get current authenticated user
 * @access Private
 */
router.get('/me', authenticate, authController.me.bind(authController));

/**
 * @route  POST /api/auth/logout
 * @desc   Invalidate session (client must discard tokens)
 * @access Private
 */
router.post('/logout', authController.logout.bind(authController));
export default router;
