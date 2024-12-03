const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/PostOld");
const Jam = require("../models/Jam");
const ObjectId = require("mongodb").ObjectID;
// const Audio = require("../models/Post");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      res.render("post.ejs", { post: post, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    console.log('starting create post', req.body)
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
      // console.log('cloudinary results', result)
      await Post.create({
        title: req.body.title,
        image: '',
        cloudinaryId: '',
        audio: result.secure_url,
        cloudinaryAudioId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Clip has been added!");
      // res.redirect("/profile");
      res.json({ message: 'everything is good' }); // Send JSON response
    } catch (err) {
      console.log('create post', err);
    }
  },
  createJam: async (req, res) => {
    console.log('starting create jam', req.body)
    try {

      // console.log('cloudinary results', result)
      const newJam = await Jam.create({
        title: req.body.title,

        description: req.body.description,

        user: req.user.id,
      });
      console.log("Jam has been added!");
      res.redirect(`/post/jam/${newJam._id}`);
    } catch (err) {
      console.log('create post', err);
    }
  },
  // getJam: async (req, res) => {
  //   try {
  //     const jam = await Jam.findById(req.params.id);
  //     const myAudioClips = await Post.find({user: ObjectId(req.user.id)}).sort({ createdAt: "desc" }).lean();
  //     res.render("jam.ejs", { jam: jam, user: req.user, myAudioClips: myAudioClips });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // },
  getJam: async (req, res) => {
    try {
      // Find the Jam by its ID
      const jam = await Jam.findById(req.params.id);
      if (!jam) {
        throw new Error("Jam not found");
      }

      // Extract audio IDs from the audioElements array
      const audioIds = jam.audioElements;

      // Fetch Audio documents for each ID in audioElements
      const audioDetails = await Promise.all(
        audioIds.map(async (audioId) => {
          const audio = await Post.findById(ObjectId(audioId));
          console.log('audio',audio, audioId)
          return audio; // This will include only cloudinaryId and title
        })
      );

      // Remove null values in case any audio document is not found
      // const validAudioDetails = audioDetails.filter((audio) => audio);
      console.log(audioDetails, 'working')

      // Combine Jam data with audio details
      // const result = {
      //   ...jam._doc, // Include all Jam fields
      //   audioElements: validAudioDetails, // Replace audioElements with the resolved details
      // };
      const myAudioClips = await Post.find({ user: ObjectId(req.user.id) }).sort({ createdAt: "desc" }).lean();
      res.render("jam.ejs", { jam: jam, user: req.user, myAudioClips: myAudioClips, jamAudioClips: audioDetails });
    } catch (error) {
      console.error("Error fetching Jam with audio details:", error);
      throw error;
    }

  },
  addClipToJam: async (req, res) => {
    try {
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $push: { audioElements: req.params.myaudioclipid } }
      );
      console.log("array is updated");
      res.redirect(`/post/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
