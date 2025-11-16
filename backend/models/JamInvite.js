const mongoose = require('mongoose');

const JamInviteSchema = new mongoose.Schema({
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
    required: true,
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['producer', 'contributor', 'viewer'],
    default: 'contributor',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
    required: true,
  },
  message: {
    type: String,
    maxlength: 500,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  respondedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
JamInviteSchema.index({ invitedUser: 1, status: 1 }); // Find user's pending invites
JamInviteSchema.index({ jam: 1, status: 1 }); // Find jam's pending invites
JamInviteSchema.index({ expiresAt: 1 }); // For cleanup of expired invites

// Prevent duplicate pending invites
JamInviteSchema.index(
  { jam: 1, invitedUser: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('JamInvite', JamInviteSchema);
