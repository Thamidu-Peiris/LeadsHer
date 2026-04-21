/**
 * Unit Tests — forumService
 * Tests pure service logic in isolation with an in-memory MongoDB.
 */
process.env.JWT_SECRET = 'test-jwt-secret-unit';
process.env.NODE_ENV = 'test';

const { Types } = require('mongoose');
const { connect, disconnect, clearCollections } = require('../helpers/db');
const forumService = require('../../src/services/forumService');
const User = require('../../src/models/User');
const ForumTopic = require('../../src/models/ForumTopic');

// ── Helpers ───────────────────────────────────────────────────────────────────

const createUser = (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random()}@example.com`,
    password: 'hashedpassword',
    role: 'mentee',
    ...overrides,
  });

const createTopic = (authorId, overrides = {}) =>
  forumService.createTopic({
    title: 'Default Topic Title',
    content: 'Default topic content here.',
    category: 'general',
    tags: ['tag1'],
    authorId,
    ...overrides,
  });

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
beforeEach(async () => { await clearCollections(); });

// ── createTopic ───────────────────────────────────────────────────────────────

describe('createTopic', () => {
  it('creates a topic and returns it with author populated', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    expect(topic._id).toBeDefined();
    expect(topic.title).toBe('Default Topic Title');
    expect(topic.author.name).toBe('Test User');
    expect(topic.replyCount).toBe(0);
    expect(topic.isPinned).toBe(false);
    expect(topic.isClosed).toBe(false);
  });

  it('defaults category to "general" when not provided', async () => {
    const user = await createUser();
    const topic = await forumService.createTopic({
      title: 'No Category Topic',
      content: 'Some content.',
      authorId: user._id,
    });
    expect(topic.category).toBe('general');
  });

  it('limits tags to a maximum of 10', async () => {
    const user = await createUser();
    const manyTags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const topic = await forumService.createTopic({
      title: 'Many Tags Topic',
      content: 'Content.',
      tags: manyTags,
      authorId: user._id,
    });
    expect(topic.tags.length).toBe(10);
  });

  it('stores an empty tags array when tags are not provided', async () => {
    const user = await createUser();
    const topic = await forumService.createTopic({
      title: 'No Tags Topic',
      content: 'Content.',
      authorId: user._id,
    });
    expect(topic.tags).toEqual([]);
  });
});

// ── getTopicsPaginated ────────────────────────────────────────────────────────

describe('getTopicsPaginated', () => {
  it('returns empty topics when no topics exist', async () => {
    const result = await forumService.getTopicsPaginated({});
    expect(result.topics).toHaveLength(0);
    expect(result.pinned).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it('returns topics with pagination metadata', async () => {
    const user = await createUser();
    await createTopic(user._id, { title: 'Topic A' });
    await createTopic(user._id, { title: 'Topic B' });

    const result = await forumService.getTopicsPaginated({ page: 1, limit: 10 });
    expect(result.topics.length).toBe(2);
    expect(result.pagination).toMatchObject({ page: 1, limit: 10, total: 2, totalPages: 1 });
  });

  it('filters topics by category', async () => {
    const user = await createUser();
    await createTopic(user._id, { category: 'career-advice' });
    await createTopic(user._id, { category: 'general' });

    const result = await forumService.getTopicsPaginated({ category: 'career-advice' });
    expect(result.topics.length).toBe(1);
    expect(result.topics[0].category).toBe('career-advice');
  });

  it('returns topics matching a search query', async () => {
    const user = await createUser();
    await createTopic(user._id, { title: 'Leadership in Tech' });
    await createTopic(user._id, { title: 'Career Growth Tips' });

    const result = await forumService.getTopicsPaginated({ search: 'Leadership' });
    expect(result.topics.length).toBe(1);
    expect(result.topics[0].title).toBe('Leadership in Tech');
  });

  it('separates pinned topics from regular topics', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id, { title: 'Regular Topic' });

    // Manually pin the topic
    await ForumTopic.findByIdAndUpdate(topic._id, { isPinned: true });

    const result = await forumService.getTopicsPaginated({});
    expect(result.pinned.length).toBe(1);
    expect(result.topics.length).toBe(0);
  });
});

// ── getTopicByIdWithReplies ───────────────────────────────────────────────────

describe('getTopicByIdWithReplies', () => {
  it('returns topic with replies and increments view count', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const result = await forumService.getTopicByIdWithReplies(topic._id, null);
    expect(result._id.toString()).toBe(topic._id.toString());
    expect(result.views).toBe(1);
    expect(result.replies).toEqual([]);
    expect(result.replyPagination).toHaveProperty('total', 0);
  });

  it('throws 404 for an unknown topic id', async () => {
    await expect(
      forumService.getTopicByIdWithReplies(new Types.ObjectId(), null)
    ).rejects.toMatchObject({ status: 404 });
  });

  it('sets userVote to "upvote" when user has upvoted the topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    await forumService.votePost({ postId: topic._id, userId: user._id, type: 'upvote', postType: 'topic' });

    const result = await forumService.getTopicByIdWithReplies(topic._id, user._id);
    expect(result.userVote).toBe('upvote');
  });
});

// ── updateTopic ───────────────────────────────────────────────────────────────

describe('updateTopic', () => {
  it('allows the topic author to update title and content', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const updated = await forumService.updateTopic(topic._id, user._id, 'mentee', {
      title: 'Updated Title',
      content: 'Updated content.',
    });
    expect(updated.title).toBe('Updated Title');
    expect(updated.content).toBe('Updated content.');
  });

  it('throws 403 when a non-author tries to update the topic', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);

    await expect(
      forumService.updateTopic(topic._id, other._id, 'mentee', { title: 'Hijacked' })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws 404 for an unknown topic id', async () => {
    const user = await createUser();
    await expect(
      forumService.updateTopic(new Types.ObjectId(), user._id, 'mentee', { title: 'X' })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('allows admin to pin a topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const updated = await forumService.updateTopic(topic._id, user._id, 'admin', { isPinned: true });
    expect(updated.isPinned).toBe(true);
  });
});

// ── deleteTopic ───────────────────────────────────────────────────────────────

describe('deleteTopic', () => {
  it('allows the topic author to delete their topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const result = await forumService.deleteTopic(topic._id, user._id, 'mentee');
    expect(result.message).toBe('Topic deleted successfully.');

    const found = await ForumTopic.findById(topic._id);
    expect(found).toBeNull();
  });

  it('throws 403 when a non-author tries to delete the topic', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);

    await expect(
      forumService.deleteTopic(topic._id, other._id, 'mentee')
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws 404 for an unknown topic id', async () => {
    const user = await createUser();
    await expect(
      forumService.deleteTopic(new Types.ObjectId(), user._id, 'mentee')
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ── createReply ───────────────────────────────────────────────────────────────

describe('createReply', () => {
  it('creates a reply and increments topic replyCount', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const reply = await forumService.createReply({
      topicId: topic._id,
      content: 'This is a reply.',
      authorId: user._id,
    });

    expect(reply._id).toBeDefined();
    expect(reply.content).toBe('This is a reply.');

    const updated = await ForumTopic.findById(topic._id);
    expect(updated.replyCount).toBe(1);
  });

  it('throws 404 when the topic does not exist', async () => {
    const user = await createUser();
    await expect(
      forumService.createReply({ topicId: new Types.ObjectId(), content: 'Reply', authorId: user._id })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 when the topic is closed', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    await ForumTopic.findByIdAndUpdate(topic._id, { isClosed: true });

    await expect(
      forumService.createReply({ topicId: topic._id, content: 'Reply', authorId: user._id })
    ).rejects.toMatchObject({ status: 400 });
  });
});

// ── updateReply ───────────────────────────────────────────────────────────────

describe('updateReply', () => {
  it('allows the reply author to update the content', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Original.', authorId: user._id });

    const updated = await forumService.updateReply(reply._id, user._id, 'mentee', { content: 'Edited.' });
    expect(updated.content).toBe('Edited.');
  });

  it('throws 403 when a non-author tries to update the reply', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Original.', authorId: author._id });

    await expect(
      forumService.updateReply(reply._id, other._id, 'mentee', { content: 'Hijacked.' })
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── deleteReply ───────────────────────────────────────────────────────────────

describe('deleteReply', () => {
  it('allows the reply author to delete their reply', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'To delete.', authorId: user._id });

    const result = await forumService.deleteReply(reply._id, user._id, 'mentee');
    expect(result.message).toBe('Reply deleted successfully.');
  });

  it('throws 403 when a non-author tries to delete the reply', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Content.', authorId: author._id });

    await expect(
      forumService.deleteReply(reply._id, other._id, 'mentee')
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── votePost ──────────────────────────────────────────────────────────────────

describe('votePost', () => {
  it('upvotes a topic and returns updated counts', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const result = await forumService.votePost({ postId: topic._id, userId: user._id, type: 'upvote', postType: 'topic' });
    expect(result.upvoteCount).toBe(1);
    expect(result.downvoteCount).toBe(0);
  });

  it('toggles the upvote off when the user upvotes again', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    await forumService.votePost({ postId: topic._id, userId: user._id, type: 'upvote', postType: 'topic' });
    const result = await forumService.votePost({ postId: topic._id, userId: user._id, type: 'upvote', postType: 'topic' });
    expect(result.upvoteCount).toBe(0);
  });

  it('switches from downvote to upvote', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    await forumService.votePost({ postId: topic._id, userId: user._id, type: 'downvote', postType: 'topic' });
    const result = await forumService.votePost({ postId: topic._id, userId: user._id, type: 'upvote', postType: 'topic' });
    expect(result.upvoteCount).toBe(1);
    expect(result.downvoteCount).toBe(0);
  });

  it('throws 404 when voting on an unknown topic', async () => {
    const user = await createUser();
    await expect(
      forumService.votePost({ postId: new Types.ObjectId(), userId: user._id, type: 'upvote', postType: 'topic' })
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ── getMyTopics ───────────────────────────────────────────────────────────────

describe('getMyTopics', () => {
  it('returns only topics created by the specified user', async () => {
    const user = await createUser();
    const other = await createUser();
    await createTopic(user._id, { title: 'My Topic' });
    await createTopic(other._id, { title: 'Other Topic' });

    const result = await forumService.getMyTopics(user._id);
    expect(result.topics.length).toBe(1);
    expect(result.topics[0].title).toBe('My Topic');
  });

  it('returns pagination metadata', async () => {
    const user = await createUser();
    await createTopic(user._id);

    const result = await forumService.getMyTopics(user._id, { page: 1, limit: 10 });
    expect(result.pagination).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });
});

// ── markAcceptedAnswer ────────────────────────────────────────────────────────

describe('markAcceptedAnswer', () => {
  it('topic author can mark a reply as accepted answer', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Best answer.', authorId: user._id });

    const result = await forumService.markAcceptedAnswer(reply._id, user._id, 'mentee');
    expect(result.isAcceptedAnswer).toBe(true);
  });

  it('toggles accepted answer off when marked again', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Best answer.', authorId: user._id });

    await forumService.markAcceptedAnswer(reply._id, user._id, 'mentee');
    const result = await forumService.markAcceptedAnswer(reply._id, user._id, 'mentee');
    expect(result.isAcceptedAnswer).toBe(false);
  });

  it('throws 403 when a non-author tries to mark accepted answer', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);
    const reply = await forumService.createReply({ topicId: topic._id, content: 'Answer.', authorId: other._id });

    await expect(
      forumService.markAcceptedAnswer(reply._id, other._id, 'mentee')
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── togglePin ─────────────────────────────────────────────────────────────────

describe('togglePin', () => {
  it('admin can pin a topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const result = await forumService.togglePin(topic._id, 'admin');
    expect(result.isPinned).toBe(true);
  });

  it('admin can unpin an already pinned topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    await forumService.togglePin(topic._id, 'admin');
    const result = await forumService.togglePin(topic._id, 'admin');
    expect(result.isPinned).toBe(false);
  });

  it('throws 403 when a non-admin tries to pin a topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    await expect(
      forumService.togglePin(topic._id, 'mentee')
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── toggleClose ───────────────────────────────────────────────────────────────

describe('toggleClose', () => {
  it('topic author can close their topic', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);

    const result = await forumService.toggleClose(topic._id, user._id, 'mentee');
    expect(result.isClosed).toBe(true);
  });

  it('closed topic prevents new replies', async () => {
    const user = await createUser();
    const topic = await createTopic(user._id);
    await forumService.toggleClose(topic._id, user._id, 'mentee');

    await expect(
      forumService.createReply({ topicId: topic._id, content: 'Reply on closed topic.', authorId: user._id })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 403 when a non-author tries to close the topic', async () => {
    const author = await createUser();
    const other = await createUser();
    const topic = await createTopic(author._id);

    await expect(
      forumService.toggleClose(topic._id, other._id, 'mentee')
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── reportPost ────────────────────────────────────────────────────────────────

describe('reportPost', () => {
  it('creates a report for a topic', async () => {
    const author = await createUser();
    const reporter = await createUser();
    const topic = await createTopic(author._id);

    const report = await forumService.reportPost({
      postId: topic._id,
      userId: reporter._id,
      postType: 'topic',
      reason: 'spam',
      description: 'This is spam.',
    });

    expect(report._id).toBeDefined();
    expect(report.reason).toBe('spam');
    expect(report.postType).toBe('topic');
  });

  it('throws 400 when the same user reports the same post twice', async () => {
    const author = await createUser();
    const reporter = await createUser();
    const topic = await createTopic(author._id);

    await forumService.reportPost({ postId: topic._id, userId: reporter._id, postType: 'topic', reason: 'spam' });

    await expect(
      forumService.reportPost({ postId: topic._id, userId: reporter._id, postType: 'topic', reason: 'spam' })
    ).rejects.toMatchObject({ status: 400 });
  });
});
