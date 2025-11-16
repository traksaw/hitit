const mongoose = require('mongoose');

const JamActivitySchema = new mongoose.Schema({
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      'jam_created',
      'clip_added',
      'clip_removed',
      'mix_updated',
      'collaborator_added',
      'collaborator_removed',
      'role_changed',
      'invite_sent',
      'invite_accepted',
      'request_sent',
      'request_approved',
      'comment_added',
      'jam_updated',
      'jam_published',
    ],
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // For actions involving another user (e.g., adding a collaborator)
  },
  targetClip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clip',
    // For clip-related actions
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Flexible field for additional action-specific data
    // e.g., { clipTitle: "My Beat", role: "producer", previousValue: "old", newValue: "new" }
  },
  description: {
    type: String,
    required: true,
    // Human-readable description of the action
    // e.g., "John added a clip 'My Beat' to the jam"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
JamActivitySchema.index({ jam: 1, createdAt: -1 }); // Get jam's activity feed
JamActivitySchema.index({ user: 1, createdAt: -1 }); // Get user's activity
JamActivitySchema.index({ createdAt: -1 }); // Global activity feed

// Optional: TTL index to auto-delete old activities after 90 days
JamActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('JamActivity', JamActivitySchema);
