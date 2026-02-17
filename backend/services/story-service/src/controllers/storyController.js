const storyService = require('../services/storyService');

// POST /api/stories/upload
exports.uploadStoryImage = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: 'No image file provided.' });
    }
    const url = '/uploads/stories/' + req.file.filename;
    res.status(201).json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
};

// POST /api/stories
exports.createStory = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, content, excerpt, category, images } = body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const story = await storyService.createStoryRecord({
      title, content, excerpt, category, images, authorId: req.user._id,
    });
    res.status(201).json(story);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to create story.' });
  }
};

// GET /api/stories
exports.getAllStories = async (req, res) => {
  try {
    const result = await storyService.getStoriesPaginated({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get stories.' });
  }
};

// GET /api/stories/:id
exports.getStoryById = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const story = await storyService.getStoryByIdAndIncrementViews(req.params.id, userId);
    res.json(story);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get story.' });
  }
};

// PUT /api/stories/:id
exports.updateStory = async (req, res) => {
  try {
    const body = req.body || {};
    const story = await storyService.updateStoryById(
      req.params.id, req.user._id, req.user.role, body,
    );
    res.json(story);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update story.' });
  }
};

// DELETE /api/stories/:id
exports.deleteStory = async (req, res) => {
  try {
    const result = await storyService.deleteStoryById(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete story.' });
  }
};

// POST /api/stories/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const result = await storyService.toggleStoryLike(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to toggle like.' });
  }
};
