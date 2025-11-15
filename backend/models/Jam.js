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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
JamSchema.index({ createdAt: -1 }); // For sorting by newest first
JamSchema.index({ genre: 1, createdAt: -1 }); // For genre filtering
JamSchema.index({ user: 1 }); // For finding user's jams
JamSchema.index({ collaborators: 1 }); // For finding collab jams

module.exports = mongoose.model('Jam', JamSchema);
