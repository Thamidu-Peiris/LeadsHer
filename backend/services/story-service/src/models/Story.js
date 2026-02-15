const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '', maxlength: 300 },
    category: {
      type: String,
      enum: ['leadership', 'entrepreneurship', 'STEM', 'career', 'personal-growth', 'other'],
      default: 'other',
    },
    images: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storySchema.index({ category: 1, createdAt: -1 });
storySchema.index({ author: 1 });

module.exports = mongoose.model('Story', storySchema);
