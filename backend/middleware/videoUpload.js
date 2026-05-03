const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `reel-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /mp4|mov|wmv|avi|mkv|quicktime|video/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files (mp4, mov, wmv, avi, mkv) are allowed!'));
  }
}

// Init upload
const videoUpload = multer({
  storage: storage,
  limits: { fileSize: 15728640 }, // 15MB for videos
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = videoUpload;
