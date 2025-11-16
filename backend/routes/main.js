const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const homeController = require('../controllers/home');
const clipsController = require('../controllers/clips');
const notificationsController = require('../controllers/notifications');
const jamInvitesController = require('../controllers/jamInvites');
const jamActivityController = require('../controllers/jamActivity');
const jamVersionsController = require('../controllers/jamVersions');
const upload = require('../middleware/multer');
const { ensureAuth, ensureGuest } = require('../middleware/auth');
const { validateSignup, validateFileUpload } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

//Main Routes - simplified for now
router.get('/', homeController.getIndex);
router.get('/audio', homeController.getAudio);
router.get('/profile', ensureAuth, clipsController.getProfile);
router.get('/feed', ensureAuth, clipsController.getJamFeed);

// API endpoint for profile (supports viewing own profile or other user's profile)
router.get('/api/profile/:userId?', ensureAuth, clipsController.getProfileAPI);

// API Routes (JSON responses for Svelte frontend)
router.get('/api/feed', clipsController.getJamFeedAPI); // No auth required for now
router.post('/api/auth/login', authLimiter, authController.apiLogin);
router.post(
  '/api/auth/signup',
  authLimiter,
  upload.single('file'),
  validateFileUpload('image', 10),
  validateSignup,
  authController.apiSignup
);
router.post('/api/auth/logout', authController.apiLogout);
router.get('/api/auth/me', authController.apiGetCurrentUser);

// Notification API Routes
router.get('/api/notifications', ensureAuth, notificationsController.getNotifications);
router.get('/api/notifications/unread-count', ensureAuth, notificationsController.getUnreadCount);
router.post('/api/notifications/:id/read', ensureAuth, notificationsController.markAsRead);
router.post('/api/notifications/mark-all-read', ensureAuth, notificationsController.markAllAsRead);

// Jam Invite & Request API Routes
// Invites
router.post('/api/jams/:jamId/invite', ensureAuth, jamInvitesController.sendInvite);
router.get('/api/invites', ensureAuth, jamInvitesController.getMyInvites);
router.get('/api/jams/:jamId/invites', ensureAuth, jamInvitesController.getJamInvites);
router.post('/api/invites/:inviteId/accept', ensureAuth, jamInvitesController.acceptInvite);
router.post('/api/invites/:inviteId/decline', ensureAuth, jamInvitesController.declineInvite);

// Requests
router.post('/api/jams/:jamId/request', ensureAuth, jamInvitesController.requestToJoin);
router.get('/api/jams/:jamId/requests', ensureAuth, jamInvitesController.getJamRequests);
router.get('/api/my-requests', ensureAuth, jamInvitesController.getMyRequests);
router.post('/api/requests/:requestId/approve', ensureAuth, jamInvitesController.approveRequest);
router.post('/api/requests/:requestId/deny', ensureAuth, jamInvitesController.denyRequest);

// Activity Feed API Routes
router.get('/api/jams/:jamId/activity', jamActivityController.getJamActivity);
router.get('/api/user/activity', ensureAuth, jamActivityController.getUserActivity);
router.get('/api/activity/feed', ensureAuth, jamActivityController.getActivityFeed);

// Jam Versioning API Routes
router.post('/api/jams/:jamId/versions', ensureAuth, jamVersionsController.createVersion);
router.get('/api/jams/:jamId/versions', jamVersionsController.getJamVersions);
router.get('/api/jams/:jamId/versions/compare', jamVersionsController.compareVersions);
router.get('/api/jams/:jamId/versions/:versionNumber', jamVersionsController.getVersion);
router.post(
  '/api/jams/:jamId/versions/:versionNumber/restore',
  ensureAuth,
  jamVersionsController.restoreVersion
);
router.patch(
  '/api/jams/:jamId/versions/:versionNumber',
  ensureAuth,
  jamVersionsController.updateVersion
);
router.delete(
  '/api/jams/:jamId/versions/:versionNumber',
  ensureAuth,
  jamVersionsController.deleteVersion
);

router.get('/login', authController.getLogin);
router.post('/login', authLimiter, authController.postLogin);
router.get('/logout', authController.logout);
router.get('/signup', authController.getSignup);
router.post(
  '/signup',
  authLimiter,
  upload.single('file'),
  validateFileUpload('image', 10),
  validateSignup,
  authController.postSignup
);

module.exports = router;
