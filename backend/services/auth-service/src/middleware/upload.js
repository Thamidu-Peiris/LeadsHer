const multer = require('multer');
const path = require('path');
const { PROFILE_PICTURE_MAX_SIZE } = require('../config/cloudinary');

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/i;
  const ext = path.extname(file.originalname || '').slice(1) || file.mimetype?.split('/')[1];
  if (allowed.test(ext) || (file.mimetype && /image\//.test(file.mimetype))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed. Max size 5MB.'), false);
  }
};

const uploadProfilePicture = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: PROFILE_PICTURE_MAX_SIZE },
}).single('profilePicture');

module.exports = { uploadProfilePicture };
