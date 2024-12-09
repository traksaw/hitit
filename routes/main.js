const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const clipsController = require("../controllers/clips");
const upload = require("../middleware/multer");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.get("/audio", homeController.getAudio);
router.get("/profile", ensureAuth, clipsController.getProfile);
router.get("/feed", ensureAuth, clipsController.getJamFeed);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", upload.single("file"), authController.getSignup);
router.post("/signup", upload.single("file"), authController.postSignup);

module.exports = router;
