const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Post Routes - simplified for now
router.get("/:id", ensureAuth, postsController.getPost);

router.post("/createPost", upload.single("file"), postsController.createPost);
router.post("/createJam", postsController.createJam);
router.get("/jam/:id", postsController.getJam);

router.put("/likePost/:id", postsController.likePost);
router.put("/addClipToJam/:jamid/:myaudioclipid", postsController.addClipToJam);

router.delete("/deletePost/:id", postsController.deletePost);

module.exports = router;
