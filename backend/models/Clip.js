const mongoose = require('mongoose');

const ClipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    require: true,
  },
  audio: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    required: true,
  },
  genre: {
    type: String, //this is gonna be a genre selection for the jam
    required: false,
  },
  likes: {
    type: Number,
    required: true,
  },
  BPM: {
    type: Number,
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
ClipSchema.index({ user: 1, createdAt: -1 }); // For finding user's clips sorted by date
ClipSchema.index({ genre: 1 }); // For genre filtering

module.exports = mongoose.model('Clip', ClipSchema);
