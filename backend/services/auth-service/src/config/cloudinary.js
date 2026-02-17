/**
 * Cloudinary config for profile picture uploads.
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

const PROFILE_PICTURE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

module.exports = { getCloudinary, PROFILE_PICTURE_MAX_SIZE };
