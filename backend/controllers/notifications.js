const Notification = require('../models/Notification');

module.exports = {
  // Get user's notifications
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ recipient: req.user.id })
        .populate('sender', 'userName image')
        .populate('jam', 'title image')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  },

  // Mark all as read
  markAllAsRead: async (req, res) => {
    try {
      await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  },

  // Get unread count
  getUnreadCount: async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        recipient: req.user.id,
        read: false,
      });
      res.json({ success: true, count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },

  // Create notification helper (to be used by other controllers)
  createNotification: async (recipientId, senderId, type, message, relatedData = {}) => {
    try {
      // Don't create notification if sender and recipient are the same
      if (recipientId.toString() === senderId.toString()) {
        return;
      }

      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        message,
        ...relatedData,
      });

      // TODO: Emit real-time notification via Socket.IO
      // const io = require('../services/collaboration').io;
      // if (io) {
      //   io.to(`user:${recipientId}`).emit('notification', {
      //     type,
      //     message,
      //     createdAt: new Date()
      //   });
      // }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  },
};
