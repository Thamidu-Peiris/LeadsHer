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
  await mentorProfile.populate('user', 'name email avatar');
  return mentorProfile;
};

const getAllMentors = async ({ expertise, industry, minExperience, maxExperience, availableOnly, page = 1, limit = 10, sort = '-rating' }) => {
  const filter = {};
  if (expertise) filter.expertise = { $in: expertise.split(',').map(e => e.trim()) };
  if (industry) filter.industries = { $in: industry.split(',').map(i => i.trim()) };
  if (minExperience || maxExperience) {
    filter.yearsOfExperience = {};
    if (minExperience) filter.yearsOfExperience.$gte = parseInt(minExperience);
    if (maxExperience) filter.yearsOfExperience.$lte = parseInt(maxExperience);
  }
  if (availableOnly === 'true') {
    filter.isAvailable = true;
    filter.isVerified = true;
    filter.$expr = { $lt: ['$availability.currentMentees', '$availability.maxMentees'] };
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const mentors = await MentorProfile.find(filter).populate('user', 'name email avatar').sort(sort).skip(skip).limit(parseInt(limit));
  const total = await MentorProfile.countDocuments(filter);
  return {
    data: mentors,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  };
};

const getMentorById = async (id) => {
  const mentorProfile = await MentorProfile.findById(id).populate('user', 'name email avatar bio');
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  return mentorProfile;
};

const getMentorByUserId = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId }).populate('user', 'name email avatar bio');
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  return mentorProfile;
};

const getMyProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ user: userId }).populate('user', 'name email avatar bio');
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

module.exports = {
  createOrUpdateProfile,
  getAllMentors,
  getMentorById,
  getMentorByUserId,
  getMyProfile,
  toggleAvailability,
  getMentorStats,
  deleteMyProfile,
};
