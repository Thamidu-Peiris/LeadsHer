const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads/events');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = (file.originalname && path.extname(file.originalname)) || '.jpg';
    cb(null, `cover-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype && /^image\//.test(file.mimetype);
  if (isImage) cb(null, true);
  else cb(new Error('Only image files are allowed for event cover.'), false);
};

const uploadEventCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

module.exports = { uploadEventCover };
