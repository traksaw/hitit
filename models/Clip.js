const mongoose = require("mongoose");

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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Clip", ClipSchema); 