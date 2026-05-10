import { Router } from 'express';
import { phonicsController } from './phonics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/phonics/lessons
 * @desc   Get all phonics lessons
 * @access Private
 */
router.get('/lessons', phonicsController.getLessons.bind(phonicsController));

/**
 * @route  GET /api/phonics/my-progress
 * @desc   Get current user's phonics progress
 * @access Private
 */
router.get('/my-progress', phonicsController.getMyProgress.bind(phonicsController));

/**
 * @route  POST /api/phonics/practice
 * @desc   Record a phonics practice attempt
 * @access Private
 */
router.post('/practice', phonicsController.recordPractice.bind(phonicsController));

/**
 * @route  POST /api/phonics/seed
 * @desc   Seed default phonics lessons (for initial setup)
 * @access Private
 */
router.post('/seed', phonicsController.seedLessons.bind(phonicsController));

export default router;
