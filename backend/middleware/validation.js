const { body, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      'errors',
      errors.array().map((err) => err.msg)
    );
    return res.redirect('back');
  }
  next();
};

// Clip validation rules
const validateClip = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters')
    .escape(),
  body('description')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .escape(),
  handleValidationErrors,
];

// Jam validation rules
const validateJam = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters')
    .escape(),
  body('description')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .escape(),
  body('genre')
    .trim()
    .notEmpty()
    .withMessage('Genre is required')
    .isIn(['Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Electronic', 'R&B', 'Country', 'Classical', 'Other'])
    .withMessage('Invalid genre selected'),
  handleValidationErrors,
];

// Comment validation rules
const validateComment = [
  body('commentText')
    .trim()
    .notEmpty()
    .withMessage('Comment cannot be empty')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1-500 characters')
    .escape(),
  handleValidationErrors,
];

// Signup validation rules
const validateSignup = [
  body('userName')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  handleValidationErrors,
];

// File upload validation
const validateFileUpload = (allowedTypes, maxSizeMB = 50) => {
  return (req, res, next) => {
    if (!req.file) {
      req.flash('errors', { msg: 'Please select a file to upload' });
      return res.redirect('back');
    }

    const allowedMimeTypes = {
      audio: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mp4',
        'audio/x-m4a',
      ],
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      all: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mp4',
        'audio/x-m4a',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ],
    };

    const mimeTypes = allowedMimeTypes[allowedTypes] || allowedMimeTypes.all;

    if (!mimeTypes.includes(req.file.mimetype)) {
      req.flash('errors', { msg: `Invalid file type. Allowed: ${allowedTypes}` });
      return res.redirect('back');
    }

    // Check file size (in bytes)
    const maxSize = maxSizeMB * 1024 * 1024;
    if (req.file.size > maxSize) {
      req.flash('errors', { msg: `File too large. Maximum size: ${maxSizeMB}MB` });
      return res.redirect('back');
    }

    next();
  };
};

module.exports = {
  validateClip,
  validateJam,
  validateComment,
  validateSignup,
  validateFileUpload,
  handleValidationErrors,
};
