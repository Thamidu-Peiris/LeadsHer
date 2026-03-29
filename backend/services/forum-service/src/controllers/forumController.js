const forumService = require('../services/forumService');

// POST /api/forum/topics
exports.createTopic = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const topic = await forumService.createTopic({
      title, content, category, tags, authorId: req.user._id,
    });
    res.status(201).json(topic);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to create topic.' });
  }
};

// GET /api/forum/topics
exports.getTopics = async (req, res) => {
  try {
    const result = await forumService.getTopicsPaginated({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      tag: req.query.tag,
      search: req.query.search,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get topics.' });
  }
};

// GET /api/forum/my-topics
exports.getMyTopics = async (req, res) => {
  try {
    const result = await forumService.getMyTopics(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get your topics.' });
  }
};

// GET /api/forum/topics/:id
exports.getTopicById = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const result = await forumService.getTopicByIdWithReplies(req.params.id, userId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get topic.' });
  }
};

// PUT /api/forum/topics/:id
exports.updateTopic = async (req, res) => {
  try {
    const topic = await forumService.updateTopic(
      req.params.id, req.user._id, req.user.role, req.body
    );
    res.json(topic);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update topic.' });
  }
};

// DELETE /api/forum/topics/:id
exports.deleteTopic = async (req, res) => {
  try {
    const result = await forumService.deleteTopic(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete topic.' });
  }
};

// POST /api/forum/topics/:id/replies
exports.createReply = async (req, res) => {
  try {
    const reply = await forumService.createReply({
      topicId: req.params.id,
      content: req.body.content,
      authorId: req.user._id,
      parentReplyId: req.body.parentReplyId || null,
    });
    res.status(201).json(reply);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to create reply.' });
  }
};

// PUT /api/forum/replies/:id
exports.updateReply = async (req, res) => {
  try {
    const reply = await forumService.updateReply(
      req.params.id, req.user._id, req.user.role, { content: req.body.content }
    );
    res.json(reply);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update reply.' });
  }
};

// DELETE /api/forum/replies/:id
exports.deleteReply = async (req, res) => {
  try {
    const result = await forumService.deleteReply(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete reply.' });
  }
};

// POST /api/forum/posts/:id/vote
exports.votePost = async (req, res) => {
  try {
    const result = await forumService.votePost({
      postId: req.params.id,
      userId: req.user._id,
      type: req.body.type,
      postType: req.body.postType,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to vote.' });
  }
};

// POST /api/forum/posts/:id/report
exports.reportPost = async (req, res) => {
  try {
    const report = await forumService.reportPost({
      postId: req.params.id,
      userId: req.user._id,
      postType: req.body.postType,
      reason: req.body.reason,
      description: req.body.description,
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to report post.' });
  }
};

// PUT /api/forum/replies/:id/accept
exports.markAcceptedAnswer = async (req, res) => {
  try {
    const reply = await forumService.markAcceptedAnswer(req.params.id, req.user._id, req.user.role);
    res.json(reply);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to mark accepted answer.' });
  }
};

// PUT /api/forum/topics/:id/pin
exports.togglePin = async (req, res) => {
  try {
    const topic = await forumService.togglePin(req.params.id, req.user.role);
    res.json(topic);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to toggle pin.' });
  }
};

// PUT /api/forum/topics/:id/close
exports.toggleClose = async (req, res) => {
  try {
    const topic = await forumService.toggleClose(req.params.id, req.user._id, req.user.role);
    res.json(topic);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to toggle close.' });
  }
};

// GET /api/forum/reports
exports.getReports = async (req, res) => {
  try {
    const result = await forumService.getReports({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get reports.' });
  }
};

// PUT /api/forum/reports/:id
exports.resolveReport = async (req, res) => {
  try {
    const report = await forumService.resolveReport(req.params.id, req.user._id, req.body.action);
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to resolve report.' });
  }
};
