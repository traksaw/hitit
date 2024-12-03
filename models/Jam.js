const mongoose = require("mongoose");

const JamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // fileName: {
  //   type: String,
  //   required: true,
  // },
  audioElements: {
    type: Array, //array of ids to audio
    require: true,
    default: []

  },
  description: {
    type: String,
    required: false,
  },
  likes: {
    type: Number,
    required: true,
    default: 0, // Set default value to 0
  },
  collaborators: {
    type: Array, //this is gonna be an array of user ids
    required: true,
    default: []
  },
  comments: {
    type: Array, //this is gonna be an array of comment objects {user: userID, comment: 'hello world', createAt: date }
    required: true,
    default: []
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Jam", JamSchema);
