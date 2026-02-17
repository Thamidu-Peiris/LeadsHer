const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/resources'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = (file.originalname && path.extname(file.originalname)) || '.bin';
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|pptx|jpeg|jpg|png|gif|webp|mp4|mp3|wav/i;
  const ext = path.extname(file.originalname || '').slice(1);
  const mimeAllowed = /application\/pdf|application\/msword|application\/vnd|image\/|video\/|audio\//;

  if (allowedTypes.test(ext) || mimeAllowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (videos)
});

module.exports = { upload };
