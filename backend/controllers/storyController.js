//Thamidu
const Story = require('../models/Story');

// POST /api/stories/upload - Upload image for story (returns URL to use in story.images)
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

// POST /api/stories - Create new story (protected)
exports.createStory = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, content, excerpt, category, images } = body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const story = await Story.create({
      title,
      content,
      excerpt: excerpt || (content.slice(0, 300) + (content.length > 300 ? '...' : '')),
      category: category || 'other',
      images: Array.isArray(images) ? images : [],
      author: req.user._id,
    });
    await story.populate('author', 'name email avatar');
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create story.' });
  }
};

// GET /api/stories - Get all stories (pagination, filters)
exports.getAllStories = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const category = req.query.category; // e.g. ?category=leadership
    const sort = req.query.sort || '-createdAt'; // -createdAt, createdAt, -viewCount, -likes

    const query = {};
    if (category) query.category = category;

    const [stories, total] = await Promise.all([
      Story.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .lean(),
      Story.countDocuments(query),
    ]);

    // Add likeCount for each story (likes array length)
    const storiesWithCounts = stories.map((s) => ({
      ...s,
      likeCount: s.likes ? s.likes.length : 0,
      likes: undefined, // don't send full likes array in list view
    }));

    res.json({
      stories: storiesWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get stories.' });
  }
};

// GET /api/stories/:id - Get single story (increments viewCount)
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('author', 'name email avatar bio')
      .lean();

    if (!story) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    const likeCount = story.likes ? story.likes.length : 0;
    const userLiked = req.user && story.likes && story.likes.some((id) => id.toString() === req.user._id.toString());
    res.json({
      ...story,
      likeCount,
      userLiked: !!userLiked,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get story.' });
  }
};

// PUT /api/stories/:id - Update story (author or admin)
exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found.' });

    const isAuthor = story.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'You can only update your own story.' });
    }

    const body = req.body || {};
    const { title, content, excerpt, category, images } = body;
    if (title !== undefined) story.title = title;
    if (content !== undefined) story.content = content;
    if (excerpt !== undefined) story.excerpt = excerpt;
    if (category !== undefined) story.category = category;
    if (Array.isArray(images)) story.images = images;

    await story.save();
    await story.populate('author', 'name email avatar');
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update story.' });
  }
};

// DELETE /api/stories/:id - Delete story (author or admin)
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found.' });

    const isAuthor = story.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own story.' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete story.' });
  }
};

// POST /api/stories/:id/like - Like/unlike a story (toggle)
exports.toggleLike = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found.' });

    const userId = req.user._id;
    const likes = story.likes || [];
    const index = likes.findIndex((id) => id.toString() === userId.toString());

    if (index === -1) {
      story.likes.push(userId);
    } else {
      story.likes.splice(index, 1);
    }
    await story.save();

    const likeCount = story.likes.length;
    const userLiked = story.likes.some((id) => id.toString() === userId.toString());
    res.json({ likeCount, userLiked });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to toggle like.' });
  }
};
