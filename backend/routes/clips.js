const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const clipsController = require('../controllers/clips');
const { ensureAuth, ensureGuest } = require('../middleware/auth');
const {
  validateClip,
  validateJam,
  validateComment,
  validateFileUpload,
} = require('../middleware/validation');
const { uploadLimiter, actionLimiter } = require('../middleware/rateLimiter');
const {
  ensureOwner,
  ensureCanEdit,
  ensureCanContribute,
  ensureCanView,
} = require('../middleware/jamPermissions');

//Post Routes - simplified for now
// router.get("/:id", ensureAuth, clipsController.getPost);
router.get('/jamFeed', ensureAuth, clipsController.getJamFeed);

router.get('/jam/:id', clipsController.getJam);
// API endpoint for Svelte frontend
router.get('/api/jam/:id', clipsController.getJamAPI);
router.post(
  '/createClip',
  ensureAuth,
  uploadLimiter,
  upload.single('file'),
  validateFileUpload('audio'),
  validateClip,
  clipsController.createClip
);
router.post(
  '/createJam',
  ensureAuth,
  uploadLimiter,
  upload.single('file'),
  validateFileUpload('image'),
  validateJam,
  clipsController.createJam
);
router.post(
  '/addCommentToJam/:jamid',
  ensureAuth,
  actionLimiter,
  validateComment,
  clipsController.createComment
);

router.put('/likeJam/:id', ensureAuth, actionLimiter, clipsController.likeJam);
router.put(
  '/addClipToJam/:jamid/:myaudioclipid',
  ensureAuth,
  actionLimiter,
  ensureCanContribute, // Requires contributor role or higher
  clipsController.addClipToJam
);
router.put(
  '/addUserToJam/:jamid/:userid',
  ensureAuth,
  actionLimiter,
  ensureOwner, // Only owner can add collaborators
  clipsController.addUserToJam
);

router.put('/likeCommentToJam/:jamid/', ensureAuth, actionLimiter, clipsController.likeComment);

router.delete(
  '/deleteClipFromJam/:jamid/:myaudioclipid',
  ensureAuth,
  ensureCanEdit, // Requires producer role or owner
  clipsController.removeClipFromJam
);
router.delete(
  '/deleteUserFromJam/:jamid/:userid',
  ensureAuth,
  ensureOwner, // Only owner can remove collaborators
  clipsController.removeUserFromJam
);

router.delete('/deleteClip/:id', ensureAuth, clipsController.deleteClip);
router.delete(
  '/deleteJam/:id',
  ensureAuth,
  ensureOwner, // Only owner can delete jam
  clipsController.deleteJam
);

module.exports = router;
