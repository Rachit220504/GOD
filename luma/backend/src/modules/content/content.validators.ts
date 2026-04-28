import { body, param, query } from 'express-validator';

export const generateStoryValidators = [
  body('topic')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('topic must be between 2 and 100 characters'),

  body('readingLevel')
    .isIn(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('readingLevel must be one of: BEGINNER, ELEMENTARY, INTERMEDIATE, ADVANCED'),

  body('ageGroup')
    .optional()
    .matches(/^\d{1,2}-\d{1,2}$/)
    .withMessage('ageGroup must be in format "7-10"'),

  body('maxWords')
    .optional()
    .isInt({ min: 50, max: 600 })
    .withMessage('maxWords must be between 50 and 600'),

  body('includeCharacters')
    .optional()
    .isArray({ max: 5 })
    .withMessage('includeCharacters must be an array with at most 5 items'),

  body('includeCharacters.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each character name must be between 1 and 30 characters'),
];

export const syllabifyValidators = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('text must be between 1 and 5000 characters'),
];

export const contentIdParamValidator = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Content id is required')
    .custom((value) => {
      // Allow either a standard UUID or your specific seed ID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      const isSeed = value.startsWith('seed-story-');

      if (!isUUID && !isSeed) {
        throw new Error('Content id must be a valid UUID');
      }
      return true;
    }),
];

export const listContentValidators = [
  query('readingLevel')
    .optional()
    .isIn(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Invalid readingLevel filter'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search query must not exceed 100 characters'),
];
