const JamActivity = require('../models/JamActivity');
const Jam = require('../models/Jam');

/**
 * Helper function to log jam activity
 * @param {Object} params - Activity parameters
 * @param {string} params.jamId - Jam ID
 * @param {string} params.userId - User who performed the action
 * @param {string} params.actionType - Type of action
 * @param {string} params.description - Human-readable description
 * @param {Object} [params.metadata] - Additional metadata
 * @param {string} [params.targetUserId] - Target user (for collaborator actions)
 * @param {string} [params.targetClipId] - Target clip (for clip actions)
 */
const logActivity = async ({
  jamId,
  userId,
  actionType,
  description,
  metadata = {},
  targetUserId = null,
  targetClipId = null,
}) => {
  try {
    await JamActivity.create({
      jam: jamId,
      user: userId,
      actionType,
      description,
      metadata,
      targetUser: targetUserId,
      targetClip: targetClipId,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
};

module.exports = {
  logActivity,

  /**
   * Get activity feed for a specific jam
   * GET /api/jams/:jamId/activity
   */
  getJamActivity: async (req, res) => {
    try {
      const jamId = req.params.jamId;
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      // Check if jam exists
      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Check if user has permission to view the jam
      if (jam.isPrivate && !jam.canView(req.user?.id) && !jam.isOwner(req.user?.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this jam',
        });
      }

      const activities = await JamActivity.find({ jam: jamId })
        .populate('user', 'userName image')
        .populate('targetUser', 'userName image')
        .populate('targetClip', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await JamActivity.countDocuments({ jam: jamId });

      res.json({
        success: true,
        activities,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + activities.length < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching jam activity:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  },

  /**
   * Get current user's activity across all jams
   * GET /api/user/activity
   */
  getUserActivity: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      const activities = await JamActivity.find({ user: req.user.id })
        .populate('jam', 'title image')
        .populate('targetUser', 'userName image')
        .populate('targetClip', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await JamActivity.countDocuments({ user: req.user.id });

      res.json({
        success: true,
        activities,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + activities.length < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  },

  /**
   * Get activity for jams the user is involved in
   * GET /api/activity/feed
   */
  getActivityFeed: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      // Find all jams where user is owner or collaborator
      const userJams = await Jam.find({
        $or: [{ user: req.user.id }, { 'collaborators.user': req.user.id }],
      }).select('_id');

      const jamIds = userJams.map((jam) => jam._id);

      // Get activity from all these jams
      const activities = await JamActivity.find({ jam: { $in: jamIds } })
        .populate('jam', 'title image')
        .populate('user', 'userName image')
        .populate('targetUser', 'userName image')
        .populate('targetClip', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await JamActivity.countDocuments({ jam: { $in: jamIds } });

      res.json({
        success: true,
        activities,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + activities.length < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  },
};
