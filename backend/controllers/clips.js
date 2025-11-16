const cloudinary = require('../middleware/cloudinary');
const Jam = require('../models/Jam');
const User = require('../models/User');
const ObjectId = require('mongodb').ObjectID;
const Clip = require('../models/Clip');
const Comment = require('../models/Comment');
const { createNotification } = require('./notifications');
const { logActivity } = require('./jamActivity');

module.exports = {
  createComment: async (req, res) => {
    try {
      const newComment = await Comment.create({
        commentText: req.body.commentText,
        likes: 0,
        user: req.user.id,
        jam: req.params.jamid,
      });

      // Get jam to notify owner
      const jam = await Jam.findById(req.params.jamid);
      if (jam && jam.user.toString() !== req.user.id.toString()) {
        await createNotification(
          jam.user,
          req.user.id,
          'comment',
          `${req.user.userName} commented on "${jam.title}"`,
          { jam: jam._id, comment: newComment._id }
        );
      }

      // Log activity
      if (jam) {
        await logActivity({
          jamId: jam._id,
          userId: req.user.id,
          actionType: 'comment_added',
          description: `${req.user.userName} commented on the jam`,
          metadata: { commentText: req.body.commentText.substring(0, 100) }, // First 100 chars
        });
      }

      console.log('Comment has been added!');
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
      console.log('Likes +1');
      res.redirect('back');
    } catch (err) {
      console.log(err);
    }
  },
  deleteComment: async (req, res) => {
    try {
      console.log(req.params.id);
      await Comment.findOneAndDelete({ _id: req.params.id });
      console.log('Deleted Comment');
      res.redirect('/profile');
    } catch (err) {
      res.redirect('/profile');
    }
  },
  getProfile: async (req, res) => {
    try {
      const clips = await Clip.find({ user: req.user.id });
      const myJams = await Jam.find({ user: req.user.id }); //get jams of only user signed in
      const collabJams = await Jam.find({
        collaborators: req.user.id,
      }); //jams i don't own, but i am a collaborator in
      res.render('profile.ejs', {
        clips: clips,
        user: req.user,
        jams: myJams,
        collabJams: collabJams,
      });
    } catch (err) {
      console.log(err);
    }
  },

  // NEW: JSON API endpoint for Svelte profile page
  getProfileAPI: async (req, res) => {
    try {
      // Get user ID from params (for viewing other profiles) or current user
      const userId = req.params.userId || req.user.id;

      // Fetch user data
      const user = await User.findById(userId).lean();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if viewing own profile
      const isOwnProfile = req.user ? user._id.toString() === req.user._id.toString() : false;

      // Fetch user's clips, jams, and collaboration jams
      let [clips, myJams, collabJams] = await Promise.all([
        Clip.find({ user: userId }).sort({ createdAt: 'desc' }).lean(),
        Jam.find({ user: userId }).sort({ createdAt: 'desc' }).lean(),
        Jam.find({ 'collaborators.user': userId }).sort({ createdAt: 'desc' }).lean(),
      ]);

      // Filter private jams if viewing someone else's profile
      if (!isOwnProfile) {
        myJams = myJams.filter((jam) => !jam.isPrivate);
        collabJams = collabJams.filter((jam) => !jam.isPrivate);
      }

      // Prepare user data (hide sensitive info if not own profile)
      const userData = isOwnProfile
        ? {
            id: user._id,
            userName: user.userName,
            email: user.email,
            image: user.image,
            favoriteGenres: user.favoriteGenres,
          }
        : {
            id: user._id,
            userName: user.userName,
            image: user.image,
            favoriteGenres: user.favoriteGenres,
            // Email hidden for privacy
          };

      // Return JSON response
      res.json({
        success: true,
        user: userData,
        clips,
        jams: myJams,
        collabJams,
        isOwnProfile,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ error: 'Error loading profile' });
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
          .sort({ createdAt: 'desc' })
          .limit(10) // Limit favorite genre sections to 10 jams each
          .lean();
        genreFavJams[genre] = jamsByGenre;
      }

      // Get total count for pagination
      const totalJams = await Jam.countDocuments();
      const totalPages = Math.ceil(totalJams / limit);

      // Fetch general jams with pagination
      const jams = await Jam.find().sort({ createdAt: 'desc' }).skip(skip).limit(limit).lean();

      // Fetch specific genre jams (limited to prevent overload)
      const [hipHopJams, popJams, profilePicture] = await Promise.all([
        Jam.find({ genre: 'Hip-Hop' }).sort({ createdAt: 'desc' }).limit(10).lean(),
        Jam.find({ genre: 'Pop' }).sort({ createdAt: 'desc' }).limit(10).lean(),
        User.findById(req.user.id).lean(),
      ]);

      // Render the feed page with all data, including pagination info
      res.render('feed.ejs', {
        jams,
        user: req.user,
        hipHopJams,
        popJams,
        profilePicture,
        genreFavJams,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    } catch (err) {
      console.log('Error fetching jams:', err);
      res.status(500).send('An error occurred while fetching the jam feed.');
    }
  },

  // NEW: JSON API endpoint for Svelte frontend
  getJamFeedAPI: async (req, res) => {
    try {
      // Pagination settings
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      // Privacy filter: Show public jams, user's own jams, and jams they collaborate on
      const privacyQuery = req.user
        ? {
            $or: [
              { isPrivate: false }, // Public jams
              { user: req.user.id }, // User's own jams
              { 'collaborators.user': req.user.id }, // Jams they collaborate on
            ],
          }
        : { isPrivate: false }; // Only public jams for non-authenticated users

      // Get total count for pagination
      const totalJams = await Jam.countDocuments(privacyQuery);
      const totalPages = Math.ceil(totalJams / limit);

      // Fetch general jams with pagination and privacy filter
      const jams = await Jam.find(privacyQuery)
        .sort({ createdAt: 'desc' })
        .skip(skip)
        .limit(limit)
        .lean();

      // Fetch specific genre jams with privacy filter
      const [hipHopJams, popJams] = await Promise.all([
        Jam.find({ ...privacyQuery, genre: 'Hip-Hop' })
          .sort({ createdAt: 'desc' })
          .limit(10)
          .lean(),
        Jam.find({ ...privacyQuery, genre: 'Pop' })
          .sort({ createdAt: 'desc' })
          .limit(10)
          .lean(),
      ]);

      // Return JSON response
      res.json({
        jams,
        hipHopJams,
        popJams,
        genreFavJams: {}, // Empty for now (requires user auth)
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    } catch (err) {
      console.log('Error fetching jams:', err);
      res.status(500).json({ error: 'An error occurred while fetching the jam feed.' });
    }
  },

  createClip: async (req, res) => {
    const isApiRequest =
      req.path.startsWith('/api/') || req.headers.accept?.includes('application/json');

    try {
      // Upload file to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });

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

      console.log('Clip has been added!', newClip);

      // Return JSON response for API requests
      if (isApiRequest) {
        return res.status(201).json({
          success: true,
          message: 'Clip uploaded successfully',
          clip: newClip,
        });
      }

      // Traditional redirect for EJS templates
      res.redirect('/profile');
    } catch (err) {
      console.error('Error creating clip:', err);

      // Handle Cloudinary-specific errors
      if (err.http_code) {
        const errorMessage =
          err.http_code === 400
            ? 'Invalid file format for storage'
            : err.http_code === 420
              ? 'Too many uploads. Please wait a moment and try again.'
              : 'Failed to upload file to storage';

        if (isApiRequest) {
          return res.status(err.http_code === 420 ? 429 : 500).json({
            success: false,
            error: 'Upload failed',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
          });
        }

        req.flash('errors', { msg: errorMessage });
        return res.redirect('/upload-clip');
      }

      // Generic error handling
      if (isApiRequest) {
        return res.status(500).json({
          success: false,
          error: 'Server error',
          message: 'Failed to upload clip. Please try again.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      }

      req.flash('errors', { msg: 'Failed to upload clip. Please try again.' });
      res.redirect('/upload-clip');
    }
  },
  createJam: async (req, res) => {
    const isApiRequest =
      req.path.startsWith('/api/') || req.headers.accept?.includes('application/json');

    try {
      // Upload file to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });

      // Parse isPrivate field (comes as string from FormData)
      const isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;

      const newJam = await Jam.create({
        title: req.body.title,
        image: result.secure_url,
        genre: req.body.genre,
        cloudinaryImageId: result.public_id,
        fileName: req.file.path,
        description: req.body.description,
        isPrivate: isPrivate, // Save privacy setting
        user: req.user.id,
      });

      // Log activity
      await logActivity({
        jamId: newJam._id,
        userId: req.user.id,
        actionType: 'jam_created',
        description: `${req.user.userName} created the jam "${newJam.title}"`,
        metadata: { genre: newJam.genre, isPrivate },
      });

      console.log(`Jam has been added! (Privacy: ${isPrivate ? 'Private' : 'Public'})`);

      // Return JSON response for API requests
      if (isApiRequest) {
        return res.status(201).json({
          success: true,
          message: 'Jam created successfully',
          jam: newJam,
        });
      }

      // Traditional redirect for EJS templates
      res.redirect(`/clips/jam/${newJam._id}`);
    } catch (err) {
      console.error('Error creating jam:', err);

      // Handle Cloudinary-specific errors
      if (err.http_code) {
        const errorMessage =
          err.http_code === 400
            ? 'Invalid image format for storage'
            : err.http_code === 420
              ? 'Too many uploads. Please wait a moment and try again.'
              : 'Failed to upload image to storage';

        if (isApiRequest) {
          return res.status(err.http_code === 420 ? 429 : 500).json({
            success: false,
            error: 'Upload failed',
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
          });
        }

        req.flash('errors', { msg: errorMessage });
        return res.redirect('/create-jam');
      }

      // Generic error handling
      if (isApiRequest) {
        return res.status(500).json({
          success: false,
          error: 'Server error',
          message: 'Failed to create jam. Please try again.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      }

      req.flash('errors', { msg: 'Failed to create jam. Please try again.' });
      res.redirect('/create-jam');
    }
  },

  getJam: async (req, res) => {
    try {
      console.log(req.params.id, 'hello Jam');
      // Find the Jam by its ID with populated references - FIXES N+1 QUERY PROBLEM
      const jam = await Jam.findById(req.params.id)
        .populate('audioElements') // Populate all audio clips in one query
        .populate('collaborators') // Populate all collaborators in one query
        .lean();

      if (!jam) {
        return res.status(404).send('Jam not found');
      }

      // Filter out any null audio elements (in case some were deleted)
      const validAudioDetails = (jam.audioElements || []).filter((audio) => audio !== null);
      const collaboratorDetails = jam.collaborators || [];

      // Fetch comments with populated user data in a single query
      const commentsOfJam = await Comment.find({ jam: req.params.id })
        .populate('user') // Populate user for each comment in one query
        .sort({ createdAt: -1 })
        .lean();

      // Extract user details from populated comments
      const userCommentDetails = commentsOfJam.map((comment) => comment.user);

      // Fetch all users and user's clips efficiently
      const [allUsers, myAudioClips] = await Promise.all([
        User.find().lean(),
        Clip.find({ user: req.user.id }).sort({ createdAt: 'desc' }).lean(),
      ]);

      // Filter out current user and existing collaborators from available users
      const collaboratorIds = new Set(jam.collaborators.map((c) => c._id.toString()));
      const availableUsers = allUsers.filter(
        (user) =>
          user._id.toString() !== req.user._id.toString() &&
          !collaboratorIds.has(user._id.toString())
      );

      // Filter out clips already in jam
      const audioElementIds = new Set(jam.audioElements.map((a) => a._id.toString()));
      const availableClips = myAudioClips.filter(
        (clip) => !audioElementIds.has(clip._id.toString())
      );

      console.log('jam is here', jam);
      res.render('jam.ejs', {
        jam: jam,
        user: req.user,
        myAudioClips: availableClips,
        allAudioClips: validAudioDetails,
        allUsers: availableUsers,
        collaborators: collaboratorDetails,
        commentsOfJam: commentsOfJam,
        userCommentDetails: userCommentDetails,
        reqUser: req.user.toString(),
      });
      console.log(
        'song ids',
        validAudioDetails.map((a) => a._id)
      );
    } catch (error) {
      console.error('Error fetching Jam with audio details:', error);
      res.status(500).send('Error loading jam');
    }
  },

  // NEW: JSON API endpoint for Svelte jam detail page
  getJamAPI: async (req, res) => {
    try {
      // Find the Jam by its ID with populated references
      const jam = await Jam.findById(req.params.id)
        .populate('audioElements')
        .populate('collaborators.user') // Populate the user field within collaborators
        .populate('user') // Also populate jam owner
        .lean();

      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Filter out any null audio elements
      const validAudioDetails = (jam.audioElements || []).filter((audio) => audio !== null);
      const collaboratorDetails = jam.collaborators || [];

      // Fetch comments with populated user data
      const commentsOfJam = await Comment.find({ jam: req.params.id })
        .populate('user')
        .sort({ createdAt: -1 })
        .lean();

      // Get user's role and permissions
      let userRole = null;
      let permissions = {
        canEdit: false,
        canContribute: false,
        canView: false,
        isOwner: false,
      };

      if (req.user) {
        // Get the jam document (not lean) to use permission methods
        const jamDoc = await Jam.findById(req.params.id);
        userRole = jamDoc.getUserRole(req.user.id);
        permissions = {
          canEdit: jamDoc.canEdit(req.user.id),
          canContribute: jamDoc.canContribute(req.user.id),
          canView: jamDoc.canView(req.user.id) || !jamDoc.isPrivate,
          isOwner: jamDoc.isOwner(req.user.id),
        };
      }

      // If user is authenticated, get their clips and available users
      let myAudioClips = [];
      let availableUsers = [];
      let availableClips = [];

      if (req.user) {
        const [allUsers, userClips] = await Promise.all([
          User.find().lean(),
          Clip.find({ user: req.user.id }).sort({ createdAt: 'desc' }).lean(),
        ]);

        myAudioClips = userClips;

        // Filter out current user and existing collaborators
        // Handle both old format (ObjectId) and new format ({user, role, ...})
        const collaboratorIds = new Set(
          jam.collaborators.map((c) => (c.user ? (c.user._id || c.user).toString() : c.toString()))
        );
        availableUsers = allUsers.filter(
          (user) =>
            user._id.toString() !== req.user._id.toString() &&
            user._id.toString() !== jam.user._id.toString() && // Exclude owner
            !collaboratorIds.has(user._id.toString())
        );

        // Filter out clips already in jam
        const audioElementIds = new Set(jam.audioElements.map((a) => a._id.toString()));
        availableClips = myAudioClips.filter((clip) => !audioElementIds.has(clip._id.toString()));
      }

      // Return JSON response
      res.json({
        success: true,
        jam,
        audioClips: validAudioDetails,
        collaborators: collaboratorDetails,
        comments: commentsOfJam,
        myAvailableClips: availableClips,
        availableUsers,
        userRole, // User's role in this jam
        permissions, // User's permissions
        isOwner: permissions.isOwner,
      });
    } catch (error) {
      console.error('Error fetching Jam:', error);
      res.status(500).json({ error: 'Error loading jam' });
    }
  },
  addClipToJam: async (req, res) => {
    try {
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $addToSet: { audioElements: req.params.myaudioclipid } }
      );

      // Log activity
      const jam = await Jam.findById(req.params.jamid);
      const clip = await Clip.findById(req.params.myaudioclipid);
      if (jam && clip) {
        await logActivity({
          jamId: jam._id,
          userId: req.user.id,
          actionType: 'clip_added',
          description: `${req.user.userName} added "${clip.title}" to the jam`,
          targetClipId: clip._id,
          metadata: { clipTitle: clip.title },
        });
      }

      console.log('array is updated');
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },

  addUserToJam: async (req, res) => {
    try {
      const jam = await Jam.findById(req.params.jamid);

      if (!jam) {
        console.log('Jam not found');
        return res.status(404).send('Jam not found');
      }

      // Get role from query params or default to 'contributor'
      const role = req.query.role || req.body.role || 'contributor';

      // Validate role
      const validRoles = ['producer', 'contributor', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: `Role must be one of: ${validRoles.join(', ')}`,
        });
      }

      // Check if user is already a collaborator
      const existingCollab = jam.collaborators.find(
        (c) => c.user && c.user.toString() === req.params.userid
      );

      if (existingCollab) {
        return res.status(400).json({
          error: 'User already collaborating',
          message: 'This user is already a collaborator on this jam',
        });
      }

      // Add collaborator with role
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        {
          $addToSet: {
            collaborators: {
              user: req.params.userid,
              role: role,
              addedAt: new Date(),
              addedBy: req.user.id,
            },
          },
        }
      );

      // Notify the added user
      await createNotification(
        req.params.userid,
        req.user.id,
        'collaborator_add',
        `${req.user.userName} added you as a ${role} on "${jam.title}"`,
        { jam: jam._id }
      );

      // Log activity
      const addedUser = await User.findById(req.params.userid);
      if (addedUser) {
        await logActivity({
          jamId: jam._id,
          userId: req.user.id,
          actionType: 'collaborator_added',
          description: `${req.user.userName} added ${addedUser.userName} as a ${role}`,
          targetUserId: addedUser._id,
          metadata: { role, addedUserName: addedUser.userName },
        });
      }

      console.log(`User added to jam as ${role}`);
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Failed to add user to jam' });
    }
  },
  likeJam: async (req, res) => {
    try {
      const jam = await Jam.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        },
        { new: true }
      );

      // Notify jam owner
      if (jam && jam.user.toString() !== req.user.id.toString()) {
        await createNotification(
          jam.user,
          req.user.id,
          'like',
          `${req.user.userName} liked your jam "${jam.title}"`,
          { jam: jam._id }
        );
      }

      console.log('Likes +1');
      res.redirect(`/clips/jam/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  removeUserFromJam: async (req, res) => {
    try {
      // Get user and jam info before removal
      const jam = await Jam.findById(req.params.jamid);
      const removedUser = await User.findById(req.params.userid);

      // Pull collaborator by matching user field
      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $pull: { collaborators: { user: req.params.userid } } },
        { new: true }
      );

      // Log activity
      if (jam && removedUser) {
        await logActivity({
          jamId: jam._id,
          userId: req.user.id,
          actionType: 'collaborator_removed',
          description: `${req.user.userName} removed ${removedUser.userName} from the jam`,
          targetUserId: removedUser._id,
          metadata: { removedUserName: removedUser.userName },
        });
      }

      console.log('Collaborator removed');
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Failed to remove collaborator' });
    }
  },
  removeClipFromJam: async (req, res) => {
    console.log('remove clip from jam');
    try {
      // Get clip info before removal
      const jam = await Jam.findById(req.params.jamid);
      const clip = await Clip.findById(req.params.myaudioclipid);

      await Jam.findOneAndUpdate(
        { _id: req.params.jamid },
        { $pull: { audioElements: req.params.myaudioclipid } },
        { new: true }
      );

      // Log activity
      if (jam && clip) {
        await logActivity({
          jamId: jam._id,
          userId: req.user.id,
          actionType: 'clip_removed',
          description: `${req.user.userName} removed "${clip.title}" from the jam`,
          targetClipId: clip._id,
          metadata: { clipTitle: clip.title },
        });
      }

      console.log('song is not here');
      res.redirect(`/clips/jam/${req.params.jamid}`);
    } catch (err) {
      console.log(err);
    }
  },
  deleteClip: async (req, res) => {
    // console.log(req.params.id)
    try {
      await Clip.findByIdAndDelete(req.params.id);
      // Instead of redirecting, just send a success response
      res.status(200).json({ message: 'Clip deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting clip' });
    }
  },
  deleteJam: async (req, res) => {
    console.log(req.params.id, 'jam id to delete');
    try {
      // Ensure the ID is converted to an ObjectId
      const jamId = req.params.id;
      const results = await Jam.findOneAndDelete({ _id: jamId });
      console.log(results, 'results');
      console.log('Deleted Post');
      res.redirect('/profile');
    } catch (err) {
      console.log(err);
      res.redirect('/profile');
    }
  },
};
