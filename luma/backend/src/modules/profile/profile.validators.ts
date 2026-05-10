import { body, param } from 'express-validator';

export const updateProfileValidators = [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),

  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),

  body('age')
    .optional()
    .isInt({ min: 3, max: 120 })
    .withMessage('Age must be a number between 3 and 120'),

  body('readingLevel')
    .optional()
    .isIn(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('readingLevel must be one of: BEGINNER, ELEMENTARY, INTERMEDIATE, ADVANCED'),

  body('fontSize')
    .optional()
    .isFloat({ min: 12, max: 32 })
    .withMessage('fontSize must be between 12 and 32'),

  body('letterSpacing')
    .optional()
    .isFloat({ min: 0.0, max: 0.25 })
    .withMessage('letterSpacing must be between 0.0 and 0.25 (em)'),

  body('lineHeight')
    .optional()
    .isFloat({ min: 1.0, max: 2.5 })
    .withMessage('lineHeight must be between 1.0 and 2.5'),

  body('backgroundColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('backgroundColor must be a valid hex color (e.g. #FDFBF7)'),

  body('fontFamily')
    .optional()
    .isIn(['Lexend', 'OpenDyslexic', 'OpenDyslexicBold', 'System', 'Roboto_400Regular', 'Roboto_700Bold', 'Arial', 'Verdana'])
    .withMessage('fontFamily must be one of: Lexend, OpenDyslexic, OpenDyslexicBold, System, Roboto_400Regular, Roboto_700Bold, Arial, Verdana'),

  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('avatarUrl must be a valid URL'),
];

export const linkChildValidators = [
  body('childEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('childEmail must be a valid email address'),
];

export const userIdParamValidator = [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
];
