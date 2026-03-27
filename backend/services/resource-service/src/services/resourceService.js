const Resource = require('../models/Resource');

// --- Helpers ---

const throwError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

const recalcAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

// --- CRUD ---

const createResource = async (data, userId, userRole) => {
  // Duplicate detection by title
  const existing = await Resource.findOne({
    title: { $regex: new RegExp(`^${data.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (existing) {
    throwError('A resource with this title already exists.', 409);
  }

  // Premium resources require Mentor or Admin role
  if (data.isPremium && userRole !== 'Mentor' && userRole !== 'Admin') {
    throwError('Only mentors or admins can create premium resources.', 403);
  }

  const resource = await Resource.create({
    title: data.title,
    description: data.description,
    type: data.type,
    category: data.category,
    tags: data.tags,
    uploadedBy: userId,
    file: data.file || {},
    externalLink: data.externalLink || '',
    thumbnail: data.thumbnail || '',
    author: data.author || '',
    publishedDate: data.publishedDate || null,
    difficulty: data.difficulty || 'beginner',
    duration: data.duration || 0,
    isPremium: data.isPremium || false,
    isApproved: userRole === 'Admin' || userRole === 'Mentor',
  });

  await resource.populate('uploadedBy', 'name email avatar');
  return resource;
};

const getResources = async ({
  page = 1,
  limit = 10,
  category,
  type,
  difficulty,
  tags,
  search,
  sort = '-createdAt',
  isPremium,
}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = { isApproved: true };
  if (category) query.category = category;
  if (type) query.type = type;
  if (difficulty) query.difficulty = difficulty;
  if (isPremium !== undefined) query.isPremium = isPremium === 'true';
  if (tags) {
    const tagArr = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    query.tags = { $in: tagArr };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name avatar')
      .lean(),
    Resource.countDocuments(query),
  ]);

  const result = resources.map((r) => ({
    ...r,
    bookmarkCount: r.bookmarkedBy ? r.bookmarkedBy.length : 0,
    ratingCount: r.ratings ? r.ratings.length : 0,
    bookmarkedBy: undefined,
    ratings: undefined,
  }));

  return {
    resources: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getResourceById = async (resourceId, userId) => {
  const resource = await Resource.findByIdAndUpdate(
    resourceId,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('uploadedBy', 'name email avatar')
    .populate('ratings.user', 'name avatar')
    .lean();

  if (!resource) throwError('Resource not found.', 404);

  const userBookmarked =
    userId && resource.bookmarkedBy
      ? resource.bookmarkedBy.some((id) => id.toString() === userId.toString())
      : false;

  const userRating =
    userId && resource.ratings
      ? resource.ratings.find((r) => r.user._id.toString() === userId.toString())
      : null;

  return {
    ...resource,
    bookmarkCount: resource.bookmarkedBy ? resource.bookmarkedBy.length : 0,
    userBookmarked,
    userRating: userRating || null,
  };
};

const updateResource = async (resourceId, userId, userRole, updates) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throwError('Resource not found.', 404);

  const isOwner = resource.uploadedBy.toString() === userId.toString();
  const isAdmin = userRole === 'Admin';
  if (!isOwner && !isAdmin) {
    throwError('You can only update your own resources.', 403);
  }

  if (updates.isPremium && userRole !== 'Mentor' && userRole !== 'Admin') {
    throwError('Only mentors or admins can set premium resources.', 403);
  }

  const allowed = [
    'title', 'description', 'type', 'category', 'tags', 'file',
    'externalLink', 'thumbnail', 'author', 'publishedDate',
    'difficulty', 'duration', 'isPremium',
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) resource[key] = updates[key];
  }

  // Admin can approve
  if (isAdmin && updates.isApproved !== undefined) {
    resource.isApproved = updates.isApproved;
  }

  await resource.save();
  await resource.populate('uploadedBy', 'name email avatar');
  return resource;
};

const deleteResource = async (resourceId, userId, userRole) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throwError('Resource not found.', 404);

  const isOwner = resource.uploadedBy.toString() === userId.toString();
  const isAdmin = userRole === 'Admin';
  if (!isOwner && !isAdmin) {
    throwError('You can only delete your own resources.', 403);
  }

  await Resource.findByIdAndDelete(resourceId);
  return { message: 'Resource deleted.' };
};

// --- Bookmark ---

const toggleBookmark = async (resourceId, userId) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throwError('Resource not found.', 404);

  const bookmarks = resource.bookmarkedBy || [];
  const index = bookmarks.findIndex((id) => id.toString() === userId.toString());

  if (index === -1) {
    resource.bookmarkedBy.push(userId);
  } else {
    resource.bookmarkedBy.splice(index, 1);
  }
  await resource.save();

  return {
    bookmarked: index === -1,
    bookmarkCount: resource.bookmarkedBy.length,
  };
};

const getUserBookmarks = async (userId, { page = 1, limit = 10 }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = { bookmarkedBy: userId, isApproved: true };

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name avatar')
      .lean(),
    Resource.countDocuments(query),
  ]);

  return {
    resources,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// --- Download tracking ---

const trackDownload = async (resourceId) => {
  const resource = await Resource.findByIdAndUpdate(
    resourceId,
    { $inc: { downloads: 1 } },
    { new: true }
  );
  if (!resource) throwError('Resource not found.', 404);
  return { downloads: resource.downloads };
};

// --- Rating ---

const rateResource = async (resourceId, userId, rating, review) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throwError('Resource not found.', 404);

  if (resource.uploadedBy.toString() === userId.toString()) {
    throwError('You cannot rate your own resource.', 400);
  }

  const existingIndex = resource.ratings.findIndex(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingIndex !== -1) {
    resource.ratings[existingIndex].rating = rating;
    resource.ratings[existingIndex].review = review || '';
  } else {
    resource.ratings.push({ user: userId, rating, review: review || '' });
  }

  resource.averageRating = recalcAverageRating(resource.ratings);
  await resource.save();

  return {
    averageRating: resource.averageRating,
    ratingCount: resource.ratings.length,
    userRating: { rating, review: review || '' },
  };
};

// --- Recommendations ---

const getRecommendedResources = async (userId, { limit = 10 }) => {
  limit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));

  // Get user's bookmarked resource categories and tags for personalization
  const userBookmarks = await Resource.find(
    { bookmarkedBy: userId, isApproved: true },
    'category tags'
  ).lean();

  let query = { isApproved: true };

  if (userBookmarks.length > 0) {
    const categories = [...new Set(userBookmarks.map((r) => r.category))];
    const tags = [...new Set(userBookmarks.flatMap((r) => r.tags))];

    query.$or = [
      { category: { $in: categories } },
      { tags: { $in: tags } },
    ];
  }

  const resources = await Resource.find(query)
    .sort('-averageRating -views -downloads')
    .limit(limit)
    .populate('uploadedBy', 'name avatar')
    .lean();

  return resources.map((r) => ({
    ...r,
    bookmarkCount: r.bookmarkedBy ? r.bookmarkedBy.length : 0,
    ratingCount: r.ratings ? r.ratings.length : 0,
    bookmarkedBy: undefined,
    ratings: undefined,
  }));
};

const getMyResources = async (userId, { page = 1, limit = 20, sort = '-createdAt' }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = { uploadedBy: userId };

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name avatar')
      .lean(),
    Resource.countDocuments(query),
  ]);

  const result = resources.map((r) => ({
    ...r,
    bookmarkCount: r.bookmarkedBy ? r.bookmarkedBy.length : 0,
    ratingCount: r.ratings ? r.ratings.length : 0,
    bookmarkedBy: undefined,
    ratings: undefined,
  }));

  return {
    resources: result,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// --- Admin ---

const adminGetResources = async ({
  page = 1,
  limit = 12,
  sort = '-createdAt',
  search,
  category,
  type,
  status, // 'pending' | 'approved' | undefined (all)
}) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (page - 1) * limit;

  const query = {};
  if (status === 'pending') query.isApproved = false;
  else if (status === 'approved') query.isApproved = true;
  if (category) query.category = category;
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email avatar')
      .lean(),
    Resource.countDocuments(query),
  ]);

  const result = resources.map((r) => ({
    ...r,
    bookmarkCount: r.bookmarkedBy ? r.bookmarkedBy.length : 0,
    ratingCount: r.ratings ? r.ratings.length : 0,
    bookmarkedBy: undefined,
    ratings: undefined,
  }));

  return {
    resources: result,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const adminGetAnalytics = async () => {
  const [total, approved, pending, agg] = await Promise.all([
    Resource.countDocuments({}),
    Resource.countDocuments({ isApproved: true }),
    Resource.countDocuments({ isApproved: false }),
    Resource.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloads' },
          totalViews: { $sum: '$views' },
          avgRating: { $avg: '$averageRating' },
        },
      },
    ]),
  ]);

  const [byType, byCategory, topDownloads, topViewed] = await Promise.all([
    Resource.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Resource.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Resource.find({}).sort('-downloads').limit(5).select('title type downloads').lean(),
    Resource.find({}).sort('-views').limit(5).select('title type views').lean(),
  ]);

  const overview = {
    total,
    approved,
    pending,
    totalDownloads: agg[0]?.totalDownloads || 0,
    totalViews: agg[0]?.totalViews || 0,
    avgRating: agg[0]?.avgRating || 0,
  };

  return { overview, byType, byCategory, topDownloads, topViewed };
};

const approveResource = async (resourceId) => {
  const resource = await Resource.findByIdAndUpdate(
    resourceId,
    { isApproved: true },
    { new: true }
  );
  if (!resource) throwError('Resource not found.', 404);
  return { message: 'Resource approved.', resource };
};

const rejectResource = async (resourceId) => {
  const resource = await Resource.findByIdAndUpdate(
    resourceId,
    { isApproved: false },
    { new: true }
  );
  if (!resource) throwError('Resource not found.', 404);
  return { message: 'Resource rejected.', resource };
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  toggleBookmark,
  getUserBookmarks,
  trackDownload,
  rateResource,
  getRecommendedResources,
  getMyResources,
  adminGetResources,
  adminGetAnalytics,
  approveResource,
  rejectResource,
};
