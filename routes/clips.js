const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const clipsController = require("../controllers/clips");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Post Routes - simplified for now
// router.get("/:id", ensureAuth, clipsController.getPost);
router.get("/jamFeed", ensureAuth, clipsController.getFeed);

router.get("/jam/:id", clipsController.getJam);
router.post("/createPost", upload.single("file"), clipsController.createPost);
router.post("/createJam", clipsController.createJam);
router.post("/addCommentToJam/:jamid", clipsController.createComment);



router.put("/likeJam/:id", clipsController.likeJam);
router.put("/addClipToJam/:jamid/:myaudioclipid", clipsController.addClipToJam);
router.put("/addUserToJam/:jamid/:userid", clipsController.addUserToJam);

router.put("/likeCommentToJam/:jamid/", clipsController.likeComment);

// router.delete("/deleteClipFromJam/:jamid/:myaudioclipid", clipsController.deleteClipFromJam);
// router.delete("/deletePost/:id", clipsController.deletePost);
router.delete("/deleteClipFromJam/:jamid/:myaudioclipid", clipsController.removeClipFromJam);
router.delete("/deleteUserFromJam/:jamid/:userid", clipsController.removeUserFromJam);


module.exports = router;
