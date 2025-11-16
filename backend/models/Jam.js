const mongoose = require('mongoose');

const JamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  audioElements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clip',
    },
  ],
  fileName: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: false,
  },
  cloudinaryImageId: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  likes: {
    type: Number,
    required: true,
    default: 0,
  },
  collaborators: [
    {
      user: {
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
      addedAt: {
        type: Date,
        default: Date.now,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  genre: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    required: false,
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false, // Public by default
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper methods for permission checking
JamSchema.methods.getUserRole = function (userId) {
  // Owner has highest privileges
  if (this.user.toString() === userId.toString()) {
    return 'owner';
  }

  // Check collaborator role
  const collaborator = this.collaborators.find(
    (collab) => collab.user.toString() === userId.toString()
  );

  return collaborator ? collaborator.role : null;
};

JamSchema.methods.canEdit = function (userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'producer';
};

JamSchema.methods.canContribute = function (userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'producer' || role === 'contributor';
};

JamSchema.methods.canView = function (userId) {
  const role = this.getUserRole(userId);
  // Anyone with any role can view
  return role !== null;
};

JamSchema.methods.isOwner = function (userId) {
  return this.user.toString() === userId.toString();
};

// Create indexes for better query performance
JamSchema.index({ createdAt: -1 }); // For sorting by newest first
JamSchema.index({ genre: 1, createdAt: -1 }); // For genre filtering
JamSchema.index({ user: 1 }); // For finding user's jams
JamSchema.index({ 'collaborators.user': 1 }); // For finding collab jams (updated)

module.exports = mongoose.model('Jam', JamSchema);
