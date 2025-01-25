const cloudinary = require("../middleware/cloudinary");
const Jam = require("../models/Jam");
const User = require("../models/User");
const ObjectId = require("mongodb").ObjectID;
const Clip = require("../models/Clip");
const Comment = require("../models/Comment");
const express = require("express");
const app = express();
const methodOverride = require("method-override");

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
      // Extract favorite genres array
      const favoriteGenreIds = req.user.favoriteGenres;

      console.log('Favorite genres:', favoriteGenreIds);

      // Object to store jams filtered by genres
      const genreFavJams = {};

      // Fetch jams for each favorite genre
      for (const genre of favoriteGenreIds) {
        const jamsByGenre = await Jam.find({ genre }).sort({ createdAt: "desc" }).lean();
        genreFavJams[genre] = jamsByGenre;
        console.log(`Jams for genre "${genre}":`, jamsByGenre);
      }

      // Fetch general and specific genre jams
      const jams = await Jam.find().sort({ createdAt: "desc" }).lean();
      const hipHopJams = await Jam.find({ genre: "Hip-Hop" }).sort({ createdAt: "desc" }).lean();
      const popJams = await Jam.find({ genre: "Pop" }).sort({ createdAt: "desc" }).lean();
      const profilePicture = await User.find({ user: req.user.id });

      // Render the feed page with all data, including jams filtered by favorite genres
      res.render("feed.ejs", {
        jams,
        user: req.user,
        hipHopJams,
        popJams,
        profilePicture,
        genreFavJams // Pass this object to your ejs template
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
      const jam = await Jam.findById(req.params.id);
      
      if (!jam) {
        throw new Error("Jam not found");
      }

      // Fetch the full clip objects using the IDs
      const validAudioDetails = await Promise.all(
        jam.audioElements
          .filter((id, index) => jam.audioElements.indexOf(id) === index) // Remove duplicates
          .map(async (clipId) => {
            return await Clip.findById(clipId);
          })
      );

      console.log('Valid Audio Details:', validAudioDetails); // Debug log

      // Extract collaborators IDs from the collaborators array
      const collaboratorIds = jam.collaborators;

      const collaboratorDetails = await Promise.all(
        collaboratorIds.map(async (collaboratorId) => {
          const collaboratorDetails = await User.findById(collaboratorId);
          return collaboratorDetails;
        })
      );

      let allUsers = await User.find().lean();
      const commentsOfJam = await Comment.find({ jam: req.params.id }).sort({ createdAt: -1 }).lean();

      const userCommentDetails = await Promise.all(
        commentsOfJam.map(async (comment) => {
          const user = await User.findById(comment.user);
          return user;
        })
      );


      let myAudioClips = await Clip.find({ user: req.user.id }).sort({ createdAt: "desc" }).lean();
      allUsers = allUsers.filter((availableUser) => !jam.collaborators.find((c) => c === availableUser._id.toString()))
      allUsers = allUsers.filter((availableUser) => availableUser._id.toString() != req.user._id.toString())
      myAudioClips = myAudioClips.filter((availableClip) => !jam.audioElements.find((c) => c === availableClip._id.toString()))
      console.log('jam is here', jam)
      console.log('Jam audio elements:', jam.audioElements);

      // Add these console.logs before rendering
      console.log('allAudioClips:', validAudioDetails);
      console.log('jam.audioElements:', jam.audioElements);

      res.render("jam.ejs", {
        jam: jam,
        user: req.user,
        myAudioClips: myAudioClips,
        allAudioClips: validAudioDetails.filter(clip => clip !== null), // Filter out any null values
        allUsers: allUsers,
        collaborators: collaboratorDetails,
        commentsOfJam: commentsOfJam,
        userCommentDetails: userCommentDetails,
        reqUser: req.user.toString()
      });
      
    } catch (error) {
      console.error("Error fetching Jam with audio details:", error);
      throw error;
    }
  },
  addClipToJam: async (req, res) => {
    try {
      const jam = await Jam.findById(req.params.jamId)
      
      // Check if jam exists
      if (!jam) {
        console.log('Jam not found:', req.params.jamId)
        return res.status(404).json({ error: 'Jam not found' })
      }

      // Initialize audioElements array if it doesn't exist
      if (!jam.audioElements) {
        jam.audioElements = []
      }

      // Add the clip ID if it's not already in the array
      if (!jam.audioElements.includes(req.params.clipId)) {
        jam.audioElements.push(req.params.clipId)
      }

      // Set the user field only if it's not already set
      // Make sure req.user._id is a valid ObjectId
      if (!jam.user && req.user && req.user._id) {
        jam.user = req.user._id.toString() // Convert to string to ensure proper ObjectId handling
      }

      await jam.save()
      
      // Redirect back to the jam page instead of sending JSON
      res.redirect(`/clips/jam/${req.params.jamId}`)
    } catch (err) {
      console.log('Error in addClipToJam:', err)
      // Redirect back with error
      res.redirect(`/clips/jam/${req.params.jamId}`)
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
  // removeClipFromJam: async (req, res) => {
  //   console.log('remove clip from jam')
  //   try {

  //     await Jam.findOneAndUpdate(
  //       { _id: req.params.jamid },
  //       { $pull: { audioElements: req.params.myaudioclipid } },
  //       { new: true }
  //     );
  //     console.log("song is not here");
  //     res.redirect(`/clips/jam/${req.params.jamid}`);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // },
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
  },
  deleteClipFromJam: async (req, res) => {
    try {
      const jam = await Jam.findById(req.params.jamId)
      
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' })
      }

      // Remove the clip ID from the audioElements array
      jam.audioElements = jam.audioElements.filter(
        clipId => clipId.toString() !== req.params.clipId
      )

      await jam.save()
      
      // Redirect back to the jam page
      res.redirect(`/clips/jam/${req.params.jamId}`)
    } catch (err) {
      console.log('Error in deleteClipFromJam:', err)
      res.redirect(`/clips/jam/${req.params.jamId}`)
    }
  },
};
