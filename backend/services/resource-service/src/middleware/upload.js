const multer = require('multer');

const ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx', 'mp4', 'mp3', 'zip']);
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
  'audio/mp3',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
]);

const fileFilter = (req, file, cb) => {
  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  if (ALLOWED_EXTS.has(ext) || ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Supported: PDF, DOC, DOCX, MP4, MP3, ZIP'), false);
  }
};

// Keep file in memory — controller uploads to Cloudinary directly
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const IMAGE_EXTS  = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const imageFilter = (req, file, cb) => {
  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  if (IMAGE_EXTS.has(ext) || IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Image type not allowed. Supported: JPG, PNG, GIF, WEBP'), false);
  }
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload, imageUpload };
