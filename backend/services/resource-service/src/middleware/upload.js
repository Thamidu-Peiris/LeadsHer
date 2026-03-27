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

module.exports = { upload };
