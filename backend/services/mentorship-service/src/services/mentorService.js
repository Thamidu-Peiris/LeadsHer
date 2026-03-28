const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');

const createOrUpdateProfile = async (userId, data) => {
  const { expertise, yearsOfExperience, industries, mentoringAreas, availability, bio, achievements } = data;
  let mentorProfile = await MentorProfile.findOne({ user: userId });
  if (mentorProfile) {
    mentorProfile.expertise = expertise || mentorProfile.expertise;
    mentorProfile.yearsOfExperience = yearsOfExperience !== undefined ? yearsOfExperience : mentorProfile.yearsOfExperience;
    mentorProfile.industries = industries || mentorProfile.industries;
    mentorProfile.mentoringAreas = mentoringAreas || mentorProfile.mentoringAreas;
    mentorProfile.bio = bio || mentorProfile.bio;
    mentorProfile.achievements = achievements || mentorProfile.achievements;
    if (availability) {
      mentorProfile.availability = { ...mentorProfile.availability, ...availability };
    }
    await mentorProfile.save();
  } else {
    mentorProfile = await MentorProfile.create({
      user: userId, expertise, yearsOfExperience, industries, mentoringAreas,
      availability: availability || {}, bio, achievements: achievements || [],
    });
  }
  await mentorProfile.populate('user', 'name email avatar profilePicture');
  return mentorProfile;
};

/** Mongoose sort string e.g. "-rating" → { rating: -1 } for aggregation */
function sortSpecFromQuery(sortStr) {
  const s = String(sortStr || '-rating').trim();
  const desc = s.startsWith('-');
  const key = desc ? s.slice(1) : s;
  return { [key]: desc ? -1 : 1 };
}

const getAllMentors = async ({
  expertise,
  industry,
  mentoringAreas,
  minExperience,
  maxExperience,
  availableOnly,
  minRating,
  page = 1,
  limit = 10,
  sort = '-rating',
  search,
}) => {
  const filter = {};
  if (expertise) filter.expertise = { $in: expertise.split(',').map((e) => e.trim()) };
  if (industry) filter.industries = { $in: industry.split(',').map((i) => i.trim()) };
  if (mentoringAreas) {
    filter.mentoringAreas = { $in: mentoringAreas.split(',').map((a) => a.trim()) };
  }
  if (minExperience || maxExperience) {
    filter.yearsOfExperience = {};
    if (minExperience) filter.yearsOfExperience.$gte = parseInt(minExperience);
    if (maxExperience) filter.yearsOfExperience.$lte = parseInt(maxExperience);
  }
  if (minRating !== undefined && minRating !== '' && !Number.isNaN(parseFloat(minRating))) {
    filter.rating = { $gte: parseFloat(minRating) };
  }
  if (availableOnly === 'true') {
    filter.isAvailable = true;
    filter.isVerified = true;
    filter.$expr = { $lt: ['$availability.currentMentees', '$availability.maxMentees'] };
  }
  const searchTrim = search && String(search).trim();
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const lim = parseInt(limit);

  if (searchTrim) {
    const esc = searchTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = { $regex: esc, $options: 'i' };
    const userOrDocMatch = {
      $or: [
        { '_mentorUser.name': rx },
        { '_mentorUser.email': rx },
        { bio: rx },
        { expertise: rx },
        { industries: rx },
        { mentoringAreas: rx },
      ],
    };

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: '_mentorUser',
        },
      },
      { $unwind: { path: '$_mentorUser', preserveNullAndEmptyArrays: true } },
      { $match: userOrDocMatch },
      { $sort: sortSpecFromQuery(sort) },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: lim }],
          meta: [{ $count: 'total' }],
        },
      },
    ];

    const agg = await MentorProfile.aggregate(pipeline);
    const facet = agg[0] || { data: [], meta: [] };
    const rows = facet.data || [];
    const total = facet.meta?.[0]?.total ?? 0;

    const data = rows.map((doc) => {
      const u = doc._mentorUser;
      const { _mentorUser, ...rest } = doc;
      return {
        ...rest,
        user: u
          ? {
              _id: u._id,
              name: u.name,
              email: u.email,
              avatar: u.avatar,
              profilePicture: u.profilePicture,
            }
          : undefined,
      };
    });

    return {
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: lim,
        pages: Math.ceil(total / lim),
      },
    };
  }

  const mentors = await MentorProfile.find(filter)
    .populate('user', 'name email avatar profilePicture')
    .sort(sort)
    .skip(skip)
    .limit(lim);
  const total = await MentorProfile.countDocuments(filter);
  return {
    data: mentors,
    pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) },
  };
};

const getMentorById = async (id) => {
  const mentorProfile = await MentorProfile.findById(id).populate(
    'user',
    'name email avatar profilePicture bio location'
  );
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  return mentorProfile;
};

const getMentorByUserId = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId }).populate('user', 'name email avatar profilePicture bio');
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  return mentorProfile;
};

const getMyProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId }).populate('user', 'name email avatar profilePicture bio');
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  return mentorProfile;
};

const toggleAvailability = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId });
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  mentorProfile.isAvailable = !mentorProfile.isAvailable;
  await mentorProfile.save();
  return mentorProfile;
};

const getMentorStats = async (mentorProfileId) => {
  const mentorProfile = await MentorProfile.findById(mentorProfileId);
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  const activeMentorships = await Mentorship.countDocuments({ mentor: mentorProfile.user, status: 'active' });
  const completedMentorships = await Mentorship.countDocuments({ mentor: mentorProfile.user, status: 'completed' });
  const totalSessions = await Mentorship.aggregate([
    { $match: { mentor: mentorProfile.user } },
    { $unwind: '$sessions' },
    { $count: 'total' },
  ]);
  return {
    rating: mentorProfile.rating, totalReviews: mentorProfile.totalReviews,
    totalMentorships: mentorProfile.totalMentorships, activeMentorships, completedMentorships,
    totalSessions: totalSessions[0]?.total || 0, availability: mentorProfile.availability,
  };
};

const deleteMyProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId });
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  const activeMentorships = await Mentorship.countDocuments({ mentor: userId, status: 'active' });
  if (activeMentorships > 0) {
    const err = new Error('Cannot delete mentor profile while you have active mentorships. Complete or terminate them first.');
    err.status = 400;
    throw err;
  }
  await MentorProfile.findByIdAndDelete(mentorProfile._id);
  return { deleted: true, id: mentorProfile._id };
};

/**
 * Public mentee→mentor reviews from completed mentorships (feedback.menteeRating / menteeComment).
 */
const getMentorReviews = async (mentorProfileId) => {
  const mentorProfile = await MentorProfile.findById(mentorProfileId);
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  const mentorUserId = mentorProfile.user;
  const list = await Mentorship.find({
    mentor: mentorUserId,
    status: 'completed',
    'feedback.menteeRating': { $exists: true, $ne: null },
  })
    .sort({ completedAt: -1, updatedAt: -1 })
    .limit(24)
    .populate('mentee', 'name avatar profilePicture')
    .lean();

  /** Ensure mentee name + photo fields (populate + batch fallback for any stale refs). */
  const menteeIdStrings = [
    ...new Set(
      list
        .map((d) => {
          const me = d.mentee;
          if (!me) return null;
          if (typeof me === 'object' && me._id) return String(me._id);
          return String(me);
        })
        .filter(Boolean)
    ),
  ];
  if (menteeIdStrings.length > 0) {
    const users = await User.find({ _id: { $in: menteeIdStrings } })
      .select('name avatar profilePicture')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    for (const doc of list) {
      const key = doc.mentee?._id != null ? String(doc.mentee._id) : String(doc.mentee || '');
      if (key && byId.has(key)) doc.mentee = byId.get(key);
    }
  }

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const m of list) {
    const r = Math.round(Number(m.feedback.menteeRating));
    if (r >= 1 && r <= 5) counts[r] += 1;
  }
  const totalWithRating = list.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star],
    pct:
      totalWithRating > 0 ? Math.round((counts[star] / totalWithRating) * 1000) / 10 : 0,
  }));

  const reviews = list.map((m) => ({
    _id: m._id,
    rating: m.feedback.menteeRating,
    comment: m.feedback.menteeComment || '',
    mentee: m.mentee,
    completedAt: m.completedAt || m.updatedAt,
  }));

  return { reviews, distribution, total: totalWithRating };
};

module.exports = {
  createOrUpdateProfile,
  getAllMentors,
  getMentorById,
  getMentorByUserId,
  getMyProfile,
  toggleAvailability,
  getMentorStats,
  deleteMyProfile,
  getMentorReviews,
};
