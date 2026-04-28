import { body } from 'express-validator';

export const registerValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['CHILD', 'PARENT', 'EDUCATOR'])
    .withMessage('Role must be one of: CHILD, PARENT, EDUCATOR'),

  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),

  body('age')
    .optional()
    .isInt({ min: 3, max: 120 })
    .withMessage('Age must be a number between 3 and 120'),
];

export const loginValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidators = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
