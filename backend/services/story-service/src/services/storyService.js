const Story = require('../models/Story');
const Comment = require('../models/Comment');
const User = require('../models/User');

const normalizeRole = (r) => String(r || '').toLowerCase();
const isAdminRole = (r) => normalizeRole(r) === 'admin';

/** 1 hero + 5 “More featured” on /stories */
const MAX_FEATURED_STORIES = 6;

const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ');

const wordCount = (content) => {
  const text = stripHtml(content).replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
};

const computeReadingTimeMinutes = (content) => {
  const wc = wordCount(content);
  return Math.max(1, Math.ceil(wc / 200)); // 200 wpm
};

const computeExcerpt = (content, providedExcerpt) => {
  if (typeof providedExcerpt === 'string' && providedExcerpt.trim()) return providedExcerpt.trim().slice(0, 300);
  const text = stripHtml(content).replace(/\s+/g, ' ').trim();
  if (text.length <= 300) return text;
  return text.slice(0, 297) + '...';
};

const sortFeaturedByOrder = (list) =>
  [...list].sort((a, b) => {
    const ao = a.featuredOrder != null ? a.featuredOrder : Number.MAX_SAFE_INTEGER;
    const bo = b.featuredOrder != null ? b.featuredOrder : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
  });

const enforceFeaturedLimit = async (storyIdToKeep) => {
  const list = await Story.find({ isFeatured: true, status: 'published' })
    .select('_id featuredOrder publishedAt')
    .lean();
  if (list.length <= MAX_FEATURED_STORIES) return;

  const keepId = storyIdToKeep.toString();
  const sorted = sortFeaturedByOrder(list);
  const keepFirst = sorted.find((s) => s._id.toString() === keepId);
  const rest = sorted.filter((s) => s._id.toString() !== keepId);
  const merged = keepFirst ? [keepFirst, ...rest] : rest;
  const keepIds = new Set(merged.slice(0, MAX_FEATURED_STORIES).map((s) => s._id.toString()));
  const toUnfeature = list.filter((s) => !keepIds.has(s._id.toString())).map((s) => s._id);
  if (toUnfeature.length) {
    await Story.updateMany(
      { _id: { $in: toUnfeature } },
      { $set: { isFeatured: false, featuredOrder: null } }
    );
  }
};

const reorderFeaturedStory = async (storyId, direction) => {
  const list = await Story.find({ isFeatured: true, status: 'published' })
    .select('_id featuredOrder publishedAt')
    .lean();
  const sorted = sortFeaturedByOrder(list);
  const idx = sorted.findIndex((s) => s._id.toString() === storyId.toString());
  if (idx < 0) {
    const err = new Error('Story is not in the featured list.');
    err.status = 400;
    throw err;
  }
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) {
    const populated = await Story.findById(storyId).populate('author', 'name profilePicture avatar').lean();
    return {
      ...populated,
      likeCount: populated.likes ? populated.likes.length : 0,
      likes: undefined,
    };
  }
  const next = [...sorted];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
  await Promise.all(next.map((s, i) => Story.updateOne({ _id: s._id }, { $set: { featuredOrder: i } })));
  const populated = await Story.findById(storyId).populate('author', 'name profilePicture avatar').lean();
  return {
    ...populated,
    likeCount: populated.likes ? populated.likes.length : 0,
    likes: undefined,
  };
};

const createStoryRecord = async ({ authorId, title, content, excerpt, coverImage, category, tags, status }) => {
  const s = String(status || 'draft');
  const desiredStatus = s === 'published' ? 'published' : 'draft';

  if (desiredStatus === 'published' && wordCount(content) < 100) {
    const err = new Error('Minimum 100 words required to publish a story.');
    err.status = 400;
    throw err;
  }

  const story = await Story.create({
    author: authorId,
    title,
    content,
    excerpt: computeExcerpt(content, excerpt),
    coverImage: coverImage || '',
    category,
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    status: desiredStatus,
    readingTime: computeReadingTimeMinutes(content),
    publishedAt: desiredStatus === 'published' ? new Date() : null,
  });
  await story.populate('author', 'name profilePicture avatar');
  return story.toObject();
};

const canViewStory = (story, userId, userRole) => {
  if (story.status === 'published') return true;
  if (!userId) return false;
  const isAuthor = story.author.toString() === userId.toString();
  return isAuthor || isAdminRole(userRole);
};

const getStoryByIdAndIncrementViews = async (storyId, userId, userRole) => {
  const story = await Story.findById(storyId).populate('author', 'name profilePicture avatar role').lean();
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  if (!canViewStory(story, userId, userRole)) {
    const err = new Error('Access denied for this story.');
    err.status = 403;
    throw err;
  }

  if (story.status === 'published') {
    await Story.updateOne({ _id: storyId }, { $inc: { views: 1, viewCount: 1 } });
    story.views = (story.views || 0) + 1;
  }

  const likeCount = story.likes ? story.likes.length : 0;
  const userLiked = userId && story.likes && story.likes.some((id) => id.toString() === userId.toString());
  const commentCount = await Comment.countDocuments({ story: storyId });
  return {
    ...story,
    likeCount,
    userLiked: !!userLiked,
    commentCount,
  };
};

const getStoriesPaginated = async ({
  page = 1,
  limit = 10,
  category,
  sort = 'newest',
  search,
  tag,
  tags,
  author,
  from,
  to,
  userId,
  userRole,
  featured,
}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = {};
  // Visibility rules: public sees published only; authenticated sees own drafts too
  if (userId) {
    query.$or = [{ status: 'published' }, { status: 'draft', author: userId }];
    if (isAdminRole(userRole)) {
      delete query.$or; // admin sees all
    }
  } else {
    query.status = 'published';
  }

  if (category) query.category = category;
  if (featured === '1' || featured === 'true') query.isFeatured = true;
  if (author) query.author = author;

  const tagList = []
    .concat(typeof tag === 'string' ? [tag] : [])
    .concat(typeof tags === 'string' ? tags.split(',') : Array.isArray(tags) ? tags : [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  if (tagList.length) query.tags = { $in: tagList };

  if (from || to) {
    const range = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    query.createdAt = range;
  }

  if (search) {
    query.$text = { $search: String(search) };
  }

  const sortMap = {
    newest: { publishedAt: -1, createdAt: -1 },
    oldest: { createdAt: 1 },
    mostViewed: { views: -1, createdAt: -1 },
  };

  if (sort === 'mostLiked') {
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likes', []] } },
        },
      },
      { $sort: { likeCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    const countPipeline = [{ $match: query }, { $count: 'total' }];
    const [stories, countRes] = await Promise.all([
      Story.aggregate(pipeline),
      Story.aggregate(countPipeline),
    ]);
    const total = countRes?.[0]?.total || 0;
    const populated = await Story.populate(stories, { path: 'author', select: 'name profilePicture avatar' });
    const commentCounts = await Comment.aggregate([
      { $match: { story: { $in: populated.map((s) => s._id) } } },
      { $group: { _id: '$story', count: { $sum: 1 } } },
    ]);
    const commentMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));

    const out = populated.map((s) => ({
      ...s,
      likeCount: s.likeCount ?? (s.likes ? s.likes.length : 0),
      commentCount: commentMap.get(String(s._id)) || 0,
      likes: undefined,
    }));
    return {
      stories: out,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  const mongoSort = sortMap[sort] || { createdAt: -1 };

  const [stories, total] = await Promise.all([
    Story.find(query)
      .sort(mongoSort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePicture avatar')
      .lean(),
    Story.countDocuments(query),
  ]);

  const commentCounts = await Comment.aggregate([
    { $match: { story: { $in: stories.map((s) => s._id) } } },
    { $group: { _id: '$story', count: { $sum: 1 } } },
  ]);
  const commentMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));

  const out = stories.map((s) => ({
    ...s,
    likeCount: s.likes ? s.likes.length : 0,
    commentCount: commentMap.get(String(s._id)) || 0,
    likes: undefined,
  }));

  return { stories: out, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateStoryById = async (storyId, userId, userRole, updates) => {
  if (updates.featuredReorder === 'up' || updates.featuredReorder === 'down') {
    if (!isAdminRole(userRole)) {
      const err = new Error('Only admin can reorder featured stories.');
      err.status = 403;
      throw err;
    }
    return reorderFeaturedStory(storyId, updates.featuredReorder);
  }

  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  const isAuthor = story.author.toString() === userId.toString();
  const isAdmin = isAdminRole(userRole);
  if (!isAuthor && !isAdmin) {
    const err = new Error('Only the author or an admin can update this story.');
    err.status = 403;
    throw err;
  }

  // Store original status before applying updates
  const originalStatus = story.status;

  const allowed = ['title', 'content', 'excerpt', 'category', 'tags', 'coverImage', 'status'];
  allowed.forEach((k) => {
    if (updates[k] !== undefined) story[k] = updates[k];
  });

  if (Array.isArray(updates.tags)) {
    if (updates.tags.length > 5) {
      const err = new Error('Maximum 5 tags allowed.');
      err.status = 400;
      throw err;
    }
    story.tags = updates.tags;
  }

  if (updates.content !== undefined) {
    story.readingTime = computeReadingTimeMinutes(story.content);
    // Regenerate excerpt from new content unless explicitly provided
    story.excerpt = computeExcerpt(story.content, updates.excerpt);
  }

  // Publish rule - check original status, not updated status
  if (updates.status === 'published' && originalStatus !== 'published') {
    if (wordCount(story.content) < 100) {
      const err = new Error('Minimum 100 words required to publish a story.');
      err.status = 400;
      throw err;
    }
    story.status = 'published';
    story.publishedAt = new Date();
  }

  // Backfill publishedAt (for stories published before bugfix)
  if (story.status === 'published' && !story.publishedAt) {
    story.publishedAt = new Date();
  }

  // Featured stories (admin only)
  if (updates.isFeatured !== undefined) {
    if (!isAdmin) {
      const err = new Error('Only admin can feature stories.');
      err.status = 403;
      throw err;
    }
    const wasFeatured = story.isFeatured;
    const turningOn = !!updates.isFeatured;
    story.isFeatured = turningOn;
    if (turningOn && !wasFeatured) {
      if (story.status !== 'published') {
        const err = new Error('Only published stories can be featured.');
        err.status = 400;
        throw err;
      }
      const others = await Story.find({
        isFeatured: true,
        status: 'published',
        _id: { $ne: story._id },
      })
        .select('featuredOrder')
        .lean();
      const maxOrder = others.reduce((m, o) => {
        const v = o.featuredOrder;
        if (v == null) return m;
        return Math.max(m, v);
      }, -1);
      story.featuredOrder = maxOrder + 1;
    } else if (!turningOn) {
      story.featuredOrder = null;
    }
  }

  await story.save();
  if (story.isFeatured) await enforceFeaturedLimit(story._id);

  const populated = await Story.findById(storyId).populate('author', 'name profilePicture avatar').lean();
  return {
    ...populated,
    likeCount: populated.likes ? populated.likes.length : 0,
    likes: undefined,
  };
};

const deleteStoryById = async (storyId, userId, userRole) => {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  const isAuthor = story.author.toString() === userId.toString();
  const isAdmin = isAdminRole(userRole);
  if (!isAuthor && !isAdmin) {
    const err = new Error('Only the author or an admin can delete this story.');
    err.status = 403;
    throw err;
  }
  await Promise.all([
    Story.findByIdAndDelete(storyId),
    Comment.deleteMany({ story: storyId }),
  ]);
  return { message: 'Story deleted.' };
};

const toggleStoryLike = async (storyId, userId) => {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  if (story.status !== 'published') {
    const err = new Error('You can only like published stories.');
    err.status = 400;
    throw err;
  }
  const likes = story.likes || [];
  const index = likes.findIndex((id) => id.toString() === userId.toString());
  if (index === -1) story.likes.push(userId);
  else story.likes.splice(index, 1);
  await story.save();
  return { likeCount: story.likes.length, userLiked: story.likes.some((id) => id.toString() === userId.toString()) };
};

const getCommentsForStory = async (storyId, { page = 1, limit = 20 } = {}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find({ story: storyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profilePicture avatar')
      .lean(),
    Comment.countDocuments({ story: storyId }),
  ]);
  return { comments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const addCommentToStory = async (storyId, userId, content) => {
  const story = await Story.findById(storyId).select('status');
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  if (story.status !== 'published') {
    const err = new Error('Comments are allowed only on published stories.');
    err.status = 400;
    throw err;
  }
  const comment = await Comment.create({ story: storyId, user: userId, content });
  await comment.populate('user', 'name profilePicture avatar');
  return comment.toObject();
};

const deleteCommentFromStory = async (storyId, commentId, userId, role) => {
  const [story, comment] = await Promise.all([
    Story.findById(storyId).select('author'),
    Comment.findOne({ _id: commentId, story: storyId }).select('user story'),
  ]);

  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }
  if (!comment) {
    const err = new Error('Comment not found.');
    err.status = 404;
    throw err;
  }

  const isAdmin = role === 'admin';
  const isCommentOwner = comment.user?.toString() === userId.toString();
  const isStoryAuthor = story.author?.toString() === userId.toString();
  if (!isAdmin && !isCommentOwner && !isStoryAuthor) {
    const err = new Error('Not allowed to delete this comment.');
    err.status = 403;
    throw err;
  }

  await Comment.deleteOne({ _id: commentId });
  return { success: true };
};

const getStoriesByUser = async (targetUserId, { page = 1, limit = 10 } = {}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;
  const query = { author: targetUserId, status: 'published' };
  const [stories, total] = await Promise.all([
    Story.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePicture avatar')
      .lean(),
    Story.countDocuments(query),
  ]);
  return { stories, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getMyStories = async (userId, { page = 1, limit = 50 } = {}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (page - 1) * limit;

  const query = { author: userId };
  const [stories, total] = await Promise.all([
    Story.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePicture avatar')
      .lean(),
    Story.countDocuments(query),
  ]);

  const out = stories.map((s) => ({
    ...s,
    likeCount: s.likes ? s.likes.length : 0,
    likes: undefined,
  }));

  return { stories: out, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getFeaturedStories = async () => {
  const raw = await Story.aggregate([
    { $match: { status: 'published', isFeatured: true } },
    {
      $addFields: {
        _sortOrder: { $ifNull: ['$featuredOrder', 999999] },
      },
    },
    { $sort: { _sortOrder: 1, publishedAt: -1, createdAt: -1 } },
    { $limit: MAX_FEATURED_STORIES },
    { $project: { _sortOrder: 0 } },
  ]);
  const stories = await Story.populate(raw, {
    path: 'author',
    select: 'name profilePicture avatar',
  });
  return stories.map((s) => ({ ...s, likeCount: s.likes ? s.likes.length : 0, likes: undefined }));
};

module.exports = {
  createStoryRecord,
  getStoriesPaginated,
  getStoryByIdAndIncrementViews,
  updateStoryById,
  deleteStoryById,
  toggleStoryLike,
  getCommentsForStory,
  addCommentToStory,
  deleteCommentFromStory,
  getStoriesByUser,
  getMyStories,
  getFeaturedStories,
  wordCount,
};
