const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getResourceType = (filename) => {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'mp4' || ext === 'mp3') return 'video';
  return 'raw';
};

/**
 * Upload buffer to Cloudinary with explicit public delivery type.
 * type: 'upload' ensures the asset is publicly accessible (not authenticated/private).
 */
const uploadBuffer = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const ext = (originalname || 'file').split('.').pop().toLowerCase();
    const resourceType = getResourceType(originalname);
    const publicId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'leadsher/resources',
        resource_type: resourceType,
        type: 'upload',          // explicitly public delivery
        public_id: publicId,
        use_filename: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Generate a signed URL for a Cloudinary asset.
 * Use this so Cloudinary knows the request is trusted and delivers correctly.
 */
const getSignedUrl = (publicId, resourceType = 'raw') => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    secure: true,
  });
};

module.exports = { uploadBuffer, getSignedUrl };
