const path = require('path')

module.exports = {
  getIndex: (req, res) => {
    res.render("index.ejs");
  }, 
  getAudio: (req, res) => {
    const audioPath = path.join(__dirname, '../test.mp3'); // Path to test.mp3 file
    res.setHeader('Content-Type', 'audio/mpeg'); // Set the content type to audio/mpeg
    res.sendFile(audioPath); // Send the audio file);
  }
};
