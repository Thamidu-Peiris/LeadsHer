const MentorProfile = require('../models/MentorProfile');
const Mentorship = require('../models/Mentorship');
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

const verifyMentor = async (mentorProfileId) => {
  const mentorProfile = await MentorProfile.findById(mentorProfileId);
  if (!mentorProfile) throw new Error('Mentor profile not found');
  mentorProfile.isVerified = true;
  await mentorProfile.save();
  return mentorProfile;
};

const unverifyMentor = async (mentorProfileId) => {
  const mentorProfile = await MentorProfile.findById(mentorProfileId);
  if (!mentorProfile) throw new Error('Mentor profile not found');
  mentorProfile.isVerified = false;
  mentorProfile.isAvailable = false;
  await mentorProfile.save();
  return mentorProfile;
};

const getPlatformStats = async () => {
  const stats = {
    users: {
      total: await User.countDocuments(),
      mentors: await User.countDocuments({ role: 'Mentor' }),
      mentees: await User.countDocuments({ role: 'Mentee' }),
      admins: await User.countDocuments({ role: 'Admin' }),
    },
    mentorProfiles: {
      total: await MentorProfile.countDocuments(),
      verified: await MentorProfile.countDocuments({ isVerified: true }),
      available: await MentorProfile.countDocuments({ isAvailable: true }),
    },
    mentorshipRequests: {
      total: await MentorshipRequest.countDocuments(),
      pending: await MentorshipRequest.countDocuments({ status: 'pending' }),
      accepted: await MentorshipRequest.countDocuments({ status: 'accepted' }),
      rejected: await MentorshipRequest.countDocuments({ status: 'rejected' }),
    },
    mentorships: {
      total: await Mentorship.countDocuments(),
      active: await Mentorship.countDocuments({ status: 'active' }),
      completed: await Mentorship.countDocuments({ status: 'completed' }),
      paused: await Mentorship.countDocuments({ status: 'paused' }),
      terminated: await Mentorship.countDocuments({ status: 'terminated' }),
    },
    sessions: await Mentorship.aggregate([{ $unwind: '$sessions' }, { $count: 'total' }]),
  };
  const mentorsWithRatings = await MentorProfile.find({ rating: { $gt: 0 } });
  const avgRating = mentorsWithRatings.length > 0 ? mentorsWithRatings.reduce((sum, m) => sum + m.rating, 0) / mentorsWithRatings.length : 0;
  stats.averageMentorRating = Math.round(avgRating * 10) / 10;
  stats.totalSessions = stats.sessions[0]?.total || 0;
  return stats;
};

const getTopMentors = async (limit = 10) => {
  return MentorProfile.find({ isVerified: true, rating: { $gt: 0 } }).populate('user', 'name email').sort('-rating -totalMentorships').limit(limit);
};

const getMentorshipsRequiringAttention = async () => {
  const incompleteFeedback = await Mentorship.find({ status: 'completed', $or: [{ 'feedback.mentorRating': { $exists: false } }, { 'feedback.menteeRating': { $exists: false } }] }).populate('mentor mentee', 'name email').sort('-completedAt');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const longPaused = await Mentorship.find({ status: 'paused', updatedAt: { $lt: thirtyDaysAgo } }).populate('mentor mentee', 'name email').sort('updatedAt');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oldRequests = await MentorshipRequest.find({ status: 'pending', createdAt: { $lt: sevenDaysAgo } }).populate('mentor mentee', 'name email').sort('createdAt');
  return {
    incompleteFeedback: { count: incompleteFeedback.length, items: incompleteFeedback },
    longPaused: { count: longPaused.length, items: longPaused },
    oldRequests: { count: oldRequests.length, items: oldRequests },
  };
};

const cleanupOldRequests = async (daysOld = 90) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await MentorshipRequest.deleteMany({ status: { $in: ['rejected', 'cancelled'] }, updatedAt: { $lt: cutoffDate } });
  return { deletedCount: result.deletedCount, message: `Deleted ${result.deletedCount} old requests` };
};

const getMentorPerformanceReport = async (mentorUserId) => {
  const mentorProfile = await MentorProfile.findOne({ user: mentorUserId });
  if (!mentorProfile) throw new Error('Mentor profile not found');
  const mentorships = await Mentorship.find({ mentor: mentorUserId });
  const activeMentorships = mentorships.filter(m => m.status === 'active');
  const completedMentorships = mentorships.filter(m => m.status === 'completed');
  const totalSessions = mentorships.reduce((sum, m) => sum + m.sessions.length, 0);
  let totalDuration = 0, sessionCount = 0;
  mentorships.forEach(m => { m.sessions.forEach(s => { totalDuration += s.duration; sessionCount++; }); });
  const avgSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;
  const totalMentorshipsStarted = mentorships.length;
  const completionRate = totalMentorshipsStarted > 0 ? (completedMentorships.length / totalMentorshipsStarted) * 100 : 0;
  const ratings = completedMentorships.filter(m => m.feedback && m.feedback.menteeRating).map(m => m.feedback.menteeRating);
  const avgFeedbackRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  return {
    mentorProfile: { name: mentorProfile.user.name, rating: mentorProfile.rating, totalReviews: mentorProfile.totalReviews, yearsOfExperience: mentorProfile.yearsOfExperience },
    mentorships: { total: totalMentorshipsStarted, active: activeMentorships.length, completed: completedMentorships.length, completionRate: Math.round(completionRate * 10) / 10 },
    sessions: { total: totalSessions, averageDuration: Math.round(avgSessionDuration) },
    feedback: { averageRating: Math.round(avgFeedbackRating * 10) / 10, totalFeedbackReceived: ratings.length },
  };
};

const syncMentorProfile = async (mentorUserId) => {
  const mentorProfile = await MentorProfile.findOne({ user: mentorUserId });
  if (!mentorProfile) throw new Error('Mentor profile not found');
  const actualActiveMentorships = await Mentorship.countDocuments({ mentor: mentorUserId, status: 'active' });
  const oldCount = mentorProfile.availability.currentMentees;
  mentorProfile.availability.currentMentees = actualActiveMentorships;
  mentorProfile.isAvailable = actualActiveMentorships < mentorProfile.availability.maxMentees;
  const totalMentorships = await Mentorship.countDocuments({ mentor: mentorUserId });
  mentorProfile.totalMentorships = totalMentorships;
  await mentorProfile.save();
  return { message: 'Mentor profile synced successfully', changes: { currentMentees: { old: oldCount, new: actualActiveMentorships }, totalMentorships, isAvailable: mentorProfile.isAvailable } };
};

module.exports = { verifyMentor, unverifyMentor, getPlatformStats, getTopMentors, getMentorshipsRequiringAttention, cleanupOldRequests, getMentorPerformanceReport, syncMentorProfile };
