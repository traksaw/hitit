const mongoose = require('mongoose');

const JamRequestSchema = new mongoose.Schema({
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedRole: {
    type: String,
    enum: ['producer', 'contributor', 'viewer'],
    default: 'contributor',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
    required: true,
  },
  message: {
    type: String,
    maxlength: 500,
    required: false,
  },
  skills: {
    type: [String], // e.g., ['drums', 'vocals', 'mixing']
    required: false,
  },
  portfolio: {
    type: String, // URL to portfolio or SoundCloud
    maxlength: 500,
    required: false,
  },
  respondedAt: {
    type: Date,
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
JamRequestSchema.index({ jam: 1, status: 1 }); // Find jam's pending requests
JamRequestSchema.index({ requestedBy: 1, status: 1 }); // Find user's pending requests

// Prevent duplicate pending requests
JamRequestSchema.index(
  { jam: 1, requestedBy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('JamRequest', JamRequestSchema);
