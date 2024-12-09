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
      const profilePic = await User.find({ user: req.user.id });
      const myJams = await Jam.find({ user: req.user.id }); //get jams of only user signed in
      const collabJams = await Jam.find({
        collaborators: req.user.id
      });//jams i don't own, but i am a collaborator in

      console.log('profile pic', profilePic, req.user)
      res.render("profile.ejs", { clips: clips, user: req.user, jams: myJams, collabJams: collabJams, profilePic: req.user.image });
    } catch (err) {
      console.log(err);
    }
  },
  getJamFeed: async (req, res) => {
    try {
      // Extract favorite genres array
      const favoriteGenreIds = req.user.favoriteGenres;
  
      console.log('Favorite genres:', favoriteGenreIds);
  
      // Object to store jams filtered by genres
      const genreFavJams = {};
  
      // Fetch jams for each favorite genre
      for (const genre of favoriteGenreIds) {
        console.log('Processing genre:', genre);
        const jamsByGenre = await Jam.find({ genre }).sort({ createdAt: "desc" }).lean();
        genreFavJams[genre] = jamsByGenre;
        console.log(`Jams for genre "${genre}":`, jamsByGenre);
      }
  
      console.log('My collection:', genreFavJams);
  
      // Fetch general and specific genre jams
      const jams = await Jam.find().sort({ createdAt: "desc" }).lean();
      const hipHopJams = await Jam.find({ genre: "Hip-Hop" }).sort({ createdAt: "desc" }).lean();
      const popJams = await Jam.find({ genre: "Pop" }).sort({ createdAt: "desc" }).lean();
  
      // Render the feed page with all data, including jams filtered by favorite genres
      res.render("feed.ejs", { 
        jams, 
        user: req.user.id, 
        hipHopJams, 
        popJams, 
        genreFavJams // Pass this object to your ejs template
      });
    } catch (err) {
      console.log('Error fetching jams:', err);
      res.status(500).send('An error occurred while fetching the jam feed.');
    }
  },
  

  createPost: async (req, res) => {
    try {
      // Upload file to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
      await Clip.create({
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
      // Find the Jam by its ID
      const jam = await Jam.findById(ObjectId(req.params.id));
      if (!jam) {
        throw new Error("Jam not found");
      }

      // Extract audio IDs from the audioElements array
      const audioIds = jam.audioElements;


      // Fetch Audio documents for each ID in audioElements
      const audioDetails = await Promise.all(
        audioIds.map(async (audioId) => {

          const audio = await Clip.findById(ObjectId(audioId));

          return audio; // This will include all of the audio clips details
        })
      );
      // Extract collaborators IDs from the collaborators array
      const collaboratorIds = jam.collaborators;

      // Fetch users documents for each ID in collaborators
      const collaboratorDetails = await Promise.all(
        collaboratorIds.map(async (collaboratorId) => {
          const collaboratorDetails = await User.findById(ObjectId(collaboratorId));
          console.log('users', collaboratorIds, collaboratorDetails)
          return collaboratorDetails; // This will include collaborator Details
        })
      );

      let allUsers = await User.find().lean();
      // const audioClipsInJam = await Jam.find().lean();
      const commentsOfJam = await Comment.find({ jam: ObjectId(req.params.id) }).sort({ createdAt: -1 }).lean() //array of comments 

      const userCommentDetails = await Promise.all(
        commentsOfJam.map(async (comment) => {

          const user = await User.findById(ObjectId(comment.user));

          return user; // This will include all of the comment users details
        })
      );
      console.log('comment users', userCommentDetails)

      let myAudioClips = await Clip.find({ user: ObjectId(req.user.id) }).sort({ createdAt: "desc" }).lean();
      allUsers = allUsers.filter((availableUser) => !jam.collaborators.find((c) => c === availableUser._id.toString()))
      myAudioClips = myAudioClips.filter((availableClip) => !jam.audioElements.find((c) => c === availableClip._id.toString()))
      res.render("jam.ejs", { jam: jam, user: req.user, myAudioClips: myAudioClips, allAudioClips: audioDetails, allUsers: allUsers, collaborators: collaboratorDetails, commentsOfJam: commentsOfJam, userCommentDetails: userCommentDetails });
      console.log('song ids', audioDetails)
    } catch (error) {
      console.error("Error fetching Jam with audio details:", error);
      throw error;
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
        { _id: req.params.jamid }, // Find the Jam by its ID
        { $pull: { collaborators: req.params.userid } }, // Remove the user from collaborators array
        { new: true } // Return the updated document
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
        { _id: req.params.jamid }, // Find the Jam by its ID
        { $pull: { audioElements: req.params.myaudioclipid } }, // Remove the clip from audioElements array
        { new: true } // Return the updated document
      );
      console.log("song is not here");
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
};
