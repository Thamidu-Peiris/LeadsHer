const mongoose = require('mongoose');

const CATEGORY_ENUM = [
  'leadership',
  'entrepreneurship',
  'STEM',
  'corporate',
  'social-impact',
  'career-growth',
];

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true }, // Rich text (HTML/markdown as string)
    excerpt: { type: String, default: '', maxlength: 300 },
    coverImage: { type: String, default: '' }, // Cloudinary URL
    category: { type: String, enum: CATEGORY_ENUM, default: 'leadership', index: true },
    tags: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (arr) => !arr || arr.length <= 5,
        message: 'Maximum 5 tags allowed.',
      },
      default: [],
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0, index: true },
    readingTime: { type: Number, default: 1 }, // minutes
    isFeatured: { type: Boolean, default: false, index: true },
    /** Lower numbers appear first in Featured Stories (admin-controlled). */
    featuredOrder: { type: Number, default: null },
    publishedAt: { type: Date, default: null, index: true },
    // Backward compat
    images: [{ type: String }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storySchema.index({ title: 'text', tags: 'text', excerpt: 'text' });
storySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
