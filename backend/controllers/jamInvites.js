const JamInvite = require('../models/JamInvite');
const JamRequest = require('../models/JamRequest');
const Jam = require('../models/Jam');
const User = require('../models/User');
const { createNotification } = require('./notifications');
const { logActivity } = require('./jamActivity');

module.exports = {
  // ==================== INVITES ====================

  /**
   * Send an invite to a user to collaborate on a jam
   * POST /api/jams/:jamId/invite
   */
  sendInvite: async (req, res) => {
    try {
      const { userId, role, message } = req.body;
      const jamId = req.params.jamId;

      // Validate inputs
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const validRoles = ['producer', 'contributor', 'viewer'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: `Role must be one of: ${validRoles.join(', ')}`,
        });
      }

      // Check if jam exists and user is owner
      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      if (!jam.isOwner(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner can send invites',
        });
      }

      // Check if user is already a collaborator
      const isAlreadyCollaborator = jam.collaborators.some(
        (c) => c.user && c.user.toString() === userId
      );

      if (isAlreadyCollaborator) {
        return res.status(400).json({
          error: 'Already collaborating',
          message: 'This user is already a collaborator on this jam',
        });
      }

      // Check if there's already a pending invite
      const existingInvite = await JamInvite.findOne({
        jam: jamId,
        invitedUser: userId,
        status: 'pending',
      });

      if (existingInvite) {
        return res.status(400).json({
          error: 'Invite already sent',
          message: 'There is already a pending invite for this user',
        });
      }

      // Create the invite
      const invite = await JamInvite.create({
        jam: jamId,
        invitedUser: userId,
        invitedBy: req.user.id,
        role: role || 'contributor',
        message: message || '',
      });

      // Send notification to invited user
      await createNotification(
        userId,
        req.user.id,
        'collaborator_add',
        `${req.user.userName} invited you to collaborate on "${jam.title}" as a ${role || 'contributor'}`,
        { jam: jamId }
      );

      // Log activity
      const invitedUser = await User.findById(userId);
      if (invitedUser) {
        await logActivity({
          jamId,
          userId: req.user.id,
          actionType: 'invite_sent',
          description: `${req.user.userName} invited ${invitedUser.userName} to collaborate as a ${role || 'contributor'}`,
          targetUserId: userId,
          metadata: { role: role || 'contributor', invitedUserName: invitedUser.userName },
        });
      }

      res.status(201).json({
        success: true,
        message: 'Invite sent successfully',
        invite,
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      res.status(500).json({ error: 'Failed to send invite' });
    }
  },

  /**
   * Get all invites for the current user
   * GET /api/invites
   */
  getMyInvites: async (req, res) => {
    try {
      const invites = await JamInvite.find({
        invitedUser: req.user.id,
        status: 'pending',
        expiresAt: { $gt: new Date() }, // Not expired
      })
        .populate('jam', 'title image genre')
        .populate('invitedBy', 'userName image')
        .sort({ createdAt: -1 });

      res.json({ success: true, invites });
    } catch (error) {
      console.error('Error fetching invites:', error);
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  },

  /**
   * Get all pending invites for a jam (owner only)
   * GET /api/jams/:jamId/invites
   */
  getJamInvites: async (req, res) => {
    try {
      const jam = await Jam.findById(req.params.jamId);

      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      if (!jam.isOwner(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner can view invites',
        });
      }

      const invites = await JamInvite.find({
        jam: req.params.jamId,
        status: 'pending',
      })
        .populate('invitedUser', 'userName image')
        .sort({ createdAt: -1 });

      res.json({ success: true, invites });
    } catch (error) {
      console.error('Error fetching jam invites:', error);
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  },

  /**
   * Accept an invite
   * POST /api/invites/:inviteId/accept
   */
  acceptInvite: async (req, res) => {
    try {
      const invite = await JamInvite.findById(req.params.inviteId).populate('jam');

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Check if user is the invited user
      if (invite.invitedUser.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This invite is not for you',
        });
      }

      // Check if invite is still pending
      if (invite.status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid invite',
          message: 'This invite has already been responded to',
        });
      }

      // Check if invite has expired
      if (invite.expiresAt < new Date()) {
        invite.status = 'expired';
        await invite.save();
        return res.status(400).json({
          error: 'Invite expired',
          message: 'This invite has expired',
        });
      }

      // Add user to jam collaborators
      await Jam.findByIdAndUpdate(invite.jam._id, {
        $addToSet: {
          collaborators: {
            user: req.user.id,
            role: invite.role,
            addedAt: new Date(),
            addedBy: invite.invitedBy,
          },
        },
      });

      // Update invite status
      invite.status = 'accepted';
      invite.respondedAt = new Date();
      await invite.save();

      // Notify the person who sent the invite
      await createNotification(
        invite.invitedBy,
        req.user.id,
        'collaborator_add',
        `${req.user.userName} accepted your invite to "${invite.jam.title}"`,
        { jam: invite.jam._id }
      );

      // Log activity
      await logActivity({
        jamId: invite.jam._id,
        userId: req.user.id,
        actionType: 'invite_accepted',
        description: `${req.user.userName} accepted the invitation and joined as a ${invite.role}`,
        metadata: { role: invite.role },
      });

      res.json({
        success: true,
        message: 'Invite accepted successfully',
        jam: invite.jam,
      });
    } catch (error) {
      console.error('Error accepting invite:', error);
      res.status(500).json({ error: 'Failed to accept invite' });
    }
  },

  /**
   * Decline an invite
   * POST /api/invites/:inviteId/decline
   */
  declineInvite: async (req, res) => {
    try {
      const invite = await JamInvite.findById(req.params.inviteId);

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.invitedUser.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This invite is not for you',
        });
      }

      if (invite.status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid invite',
          message: 'This invite has already been responded to',
        });
      }

      invite.status = 'declined';
      invite.respondedAt = new Date();
      await invite.save();

      res.json({
        success: true,
        message: 'Invite declined',
      });
    } catch (error) {
      console.error('Error declining invite:', error);
      res.status(500).json({ error: 'Failed to decline invite' });
    }
  },

  // ==================== REQUESTS ====================

  /**
   * Request to join a jam
   * POST /api/jams/:jamId/request
   */
  requestToJoin: async (req, res) => {
    try {
      const { requestedRole, message, skills, portfolio } = req.body;
      const jamId = req.params.jamId;

      // Check if jam exists
      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Check if user is already owner or collaborator
      if (jam.isOwner(req.user.id)) {
        return res.status(400).json({
          error: 'Already owner',
          message: 'You are the owner of this jam',
        });
      }

      const isAlreadyCollaborator = jam.collaborators.some(
        (c) => c.user && c.user.toString() === req.user.id
      );

      if (isAlreadyCollaborator) {
        return res.status(400).json({
          error: 'Already collaborating',
          message: 'You are already a collaborator on this jam',
        });
      }

      // Check if there's already a pending request
      const existingRequest = await JamRequest.findOne({
        jam: jamId,
        requestedBy: req.user.id,
        status: 'pending',
      });

      if (existingRequest) {
        return res.status(400).json({
          error: 'Request already sent',
          message: 'You have already sent a request to join this jam',
        });
      }

      // Create the request
      const request = await JamRequest.create({
        jam: jamId,
        requestedBy: req.user.id,
        requestedRole: requestedRole || 'contributor',
        message: message || '',
        skills: skills || [],
        portfolio: portfolio || '',
      });

      // Notify the jam owner
      await createNotification(
        jam.user,
        req.user.id,
        'collaborator_add',
        `${req.user.userName} requested to join "${jam.title}"`,
        { jam: jamId }
      );

      // Log activity
      await logActivity({
        jamId,
        userId: req.user.id,
        actionType: 'request_sent',
        description: `${req.user.userName} requested to join as a ${requestedRole || 'contributor'}`,
        metadata: { requestedRole: requestedRole || 'contributor', skills, portfolio },
      });

      res.status(201).json({
        success: true,
        message: 'Request sent successfully',
        request,
      });
    } catch (error) {
      console.error('Error sending request:', error);
      res.status(500).json({ error: 'Failed to send request' });
    }
  },

  /**
   * Get pending requests for a jam (owner only)
   * GET /api/jams/:jamId/requests
   */
  getJamRequests: async (req, res) => {
    try {
      const jam = await Jam.findById(req.params.jamId);

      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      if (!jam.isOwner(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner can view requests',
        });
      }

      const requests = await JamRequest.find({
        jam: req.params.jamId,
        status: 'pending',
      })
        .populate('requestedBy', 'userName image')
        .sort({ createdAt: -1 });

      res.json({ success: true, requests });
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  },

  /**
   * Approve a request to join (owner only)
   * POST /api/requests/:requestId/approve
   */
  approveRequest: async (req, res) => {
    try {
      const request = await JamRequest.findById(req.params.requestId).populate('jam');

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Check if user is jam owner
      if (!request.jam.isOwner(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner can approve requests',
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'This request has already been responded to',
        });
      }

      // Add user to jam collaborators
      await Jam.findByIdAndUpdate(request.jam._id, {
        $addToSet: {
          collaborators: {
            user: request.requestedBy,
            role: request.requestedRole,
            addedAt: new Date(),
            addedBy: req.user.id,
          },
        },
      });

      // Update request status
      request.status = 'approved';
      request.respondedAt = new Date();
      request.respondedBy = req.user.id;
      await request.save();

      // Notify the requester
      await createNotification(
        request.requestedBy,
        req.user.id,
        'collaborator_add',
        `Your request to join "${request.jam.title}" was approved!`,
        { jam: request.jam._id }
      );

      // Log activity
      const requestedUser = await User.findById(request.requestedBy);
      if (requestedUser) {
        await logActivity({
          jamId: request.jam._id,
          userId: req.user.id,
          actionType: 'request_approved',
          description: `${req.user.userName} approved ${requestedUser.userName}'s request to join as a ${request.requestedRole}`,
          targetUserId: request.requestedBy,
          metadata: { role: request.requestedRole, approvedUserName: requestedUser.userName },
        });
      }

      res.json({
        success: true,
        message: 'Request approved successfully',
      });
    } catch (error) {
      console.error('Error approving request:', error);
      res.status(500).json({ error: 'Failed to approve request' });
    }
  },

  /**
   * Deny a request to join (owner only)
   * POST /api/requests/:requestId/deny
   */
  denyRequest: async (req, res) => {
    try {
      const request = await JamRequest.findById(req.params.requestId).populate('jam');

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (!request.jam.isOwner(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner can deny requests',
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'This request has already been responded to',
        });
      }

      request.status = 'denied';
      request.respondedAt = new Date();
      request.respondedBy = req.user.id;
      await request.save();

      res.json({
        success: true,
        message: 'Request denied',
      });
    } catch (error) {
      console.error('Error denying request:', error);
      res.status(500).json({ error: 'Failed to deny request' });
    }
  },

  /**
   * Get current user's pending requests
   * GET /api/my-requests
   */
  getMyRequests: async (req, res) => {
    try {
      const requests = await JamRequest.find({
        requestedBy: req.user.id,
      })
        .populate('jam', 'title image genre')
        .sort({ createdAt: -1 });

      res.json({ success: true, requests });
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  },
};
