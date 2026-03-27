const fs = require('fs');
const mongoose = require('mongoose');
const storyService = require('../services/storyService');
const { getCloudinary } = require('../config/cloudinary');

// POST /api/stories/upload (image/video)
exports.uploadStoryMedia = async (req, res) => {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: 'No media file provided.' });
    }

    const cloudinary = getCloudinary();
    if (cloudinary && req.file.path) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: 'leadsher/stories',
        resource_type: 'auto',
      });
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res.status(201).json({ url: uploadRes.secure_url, provider: 'cloudinary' });
    }

    const url = '/uploads/stories/' + req.file.filename;
    res.status(201).json({ url, provider: 'local' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
};

// POST /api/stories
exports.createStory = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, content, excerpt, category, coverImage, tags, status } = body;
    const desiredStatus = status === 'published' ? 'published' : 'draft';
    const safeTitle = String(title || '').trim();
    const safeContent = String(content || '').trim();

    if (desiredStatus === 'published' && (!safeTitle || !safeContent)) {
      return res.status(400).json({ message: 'Title and content are required to publish.' });
    }
    if (desiredStatus === 'draft' && !safeTitle && !safeContent) {
      return res.status(400).json({ message: 'Add at least a title or some content to save draft.' });
    }

    const story = await storyService.createStoryRecord({
      title: safeTitle || 'Untitled Draft',
      content: safeContent || ' ',
      excerpt,
      category,
      coverImage,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: desiredStatus,
      authorId: req.user._id,
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
      search: req.query.search,
      tag: req.query.tag,
      tags: req.query.tags,
      author: req.query.author,
      from: req.query.from,
      to: req.query.to,
      featured: req.query.featured,
      userId: req.user?._id,
      userRole: req.user?.role,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get stories.' });
  }
};

// GET /api/stories/:id
exports.getStoryById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Story not found.' });
    }
    const userId = req.user ? req.user._id : null;
    const userRole = req.user ? req.user.role : null;
    const story = await storyService.getStoryByIdAndIncrementViews(req.params.id, userId, userRole);
    res.json(story);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get story.' });
  }
};

// PUT /api/stories/:id
exports.updateStory = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = { ...body };
    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    const story = await storyService.updateStoryById(req.params.id, req.user._id, req.user.role, updates);
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

// GET /api/stories/:id/comments
exports.getStoryComments = async (req, res) => {
  try {
    const result = await storyService.getCommentsForStory(req.params.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get comments.' });
  }
};

// POST /api/stories/:id/comments
exports.addStoryComment = async (req, res) => {
  try {
    const content = req.body?.content;
    if (!content) return res.status(400).json({ message: 'Comment content is required.' });
    const comment = await storyService.addCommentToStory(req.params.id, req.user._id, content);
    res.status(201).json(comment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to add comment.' });
  }
};

// GET /api/stories/user/:userId
exports.getStoriesByUser = async (req, res) => {
  try {
    const result = await storyService.getStoriesByUser(req.params.userId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get user stories.' });
  }
};

// GET /api/stories/mine
exports.getMyStories = async (req, res) => {
  try {
    const result = await storyService.getMyStories(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get my stories.' });
  }
};

// GET /api/stories/featured
exports.getFeaturedStories = async (req, res) => {
  try {
    const stories = await storyService.getFeaturedStories();
    res.json({ stories });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get featured stories.' });
  }
};
