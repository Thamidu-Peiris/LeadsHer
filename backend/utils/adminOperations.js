const MentorProfile = require('../models/MentorProfile');
const Mentorship = require('../models/Mentorship');
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

/**
 * Verify a mentor profile (Admin operation)
 * @param {String} mentorProfileId - Mentor profile ID
 * @returns {Object} - Updated mentor profile
 */
const verifyMentor = async (mentorProfileId) => {
  try {
    const mentorProfile = await MentorProfile.findById(mentorProfileId);
    
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    mentorProfile.isVerified = true;
    await mentorProfile.save();

    return mentorProfile;
  } catch (error) {
    console.error('Error verifying mentor:', error);
    throw error;
  }
};

/**
 * Unverify a mentor profile (Admin operation)
 * @param {String} mentorProfileId - Mentor profile ID
 * @returns {Object} - Updated mentor profile
 */
const unverifyMentor = async (mentorProfileId) => {
  try {
    const mentorProfile = await MentorProfile.findById(mentorProfileId);
    
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    mentorProfile.isVerified = false;
    mentorProfile.isAvailable = false;
    await mentorProfile.save();

    return mentorProfile;
  } catch (error) {
    console.error('Error unverifying mentor:', error);
    throw error;
  }
};

/**
 * Get platform statistics (Admin operation)
 * @returns {Object} - Platform statistics
 */
const getPlatformStats = async () => {
  try {
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
      sessions: await Mentorship.aggregate([
        { $unwind: '$sessions' },
        { $count: 'total' },
      ]),
    };

    // Calculate average ratings
    const mentorsWithRatings = await MentorProfile.find({
      rating: { $gt: 0 },
    });
    
    const avgRating = mentorsWithRatings.length > 0
      ? mentorsWithRatings.reduce((sum, m) => sum + m.rating, 0) / mentorsWithRatings.length
      : 0;

    stats.averageMentorRating = Math.round(avgRating * 10) / 10;
    stats.totalSessions = stats.sessions[0]?.total || 0;

    return stats;
  } catch (error) {
    console.error('Error getting platform stats:', error);
    throw error;
  }
};

/**
 * Get top mentors by rating (Admin operation)
 * @param {Number} limit - Number of mentors to return
 * @returns {Array} - Top mentors
 */
const getTopMentors = async (limit = 10) => {
  try {
    const topMentors = await MentorProfile.find({
      isVerified: true,
      rating: { $gt: 0 },
    })
      .populate('user', 'name email')
      .sort('-rating -totalMentorships')
      .limit(limit);

    return topMentors;
  } catch (error) {
    console.error('Error getting top mentors:', error);
    throw error;
  }
};

/**
 * Get mentorships requiring attention (Admin operation)
 * @returns {Object} - Mentorships requiring attention
 */
const getMentorshipsRequiringAttention = async () => {
  try {
    // Get completed mentorships without full feedback
    const incompleteFeedback = await Mentorship.find({
      status: 'completed',
      $or: [
        { 'feedback.mentorRating': { $exists: false } },
        { 'feedback.menteeRating': { $exists: false } },
      ],
    })
      .populate('mentor mentee', 'name email')
      .sort('-completedAt');

    // Get paused mentorships older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const longPaused = await Mentorship.find({
      status: 'paused',
      updatedAt: { $lt: thirtyDaysAgo },
    })
      .populate('mentor mentee', 'name email')
      .sort('updatedAt');

    // Get pending requests older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldRequests = await MentorshipRequest.find({
      status: 'pending',
      createdAt: { $lt: sevenDaysAgo },
    })
      .populate('mentor mentee', 'name email')
      .sort('createdAt');

    return {
      incompleteFeedback: {
        count: incompleteFeedback.length,
        items: incompleteFeedback,
      },
      longPaused: {
        count: longPaused.length,
        items: longPaused,
      },
      oldRequests: {
        count: oldRequests.length,
        items: oldRequests,
      },
    };
  } catch (error) {
    console.error('Error getting mentorships requiring attention:', error);
    throw error;
  }
};

/**
 * Clean up old rejected/cancelled requests (Admin operation)
 * @param {Number} daysOld - Delete requests older than this many days
 * @returns {Object} - Deletion result
 */
const cleanupOldRequests = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await MentorshipRequest.deleteMany({
      status: { $in: ['rejected', 'cancelled'] },
      updatedAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} old requests`,
    };
  } catch (error) {
    console.error('Error cleaning up old requests:', error);
    throw error;
  }
};

/**
 * Get mentor performance report (Admin operation)
 * @param {String} mentorUserId - Mentor user ID
 * @returns {Object} - Performance report
 */
const getMentorPerformanceReport = async (mentorUserId) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ user: mentorUserId });
    
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    const mentorships = await Mentorship.find({
      mentor: mentorUserId,
    });

    const activeMentorships = mentorships.filter(m => m.status === 'active');
    const completedMentorships = mentorships.filter(m => m.status === 'completed');

    // Calculate total sessions
    const totalSessions = mentorships.reduce(
      (sum, m) => sum + m.sessions.length,
      0
    );

    // Calculate average session duration
    let totalDuration = 0;
    let sessionCount = 0;
    mentorships.forEach(m => {
      m.sessions.forEach(s => {
        totalDuration += s.duration;
        sessionCount++;
      });
    });
    const avgSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;

    // Calculate completion rate
    const totalMentorshipsStarted = mentorships.length;
    const completionRate = totalMentorshipsStarted > 0
      ? (completedMentorships.length / totalMentorshipsStarted) * 100
      : 0;

    // Get feedback ratings
    const ratings = completedMentorships
      .filter(m => m.feedback && m.feedback.menteeRating)
      .map(m => m.feedback.menteeRating);

    const avgFeedbackRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return {
      mentorProfile: {
        name: mentorProfile.user.name,
        rating: mentorProfile.rating,
        totalReviews: mentorProfile.totalReviews,
        yearsOfExperience: mentorProfile.yearsOfExperience,
      },
      mentorships: {
        total: totalMentorshipsStarted,
        active: activeMentorships.length,
        completed: completedMentorships.length,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      sessions: {
        total: totalSessions,
        averageDuration: Math.round(avgSessionDuration),
      },
      feedback: {
        averageRating: Math.round(avgFeedbackRating * 10) / 10,
        totalFeedbackReceived: ratings.length,
      },
    };
  } catch (error) {
    console.error('Error getting mentor performance report:', error);
    throw error;
  }
};

/**
 * Sync mentor profile with actual mentorship data (Admin operation)
 * Fixes any data inconsistencies
 * @param {String} mentorUserId - Mentor user ID
 * @returns {Object} - Sync result
 */
const syncMentorProfile = async (mentorUserId) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ user: mentorUserId });
    
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    // Count actual active mentorships
    const actualActiveMentorships = await Mentorship.countDocuments({
      mentor: mentorUserId,
      status: 'active',
    });

    // Update current mentees count
    const oldCount = mentorProfile.availability.currentMentees;
    mentorProfile.availability.currentMentees = actualActiveMentorships;

    // Update availability based on capacity
    if (actualActiveMentorships < mentorProfile.availability.maxMentees) {
      mentorProfile.isAvailable = true;
    } else {
      mentorProfile.isAvailable = false;
    }

    // Update total mentorships
    const totalMentorships = await Mentorship.countDocuments({
      mentor: mentorUserId,
    });
    mentorProfile.totalMentorships = totalMentorships;

    await mentorProfile.save();

    return {
      message: 'Mentor profile synced successfully',
      changes: {
        currentMentees: {
          old: oldCount,
          new: actualActiveMentorships,
        },
        totalMentorships: totalMentorships,
        isAvailable: mentorProfile.isAvailable,
      },
    };
  } catch (error) {
    console.error('Error syncing mentor profile:', error);
    throw error;
  }
};

module.exports = {
  verifyMentor,
  unverifyMentor,
  getPlatformStats,
  getTopMentors,
  getMentorshipsRequiringAttention,
  cleanupOldRequests,
  getMentorPerformanceReport,
  syncMentorProfile,
};
