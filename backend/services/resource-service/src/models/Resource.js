const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'leadership-skills',
        'communication',
        'negotiation',
        'time-management',
        'career-planning',
        'work-life-balance',
        'networking',
      ],
      required: true,
    },
    tags: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: 'Resources must have at least 2 tags.',
      },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },      // Cloudinary public_id for re-signing
      resourceType: { type: String, default: 'raw' }, // Cloudinary resource_type
      type: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    externalLink: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    author: { type: String, default: '' },
    publishedDate: { type: Date },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    duration: { type: Number, default: 0 },
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downloads: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, createdAt: -1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ title: 1 });
resourceSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
