const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    console.log('multar', file)
    let ext = path.extname(file.originalname);
    ext = ext.toLowerCase()
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".webp" && ext !== ".png" && ext !== ".wav" && ext !== ".mp3" && ext !== ".mp4" && ext !== ".mpa") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});
