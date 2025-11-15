const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  commentText: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
CommentSchema.index({ jam: 1, createdAt: -1 }); // For finding jam comments sorted by date
CommentSchema.index({ user: 1 }); // For finding user's comments

module.exports = mongoose.model('Comment', CommentSchema);
