const Story = require('../models/Story');

const createStoryRecord = async ({ title, content, excerpt, category, images, authorId }) => {
  const story = await Story.create({
    title,
    content,
    excerpt: excerpt || (content.slice(0, 300) + (content.length > 300 ? '...' : '')),
    category: category || 'other',
    images: Array.isArray(images) ? images : [],
    author: authorId,
  });
  await story.populate('author', 'name email avatar');
  return story;
};

const getStoriesPaginated = async ({ page = 1, limit = 10, category, sort = '-createdAt' }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

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

  const storiesWithCounts = stories.map((s) => ({
    ...s,
    likeCount: s.likes ? s.likes.length : 0,
    likes: undefined,
  }));

  return {
    stories: storiesWithCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getStoryByIdAndIncrementViews = async (storyId, userId) => {
  const story = await Story.findByIdAndUpdate(
    storyId,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('author', 'name email avatar bio')
    .lean();

  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }

  const likeCount = story.likes ? story.likes.length : 0;
  const userLiked = userId && story.likes && story.likes.some((id) => id.toString() === userId.toString());
  return {
    ...story,
    likeCount,
    userLiked: !!userLiked,
  };
};

const updateStoryById = async (storyId, userId, userRole, updates) => {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }

  const isAuthor = story.author.toString() === userId.toString();
  const isAdmin = userRole === 'Admin';
  if (!isAuthor && !isAdmin) {
    const err = new Error('You can only update your own story.');
    err.status = 403;
    throw err;
  }

  const { title, content, excerpt, category, images } = updates;
  if (title !== undefined) story.title = title;
  if (content !== undefined) story.content = content;
  if (excerpt !== undefined) story.excerpt = excerpt;
  if (category !== undefined) story.category = category;
  if (Array.isArray(images)) story.images = images;

  await story.save();
  await story.populate('author', 'name email avatar');
  return story;
};

const deleteStoryById = async (storyId, userId, userRole) => {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }

  const isAuthor = story.author.toString() === userId.toString();
  const isAdmin = userRole === 'Admin';
  if (!isAuthor && !isAdmin) {
    const err = new Error('You can only delete your own story.');
    err.status = 403;
    throw err;
  }

  await Story.findByIdAndDelete(storyId);
  return { message: 'Story deleted.' };
};

const toggleStoryLike = async (storyId, userId) => {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error('Story not found.');
    err.status = 404;
    throw err;
  }

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
  return { likeCount, userLiked };
};

module.exports = {
  createStoryRecord,
  getStoriesPaginated,
  getStoryByIdAndIncrementViews,
  updateStoryById,
  deleteStoryById,
  toggleStoryLike,
};
