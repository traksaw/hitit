/**
 * File upload validation middleware
 * Validates file type, size, and presence for audio and image uploads
 */

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/x-wav',
  'audio/x-m4a',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate audio file upload
 */
const validateAudioUpload = (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      message: 'Please select an audio file to upload',
    });
  }

  const file = req.file;

  // Validate file type by MIME type
  if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Please upload a valid audio file (MP3, WAV, OGG, or WebM)',
      receivedType: file.mimetype,
    });
  }

  // Validate file extension as backup
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ['mp3', 'wav', 'ogg', 'webm', 'm4a'];
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file extension',
      message: `File extension .${fileExt} is not allowed. Use: ${allowedExtensions.join(', ')}`,
    });
  }

  // Validate file size
  if (file.size > MAX_AUDIO_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: `Audio file must be less than ${MAX_AUDIO_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      maxSize: MAX_AUDIO_SIZE,
      actualSize: file.size,
    });
  }

  // File is valid, continue
  next();
};

/**
 * Validate image file upload
 */
const validateImageUpload = (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      message: 'Please select an image file to upload',
    });
  }

  const file = req.file;

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
      receivedType: file.mimetype,
    });
  }

  // Validate file extension
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file extension',
      message: `File extension .${fileExt} is not allowed. Use: ${allowedExtensions.join(', ')}`,
    });
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'File too large',
      message: `Image file must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      maxSize: MAX_IMAGE_SIZE,
      actualSize: file.size,
    });
  }

  // File is valid, continue
  next();
};

/**
 * Handle Cloudinary upload errors with detailed messages
 */
const handleCloudinaryError = (error) => {
  console.error('Cloudinary upload error:', error);

  // Cloudinary-specific error handling
  if (error.http_code === 400) {
    return {
      success: false,
      error: 'Invalid file format',
      message: 'The file format is not supported by our storage service',
    };
  }

  if (error.http_code === 401) {
    return {
      success: false,
      error: 'Storage authentication failed',
      message: 'There was an issue with our file storage service. Please try again later.',
    };
  }

  if (error.http_code === 420) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many uploads. Please wait a moment and try again.',
    };
  }

  if (error.message && error.message.includes('File size too large')) {
    return {
      success: false,
      error: 'File too large',
      message: 'The file exceeds the maximum allowed size',
    };
  }

  // Generic error
  return {
    success: false,
    error: 'Upload failed',
    message: 'Failed to upload file. Please try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
};

module.exports = {
  validateAudioUpload,
  validateImageUpload,
  handleCloudinaryError,
};
