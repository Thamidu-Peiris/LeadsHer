const CATEGORIES = ['career-advice', 'leadership-tips', 'networking', 'work-life', 'success-stories', 'general'];
const REPORT_REASONS = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];

const validateTopic = (req, res, next) => {
  const { title, content, category, tags } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }
  if (title.trim().length > 200) {
    return res.status(400).json({ message: 'Title must be 200 characters or less.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
  }
  if (tags && (!Array.isArray(tags) || tags.length > 10)) {
    return res.status(400).json({ message: 'Tags must be an array with at most 10 items.' });
  }
  next();
};

const validateReply = (req, res, next) => {
  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  if (content.trim().length > 1000) {
    return res.status(400).json({ message: 'Content must be 1000 characters or less.' });
  }
  next();
};

const validateVote = (req, res, next) => {
  const { type, postType } = req.body || {};
  if (!['upvote', 'downvote'].includes(type)) {
    return res.status(400).json({ message: 'Type must be upvote or downvote.' });
  }
  if (!['topic', 'reply'].includes(postType)) {
    return res.status(400).json({ message: 'postType must be topic or reply.' });
  }
  next();
};

const validateReport = (req, res, next) => {
  const { reason, postType, description } = req.body || {};
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: `Reason must be one of: ${REPORT_REASONS.join(', ')}` });
  }
  if (!['topic', 'reply'].includes(postType)) {
    return res.status(400).json({ message: 'postType must be topic or reply.' });
  }
  if (description && description.length > 500) {
    return res.status(400).json({ message: 'Description must be 500 characters or less.' });
  }
  next();
};

module.exports = { validateTopic, validateReply, validateVote, validateReport };
