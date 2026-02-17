const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/stories'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = (file.originalname && path.extname(file.originalname)) || '.jpg';
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|gif|webp|mp4|mov|webm/i;
  const ext = path.extname(file.originalname || '').slice(1) || file.mimetype?.split('/')[1];
  const isImage = file.mimetype && /image\//.test(file.mimetype);
  const isVideo = file.mimetype && /video\//.test(file.mimetype);
  if (allowedExt.test(ext) || isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Only image/video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  // Allow larger files for story media (gateway allows 100MB)
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = { upload };
