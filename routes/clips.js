const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const clipsController = require("../controllers/clips");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Post Routes - simplified for now
// router.get("/:id", ensureAuth, clipsController.getPost);
router.get("/jamFeed", ensureAuth, clipsController.getJamFeed);

router.get("/jam/:id", clipsController.getJam);
router.post("/createClip", upload.single("file"), clipsController.createClip);
router.post("/createJam",upload.single("file"), clipsController.createJam);
router.post("/addCommentToJam/:jamid", clipsController.createComment);



router.put("/likeJam/:id", clipsController.likeJam);
router.put("/addClipToJam/:jamid/:myaudioclipid", clipsController.addClipToJam);
router.put("/addUserToJam/:jamid/:userid", clipsController.addUserToJam);

router.put("/likeCommentToJam/:jamid/", clipsController.likeComment);

router.delete("/deleteClipFromJam/:jamid/:myaudioclipid", clipsController.removeClipFromJam);
router.delete("/deleteUserFromJam/:jamid/:userid", clipsController.removeUserFromJam);

router.delete("/deleteClip/:id", clipsController.deleteClip);
router.delete("/deleteJam/:id", clipsController.deleteJam);
<<<<<<< HEAD
=======

>>>>>>> 193477b0e62314f38aaf292b2b60077208c1379f


module.exports = router;