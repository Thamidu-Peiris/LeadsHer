const resourceService = require('../services/resourceService');

// GET /api/resources/my
exports.getMyResources = async (req, res) => {
  try {
    const result = await resourceService.getMyResources(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get your resources.' });
  }
};

// POST /api/resources
exports.createResource = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, description, type, category, tags } = body;
    if (!title || !description || !type || !category) {
      return res.status(400).json({ message: 'Title, description, type, and category are required.' });
    }
    if (!tags || !Array.isArray(tags) || tags.length < 2) {
      return res.status(400).json({ message: 'At least 2 tags are required.' });
    }
    const resource = await resourceService.createResource(body, req.user._id, req.user.role);
    res.status(201).json(resource);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to create resource.' });
  }
};

// GET /api/resources
exports.getAllResources = async (req, res) => {
  try {
    const result = await resourceService.getResources({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      type: req.query.type,
      difficulty: req.query.difficulty,
      tags: req.query.tags,
      search: req.query.search,
      sort: req.query.sort,
      isPremium: req.query.isPremium,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get resources.' });
  }
};

// GET /api/resources/bookmarks
exports.getUserBookmarks = async (req, res) => {
  try {
    const result = await resourceService.getUserBookmarks(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get bookmarks.' });
  }
};

// GET /api/resources/recommended
exports.getRecommendedResources = async (req, res) => {
  try {
    const resources = await resourceService.getRecommendedResources(req.user._id, {
      limit: req.query.limit,
    });
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get recommendations.' });
  }
};

// GET /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const resource = await resourceService.getResourceById(req.params.id, userId);
    res.json(resource);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get resource.' });
  }
};

// PUT /api/resources/:id
exports.updateResource = async (req, res) => {
  try {
    const resource = await resourceService.updateResource(
      req.params.id, req.user._id, req.user.role, req.body || {},
    );
    res.json(resource);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update resource.' });
  }
};

// DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    const result = await resourceService.deleteResource(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete resource.' });
  }
};

// POST /api/resources/:id/bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const result = await resourceService.toggleBookmark(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to toggle bookmark.' });
  }
};

// POST /api/resources/:id/download
exports.trackDownload = async (req, res) => {
  try {
    const result = await resourceService.trackDownload(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to track download.' });
  }
};

// POST /api/resources/:id/rate
exports.rateResource = async (req, res) => {
  try {
    const { rating, review } = req.body || {};
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    const result = await resourceService.rateResource(req.params.id, req.user._id, rating, review);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to rate resource.' });
  }
};

// POST /api/resources/upload
exports.uploadResourceFile = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: 'No file provided.' });
    }
    const url = '/uploads/resources/' + req.file.filename;
    res.status(201).json({
      url,
      type: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
};

// GET /api/resources/admin/all
exports.getAdminResources = async (req, res) => {
  try {
    const result = await resourceService.getAdminResources({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      category: req.query.category,
      type: req.query.type,
      search: req.query.search,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get admin resources.' });
  }
};

// GET /api/resources/admin/analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const data = await resourceService.getAdminAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get analytics.' });
  }
};

// PATCH /api/resources/:id/approve
exports.approveResource = async (req, res) => {
  try {
    const resource = await resourceService.approveResource(req.params.id);
    res.json(resource);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to approve resource.' });
  }
};

// PATCH /api/resources/:id/reject
exports.rejectResource = async (req, res) => {
  try {
    const resource = await resourceService.rejectResource(req.params.id);
    res.json(resource);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to reject resource.' });
  }
};
