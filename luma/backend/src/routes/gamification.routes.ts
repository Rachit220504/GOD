import { Router } from 'express';
import { gamificationController } from '../modules/gamification/gamification.controller';
import { gamificationEngineController } from '../modules/gamification/gamificationEngine.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all gamification routes
router.use(authenticate);

// ─── Legacy/Existing Routes ───────────────────────────────────────────

/**
 * @route   GET /api/gamification/progress
 * @desc    Get user's complete gamification status
 * @access  Private
 */
router.get('/progress', gamificationController.getProgress);

/**
 * @route   GET /api/gamification/plant
 * @desc    Get user's plant progress only
 * @access  Private
 */
router.get('/plant', gamificationController.getPlantProgress);

/**
 * @route   GET /api/gamification/achievements
 * @desc    Get user's achievements
 * @access  Private
 */
router.get('/achievements', gamificationController.getAchievements);

/**
 * @route   GET /api/gamification/history
 * @desc    Get user's XP history
 * @access  Private
 * @query   limit (optional) - Number of entries to return (default: 20)
 */
router.get('/history', gamificationController.getXPHistory);

// ─── New Gamification Engine Routes ────────────────────────────────────

/**
 * @route   GET /api/gamification/full-state
 * @desc    Get complete state: progress + milestones + themes
 * @access  Private
 */
router.get('/full-state', gamificationEngineController.getFullState);

/**
 * @route   GET /api/gamification/xp-breakdown/:sessionId
 * @desc    Get detailed XP calculation for a session
 * @access  Private
 */
router.get('/xp-breakdown/:sessionId', gamificationEngineController.getXPBreakdown);

/**
 * @route   POST /api/gamification/award-xp
 * @desc    Award XP for completed activity
 * @access  Private
 */
router.post('/award-xp', gamificationEngineController.awardXP);

/**
 * @route   GET /api/gamification/milestones
 * @desc    Get available unclaimed milestones
 * @access  Private
 */
router.get('/milestones', gamificationEngineController.getMilestones);

/**
 * @route   POST /api/gamification/claim/:milestoneId
 * @desc    Claim a milestone reward
 * @access  Private
 */
router.post('/claim/:milestoneId', gamificationEngineController.claimMilestone);

/**
 * @route   GET /api/gamification/themes
 * @desc    Get user's unlocked visual themes
 * @access  Private
 */
router.get('/themes', gamificationEngineController.getThemes);

export { router as gamificationRoutes };
