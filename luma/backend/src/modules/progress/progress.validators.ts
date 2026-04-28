import { body, param, query } from 'express-validator';

export const createSessionValidators = [
  body('contentId')
    .isUUID()
    .withMessage('contentId must be a valid UUID'),

  body('wordsRead')
    .isInt({ min: 0 })
    .withMessage('wordsRead must be a non-negative integer'),

  body('wordsPerMinute')
    .isFloat({ min: 0, max: 500 })
    .withMessage('wordsPerMinute must be between 0 and 500'),

  body('accuracyPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('accuracyPercent must be between 0 and 100'),

  body('completionPct')
    .isFloat({ min: 0, max: 100 })
    .withMessage('completionPct must be between 0 and 100'),

  body('durationSeconds')
    .isInt({ min: 0 })
    .withMessage('durationSeconds must be a non-negative integer'),

  body('helpRequestCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('helpRequestCount must be a non-negative integer'),

  // Optional reading comfort snapshot
  body('fontSizeUsed')
    .optional()
    .isFloat({ min: 12, max: 32 })
    .withMessage('fontSizeUsed must be between 12 and 32'),

  body('letterSpacingUsed')
    .optional()
    .isFloat({ min: 0, max: 0.25 })
    .withMessage('letterSpacingUsed must be between 0 and 0.25'),

  body('lineHeightUsed')
    .optional()
    .isFloat({ min: 1, max: 2.5 })
    .withMessage('lineHeightUsed must be between 1 and 2.5'),

  body('backgroundColorUsed')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('backgroundColorUsed must be a valid hex color'),
];

export const userIdParamValidator = [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
];

export const progressQueryValidators = [
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be a valid ISO 8601 date'),

  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be a valid ISO 8601 date'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];
