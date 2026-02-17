/**
 * Cloudinary config for story media uploads (optional).
 * Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env.
 */
let cloudinary = null;

const getCloudinary = () => {
  if (cloudinary) return cloudinary;
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return null;
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
    return cloudinary;
  } catch (e) {
    return null;
  }
};

module.exports = { getCloudinary };
