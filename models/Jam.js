const mongoose = require("mongoose");

const JamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  audioElements: {
    type: Array, //array of ids to audio
    require: true,
    default: []
  },
  fileName: {
    type: String,
    required: true,
  },
  cloudinaryId: { //
    type: String,
    require: true,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    require: true,
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
  genre: {
    type: String, //this is gonna be a genre selection for the jam
    required: true,
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
