const resourceService = require('../services/resourceService');
const { uploadBuffer, uploadImageBuffer, getSignedUrl } = require('../utils/cloudinary');

// GET /api/resources/admin/all  (admin only)
exports.adminGetAllResources = async (req, res) => {
  try {
    const result = await resourceService.adminGetResources({
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      search: req.query.search,
      category: req.query.category,
      type: req.query.type,
      status: req.query.status,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get resources.' });
  }
};

// GET /api/resources/admin/analytics  (admin only)
exports.adminGetAnalytics = async (req, res) => {
  try {
    const data = await resourceService.adminGetAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get analytics.' });
  }
};

// PATCH /api/resources/:id/approve  (admin only)
exports.approveResource = async (req, res) => {
  try {
    const result = await resourceService.approveResource(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to approve resource.' });
  }
};

// PATCH /api/resources/:id/reject  (admin only)
exports.rejectResource = async (req, res) => {
  try {
    const result = await resourceService.rejectResource(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to reject resource.' });
  }
};

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
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file provided.' });
    }
    const result = await uploadBuffer(req.file.buffer, req.file.originalname);

    // Generate a signed URL for trusted delivery
    const signedUrl = getSignedUrl(result.public_id, result.resource_type);

    res.status(201).json({
      url: signedUrl,           // signed, trusted Cloudinary URL
      publicId: result.public_id,
      resourceType: result.resource_type,
      type: req.file.mimetype,
      size: result.bytes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
};

// POST /api/resources/upload-thumbnail
exports.uploadThumbnail = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image provided.' });
    }
    const result = await uploadImageBuffer(req.file.buffer, req.file.originalname);
    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Thumbnail upload failed.' });
  }
};

// GET /api/resources/books/search?q=query&maxResults=8
exports.searchBooks = async (req, res) => {
  try {
    const { q, maxResults = 8 } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required.' });
    }
    const apiKey = process.env.BOOKS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Google Books API key not configured.' });
    }
    const limit = Math.min(20, parseInt(maxResults, 10) || 8);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q.trim())}&maxResults=${limit}&langRestrict=en&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: 'Google Books API request failed.' });
    }
    const data = await response.json();
    const books = (data.items || []).map((item) => ({
      id: item.id,
      title: item.volumeInfo?.title || '',
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description || '',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || '',
      publishedDate: item.volumeInfo?.publishedDate || '',
      publisher: item.volumeInfo?.publisher || '',
      categories: item.volumeInfo?.categories || [],
      pageCount: item.volumeInfo?.pageCount || 0,
      previewLink: item.volumeInfo?.previewLink || '',
      infoLink: item.volumeInfo?.infoLink || '',
    }));
    res.json({ books, total: data.totalItems || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to search books.' });
  }
};

// GET /api/resources/books/recommend?category=leadership-skills&maxResults=6
exports.recommendBooks = async (req, res) => {
  try {
    const { category = 'leadership', maxResults = 6 } = req.query;
    const categoryQueryMap = {
      'leadership-skills': 'women leadership business empowerment',
      'communication': 'professional communication skills women',
      'negotiation': 'negotiation business strategies women',
      'time-management': 'time management productivity professional women',
      'career-planning': 'women career development professional growth',
      'work-life-balance': 'work life balance women career',
      'networking': 'professional networking business relationships',
    };
    const query = categoryQueryMap[category] || `${category} professional women`;
    const apiKey = process.env.BOOKS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Google Books API key not configured.' });
    }
    const limit = Math.min(12, parseInt(maxResults, 10) || 6);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&orderBy=relevance&langRestrict=en&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: 'Google Books API request failed.' });
    }
    const data = await response.json();
    const books = (data.items || []).map((item) => ({
      id: item.id,
      title: item.volumeInfo?.title || '',
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description || '',
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || '',
      publishedDate: item.volumeInfo?.publishedDate || '',
      publisher: item.volumeInfo?.publisher || '',
      categories: item.volumeInfo?.categories || [],
      previewLink: item.volumeInfo?.previewLink || '',
      infoLink: item.volumeInfo?.infoLink || '',
    }));
    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get book recommendations.' });
  }
};
