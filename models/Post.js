const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
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
  // caption: {
  //   type: String,
  //   required: true,
  // },
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

module.exports = mongoose.model("Post", PostSchema); //change this later
