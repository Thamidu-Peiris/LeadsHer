exports.validateResource = (req, res, next) => {
  const { title, description, type, category, tags } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim() === '') errors.push('Title is required');
  if (!description || typeof description !== 'string' || description.trim() === '') errors.push('Description is required');

  const validTypes = ['article', 'ebook', 'video', 'podcast', 'tool', 'guide'];
  if (!type || !validTypes.includes(type)) errors.push('Type must be one of: ' + validTypes.join(', '));

  const validCategories = ['leadership-skills', 'communication', 'negotiation', 'time-management', 'career-planning', 'work-life-balance', 'networking'];
  if (!category || !validCategories.includes(category)) errors.push('Category must be one of: ' + validCategories.join(', '));

  if (!tags || !Array.isArray(tags) || tags.length < 2) errors.push('At least 2 tags are required');
  if (tags && tags.some((t) => typeof t !== 'string' || t.trim() === '')) errors.push('All tags must be non-empty strings');

  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateRating = (req, res, next) => {
  const { rating, review } = req.body;
  const errors = [];

  if (!rating) {
    errors.push('Rating is required');
  } else {
    const rate = parseInt(rating);
    if (isNaN(rate) || rate < 1 || rate > 5) errors.push('Rating must be between 1 and 5');
  }
  if (review && typeof review !== 'string') errors.push('Review must be a string');
  if (review && review.length > 500) errors.push('Review cannot exceed 500 characters');

  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) return res.status(400).json({ message: 'Invalid ID format' });
  next();
};
