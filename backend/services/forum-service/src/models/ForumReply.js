const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumTopic', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    parentReply: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumReply', default: null },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAcceptedAnswer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

forumReplySchema.index({ topic: 1, createdAt: 1 });
forumReplySchema.index({ author: 1 });

module.exports = mongoose.model('ForumReply', forumReplySchema);
