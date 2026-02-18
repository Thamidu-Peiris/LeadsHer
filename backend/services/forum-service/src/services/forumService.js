const ForumTopic = require('../models/ForumTopic');
const ForumReply = require('../models/ForumReply');
const Report = require('../models/Report');

const createTopic = async ({ title, content, category, tags, authorId }) => {
  const topic = await ForumTopic.create({
    title,
    content,
    category: category || 'general',
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    author: authorId,
  });
  await topic.populate('author', 'name avatar');
  return topic;
};

const getTopicsPaginated = async ({ page = 1, limit = 10, category, tag, search, sort = 'newest' }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = {};
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption;
  switch (sort) {
    case 'trending':
      sortOption = { views: -1, createdAt: -1 };
      break;
    case 'most-discussed':
      sortOption = { replyCount: -1, createdAt: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  // Pinned topics first, then sorted
  const [pinned, topics, total] = await Promise.all([
    ForumTopic.find({ ...query, isPinned: true })
      .sort(sortOption)
      .populate('author', 'name avatar')
      .lean(),
    ForumTopic.find({ ...query, isPinned: { $ne: true } })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .lean(),
    ForumTopic.countDocuments({ ...query, isPinned: { $ne: true } }),
  ]);

  const addVoteCounts = (t) => ({
    ...t,
    upvoteCount: t.upvotes ? t.upvotes.length : 0,
    downvoteCount: t.downvotes ? t.downvotes.length : 0,
    upvotes: undefined,
    downvotes: undefined,
  });

  return {
    pinned: pinned.map(addVoteCounts),
    topics: topics.map(addVoteCounts),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getTopicByIdWithReplies = async (topicId, userId, { page = 1, limit = 20 } = {}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (page - 1) * limit;

  const topic = await ForumTopic.findByIdAndUpdate(
    topicId,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('author', 'name email avatar bio')
    .lean();

  if (!topic) {
    const err = new Error('Topic not found.');
    err.status = 404;
    throw err;
  }

  const [replies, replyTotal] = await Promise.all([
    ForumReply.find({ topic: topicId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .lean(),
    ForumReply.countDocuments({ topic: topicId }),
  ]);

  const userVote = userId
    ? topic.upvotes?.some((id) => id.toString() === userId.toString())
      ? 'upvote'
      : topic.downvotes?.some((id) => id.toString() === userId.toString())
        ? 'downvote'
        : null
    : null;

  const mapReply = (r) => {
    const rv = userId
      ? r.upvotes?.some((id) => id.toString() === userId.toString())
        ? 'upvote'
        : r.downvotes?.some((id) => id.toString() === userId.toString())
          ? 'downvote'
          : null
      : null;
    return {
      ...r,
      upvoteCount: r.upvotes ? r.upvotes.length : 0,
      downvoteCount: r.downvotes ? r.downvotes.length : 0,
      userVote: rv,
      upvotes: undefined,
      downvotes: undefined,
    };
  };

  return {
    ...topic,
    upvoteCount: topic.upvotes ? topic.upvotes.length : 0,
    downvoteCount: topic.downvotes ? topic.downvotes.length : 0,
    userVote,
    upvotes: undefined,
    downvotes: undefined,
    replies: replies.map(mapReply),
    replyPagination: { page, limit, total: replyTotal, totalPages: Math.ceil(replyTotal / limit) },
  };
};

const updateTopic = async (topicId, userId, userRole, updates) => {
  const topic = await ForumTopic.findById(topicId);
  if (!topic) {
    const err = new Error('Topic not found.');
    err.status = 404;
    throw err;
  }
  if (topic.author.toString() !== userId.toString() && userRole !== 'Admin') {
    const err = new Error('Not authorized to update this topic.');
    err.status = 403;
    throw err;
  }

  const { title, content, category, tags } = updates;
  if (title) topic.title = title;
  if (content) topic.content = content;
  if (category) topic.category = category;
  if (tags) topic.tags = tags.slice(0, 10);

  // Admin-only fields
  if (userRole === 'Admin') {
    if (updates.isPinned !== undefined) topic.isPinned = updates.isPinned;
    if (updates.isClosed !== undefined) topic.isClosed = updates.isClosed;
  }

  await topic.save();
  await topic.populate('author', 'name avatar');
  return topic;
};

const deleteTopic = async (topicId, userId, userRole) => {
  const topic = await ForumTopic.findById(topicId);
  if (!topic) {
    const err = new Error('Topic not found.');
    err.status = 404;
    throw err;
  }
  if (topic.author.toString() !== userId.toString() && userRole !== 'Admin') {
    const err = new Error('Not authorized to delete this topic.');
    err.status = 403;
    throw err;
  }

  await Promise.all([
    ForumReply.deleteMany({ topic: topicId }),
    Report.deleteMany({ post: topicId }),
    ForumTopic.findByIdAndDelete(topicId),
  ]);

  return { message: 'Topic deleted successfully.' };
};

const createReply = async ({ topicId, content, authorId }) => {
  const topic = await ForumTopic.findById(topicId);
  if (!topic) {
    const err = new Error('Topic not found.');
    err.status = 404;
    throw err;
  }
  if (topic.isClosed) {
    const err = new Error('This topic is closed for replies.');
    err.status = 400;
    throw err;
  }

  const reply = await ForumReply.create({
    topic: topicId,
    content,
    author: authorId,
  });

  topic.replyCount += 1;
  topic.lastActivity = new Date();
  await topic.save();

  await reply.populate('author', 'name avatar');
  return reply;
};

const updateReply = async (replyId, userId, userRole, { content }) => {
  const reply = await ForumReply.findById(replyId);
  if (!reply) {
    const err = new Error('Reply not found.');
    err.status = 404;
    throw err;
  }
  if (reply.author.toString() !== userId.toString() && userRole !== 'Admin') {
    const err = new Error('Not authorized to update this reply.');
    err.status = 403;
    throw err;
  }

  reply.content = content;
  await reply.save();
  await reply.populate('author', 'name avatar');
  return reply;
};

const deleteReply = async (replyId, userId, userRole) => {
  const reply = await ForumReply.findById(replyId);
  if (!reply) {
    const err = new Error('Reply not found.');
    err.status = 404;
    throw err;
  }
  if (reply.author.toString() !== userId.toString() && userRole !== 'Admin') {
    const err = new Error('Not authorized to delete this reply.');
    err.status = 403;
    throw err;
  }

  await ForumTopic.findByIdAndUpdate(reply.topic, { $inc: { replyCount: -1 } });
  await Report.deleteMany({ post: replyId });
  await ForumReply.findByIdAndDelete(replyId);

  return { message: 'Reply deleted successfully.' };
};

const votePost = async ({ postId, userId, type, postType }) => {
  const Model = postType === 'topic' ? ForumTopic : ForumReply;
  const post = await Model.findById(postId);
  if (!post) {
    const err = new Error(`${postType === 'topic' ? 'Topic' : 'Reply'} not found.`);
    err.status = 404;
    throw err;
  }

  const upIdx = post.upvotes.findIndex((id) => id.toString() === userId.toString());
  const downIdx = post.downvotes.findIndex((id) => id.toString() === userId.toString());

  if (type === 'upvote') {
    if (upIdx !== -1) {
      post.upvotes.splice(upIdx, 1); // toggle off
    } else {
      if (downIdx !== -1) post.downvotes.splice(downIdx, 1); // switch
      post.upvotes.push(userId);
    }
  } else {
    if (downIdx !== -1) {
      post.downvotes.splice(downIdx, 1); // toggle off
    } else {
      if (upIdx !== -1) post.upvotes.splice(upIdx, 1); // switch
      post.downvotes.push(userId);
    }
  }

  await post.save();
  return {
    upvoteCount: post.upvotes.length,
    downvoteCount: post.downvotes.length,
  };
};

const reportPost = async ({ postId, userId, postType, reason, description }) => {
  const Model = postType === 'topic' ? ForumTopic : ForumReply;
  const post = await Model.findById(postId);
  if (!post) {
    const err = new Error(`${postType === 'topic' ? 'Topic' : 'Reply'} not found.`);
    err.status = 404;
    throw err;
  }

  const existing = await Report.findOne({ reporter: userId, post: postId });
  if (existing) {
    const err = new Error('You have already reported this post.');
    err.status = 400;
    throw err;
  }

  const report = await Report.create({
    reporter: userId,
    postType,
    post: postId,
    reason,
    description: description || '',
  });

  return report;
};

const getMyTopics = async (userId, { page = 1, limit = 10 } = {}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [topics, total] = await Promise.all([
    ForumTopic.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .lean(),
    ForumTopic.countDocuments({ author: userId }),
  ]);

  const mapped = topics.map((t) => ({
    ...t,
    upvoteCount: t.upvotes ? t.upvotes.length : 0,
    downvoteCount: t.downvotes ? t.downvotes.length : 0,
    upvotes: undefined,
    downvotes: undefined,
  }));

  return {
    topics: mapped,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  createTopic,
  getTopicsPaginated,
  getTopicByIdWithReplies,
  updateTopic,
  deleteTopic,
  createReply,
  updateReply,
  deleteReply,
  votePost,
  reportPost,
  getMyTopics,
};
