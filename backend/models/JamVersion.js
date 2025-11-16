const mongoose = require('mongoose');

const JamVersionSchema = new mongoose.Schema({
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
    // Auto-incremented version number (1, 2, 3, etc.)
  },
  versionName: {
    type: String,
    maxlength: 100,
    // Optional custom name for the version (e.g., "Final Mix", "Demo", "v2.0")
  },
  description: {
    type: String,
    maxlength: 500,
    // Optional description of what changed in this version
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Snapshot of jam state at the time of save
  snapshot: {
    title: String,
    description: String,
    genre: String,
    image: String,
    isPrivate: Boolean,
    audioElements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clip',
      },
    ],
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['producer', 'contributor', 'viewer'],
        },
        addedAt: Date,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    // Additional metadata
    clipCount: Number,
    collaboratorCount: Number,
  },

  // Tags for organizing versions
  tags: [String], // e.g., ['final', 'demo', 'backup', 'milestone']

  // Optional: File-based backup (if we want to store actual audio mix)
  mixFile: {
    url: String,
    cloudinaryId: String,
  },

  // Mark if this version is starred/pinned as important
  isPinned: {
    type: Boolean,
    default: false,
  },
});

// Create indexes for better query performance
JamVersionSchema.index({ jam: 1, versionNumber: -1 }); // Get versions for a jam, newest first
JamVersionSchema.index({ jam: 1, createdAt: -1 }); // Alternative sorting by date
JamVersionSchema.index({ createdBy: 1, createdAt: -1 }); // Get versions created by a user

// Ensure version numbers are unique per jam
JamVersionSchema.index({ jam: 1, versionNumber: 1 }, { unique: true });

// Method to generate next version number
JamVersionSchema.statics.getNextVersionNumber = async function (jamId) {
  const latestVersion = await this.findOne({ jam: jamId })
    .sort({ versionNumber: -1 })
    .select('versionNumber');

  return latestVersion ? latestVersion.versionNumber + 1 : 1;
};

module.exports = mongoose.model('JamVersion', JamVersionSchema);
