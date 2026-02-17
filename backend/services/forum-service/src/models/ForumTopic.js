const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['career-advice', 'leadership-tips', 'networking', 'work-life', 'success-stories', 'general'],
      default: 'general',
    },
    tags: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
    isClosed: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

forumTopicSchema.index({ category: 1, createdAt: -1 });
forumTopicSchema.index({ author: 1 });
forumTopicSchema.index({ lastActivity: -1 });
forumTopicSchema.index({ replyCount: -1, views: -1 });

module.exports = mongoose.model('ForumTopic', forumTopicSchema);
