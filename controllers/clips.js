const cloudinary = require("../middleware/cloudinary");
const Jam = require("../models/Jam");
const User = require("../models/User");
const ObjectId = require("mongodb").ObjectID;
const Clip = require("../models/Clip");
const Comment = require("../models/Comment");

module.exports = {
  createComment: async (req, res) => {
    try {
      await Comment.create({
        commentText: req.body.commentText,
        likes: 0,
        user: req.user.id,
        jam: req.params.jamid
      });
      console.log("Comment has been added!");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  likeComment: async (req, res) => {

    try {
      await Comment.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect('back');
    } catch (err) {
      console.log(err);
    }
  },
  deleteComment: async (req, res) => {
    try {
      console.log(req.params.id)
      await Comment.findOneAndDelete({ _id: req.params.id });
      console.log("Deleted Comment");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
  getProfile: async (req, res) => {
    try {
      const clips = await Clip.find({ user: req.user.id });
      const myJams = await Jam.find({ user: req.user.id }); //get jams of only user signed in
      const collabJams = await Jam.find({
        collaborators: req.user.id
      });//jams i don't own, but i am a collaborator in
      res.render("profile.ejs", { clips: clips, user: req.user, jams: myJams, collabJams: collabJams });
    } catch (err) {
      console.log(err);
    }
  },
  getJamFeed: async (req, res) => {
    try {
      // Pagination settings
      const page = parseInt(req.query.page) || 1;
      const limit = 20; // Show 20 jams per page
      const skip = (page - 1) * limit;

      // Extract favorite genres array
      const favoriteGenreIds = req.user.favoriteGenres || [];

      // Object to store jams filtered by genres
      const genreFavJams = {};

      // Fetch jams for each favorite genre (with pagination)
      for (const genre of favoriteGenreIds) {
        const jamsByGenre = await Jam.find({ genre })
          .sort({ createdAt: "desc" })
          .limit(10) // Limit favorite genre sections to 10 jams each
          .lean();
        genreFavJams[genre] = jamsByGenre;
      }

      // Get total count for pagination
      const totalJams = await Jam.countDocuments();
      const totalPages = Math.ceil(totalJams / limit);

      // Fetch general jams with pagination
      const jams = await Jam.find()
        .sort({ createdAt: "desc" })
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch specific genre jams (limited to prevent overload)
      const [hipHopJams, popJams, profilePicture] = await Promise.all([
        Jam.find({ genre: "Hip-Hop" }).sort({ createdAt: "desc" }).limit(10).lean(),
        Jam.find({ genre: "Pop" }).sort({ createdAt: "desc" }).limit(10).lean(),
        User.findById(req.user.id).lean()
      ]);

      // Render the feed page with all data, including pagination info
      res.render("feed.ejs", {
        jams,
        user: req.user,
        hipHopJams,
        popJams,
        profilePicture,
        genreFavJams,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      });
    } catch (err) {
      console.log('Error fetching jams:', err);
      res.status(500).send('An error occurred while fetching the jam feed.');
    }
  },


  createClip: async (req, res) => {
    try {
      // Upload file to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
      const collabJams = await Jam.find({
        collaborators: req.user.id
      });//jams i don't own, but i am a collaborator in
      const jams = await Jam.find().sort({ createdAt: "desc" }).lean();
      const newClip = await Clip.create({
        title: req.body.title,
        image: '',
        fileName: req.file.path,
        cloudinaryId: '',
        audio: result.secure_url,
        cloudinaryAudioId: result.public_id,
        description: req.body.description,
        likes: 0,
        user: req.user.id,
      });
      console.log("Clip has been added!", newClip);
      // res.render("profile.ejs", { clips: newClip, user: req.user, jams: jams, collabJams: collabJams });

      res.redirect("/profile");
    } catch (err) {
      console.log('create post', err);
    }
  },
  createJam: async (req, res) => {
    try {
      // Upload file to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });

      const newJam = await Jam.create({
        title: req.body.title,
        image: result.secure_url,
        genre: req.body.genre,
        cloudinaryImageId: result.public_id,
        fileName: req.file.path,
        description: req.body.description,
        user: req.user.id,
      });
      console.log("Jam has been added!");
      res.redirect(`/clips/jam/${newJam._id}`);
    } catch (err) {
      console.log('create post', err);
    }
  },

  getJam: async (req, res) => {
    try {
      console.log(req.params.id, 'hello Jam')
      // Find the Jam by its ID with populated references - FIXES N+1 QUERY PROBLEM
      const jam = await Jam.findById(req.params.id)
        .populate('audioElements') // Populate all audio clips in one query
        .populate('collaborators') // Populate all collaborators in one query
        .lean();

      if (!jam) {
        return res.status(404).send("Jam not found");
      }

      // Filter out any null audio elements (in case some were deleted)
      const validAudioDetails = (jam.audioElements || []).filter(audio => audio !== null);
      const collaboratorDetails = jam.collaborators || [];

      // Fetch comments with populated user data in a single query
      const commentsOfJam = await Comment.find({ jam: req.params.id })
        .populate('user') // Populate user for each comment in one query
        .sort({ createdAt: -1 })
        .lean();

      // Extract user details from populated comments
      const userCommentDetails = commentsOfJam.map(comment => comment.user);

      // Fetch all users and user's clips efficiently
      const [allUsers, myAudioClips] = await Promise.all([
        User.find().lean(),
        Clip.find({ user: req.user.id }).sort({ createdAt: "desc" }).lean()
      ]);

      // Filter out current user and existing collaborators from available users
      const collaboratorIds = new Set(jam.collaborators.map(c => c._id.toString()));
      const availableUsers = allUsers.filter(user =>
        user._id.toString() !== req.user._id.toString() &&
        !collaboratorIds.has(user._id.toString())
      );

      // Filter out clips already in jam
      const audioElementIds = new Set(jam.audioElements.map(a => a._id.toString()));
      const availableClips = myAudioClips.filter(clip =>
        !audioElementIds.has(clip._id.toString())
      );

      console.log('jam is here', jam)
      res.render("jam.ejs", {
        jam: jam,
        user: req.user,
        myAudioClips: availableClips,
        allAudioClips: validAudioDetails,
        allUsers: availableUsers,
        collaborators: collaboratorDetails,
        commentsOfJam: commentsOfJam,
        userCommentDetails: userCommentDetails,
        reqUser: req.user.toString()
      });
      console.log('song ids', validAudioDetails.map(a => a._id))
    } catch (error) {
      console.error("Error fetching Jam with audio details:", error);
      res.status(500).send("Error loading jam");
    }

  },
  addClipToJam: async (req, res) => {
    try {
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $addToSet: { audioElements: req.params.myaudioclipid } }
      );
      console.log("array is updated");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },

  addUserToJam: async (req, res) => {

    try {
      const jam = await Jam.findById(req.params.jamid);

      if (!jam) {
        console.log("Jam not found");
        return res.status(404).send("Jam not found");
      }
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $addToSet: { collaborators: req.params.userid } }
      );
      console.log("array is updated");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  likeJam: async (req, res) => {
    try {
      await Jam.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/clips/jam/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  removeUserFromJam: async (req, res) => {
    try {

      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $pull: { collaborators: req.params.userid } },
        { new: true }
      );
      console.log("array is updated");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  removeClipFromJam: async (req, res) => {
    console.log('remove clip from jam')
    try {

      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $pull: { audioElements: req.params.myaudioclipid } },
        { new: true }
      );
      console.log("song is not here");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  deleteClip: async (req, res) => {
    // console.log(req.params.id)
    try {
      await Clip.findByIdAndDelete(req.params.id)
      // Instead of redirecting, just send a success response
      res.status(200).json({ message: 'Clip deleted successfully' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error deleting clip' })
    }
  },
  deleteJam: async (req, res) => {
    console.log(req.params.id, 'jam id to delete' )
    try {
       // Ensure the ID is converted to an ObjectId
       const jamId = req.params.id;
       const results = await Jam.findOneAndDelete({ _id: jamId });
       console.log(results, 'results');
      console.log("Deleted Post");
      res.redirect('/profile');
    } catch (err) {
      console.log(err)
      res.redirect("/profile");
    }
  }
};
