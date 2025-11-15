const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const clipsController = require("../controllers/clips");
const upload = require("../middleware/multer");
const { ensureAuth, ensureGuest } = require("../middleware/auth");
const { validateSignup, validateFileUpload } = require("../middleware/validation");
const { authLimiter } = require("../middleware/rateLimiter");

//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.get("/audio", homeController.getAudio);
router.get("/profile", ensureAuth, clipsController.getProfile);
router.get("/feed", ensureAuth, clipsController.getJamFeed);

// API Routes (JSON responses for Svelte frontend)
router.get("/api/feed", clipsController.getJamFeedAPI); // No auth required for now

router.get("/login", authController.getLogin);
router.post("/login", authLimiter, authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authLimiter, upload.single("file"), validateFileUpload('image', 10), validateSignup, authController.postSignup);

module.exports = router;
