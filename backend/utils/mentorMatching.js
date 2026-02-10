const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

/**
 * Calculate match score between mentee profile and mentor
 * @param {Object} menteePreferences - Mentee's preferred areas and goals
 * @param {Object} mentorProfile - Mentor profile
 * @returns {Number} - Match score (0-100)
 */
const calculateMatchScore = (menteePreferences, mentorProfile) => {
  let score = 0;
  let maxScore = 0;

  // Weight factors
  const weights = {
    expertise: 30,
    industries: 20,
    mentoringAreas: 30,
    availability: 20,
  };

  // 1. Expertise match (30 points)
  if (menteePreferences.expertise && menteePreferences.expertise.length > 0) {
    maxScore += weights.expertise;
    const expertiseMatches = menteePreferences.expertise.filter(exp =>
      mentorProfile.expertise.some(
        mentorExp => mentorExp.toLowerCase() === exp.toLowerCase()
      )
    );
    score += (expertiseMatches.length / menteePreferences.expertise.length) * weights.expertise;
  }

  // 2. Industry match (20 points)
  if (menteePreferences.industries && menteePreferences.industries.length > 0) {
    maxScore += weights.industries;
    const industryMatches = menteePreferences.industries.filter(ind =>
      mentorProfile.industries.some(
        mentorInd => mentorInd.toLowerCase() === ind.toLowerCase()
      )
    );
    score += (industryMatches.length / menteePreferences.industries.length) * weights.industries;
  }

  // 3. Mentoring areas match (30 points)
  if (menteePreferences.mentoringAreas && menteePreferences.mentoringAreas.length > 0) {
    maxScore += weights.mentoringAreas;
    const areaMatches = menteePreferences.mentoringAreas.filter(area =>
      mentorProfile.mentoringAreas.some(
        mentorArea => mentorArea.toLowerCase() === area.toLowerCase()
      )
    );
    score += (areaMatches.length / menteePreferences.mentoringAreas.length) * weights.mentoringAreas;
  }

  // 4. Availability (20 points)
  maxScore += weights.availability;
  if (mentorProfile.canAcceptMentees) {
    score += weights.availability;
  } else {
    score += weights.availability * 0.3; // Partial points if not immediately available
  }

  // Normalize score to 0-100
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

/**
 * Get automated mentor suggestions for a mentee
 * @param {Object} menteePreferences - Mentee's preferred areas and goals
 * @param {Number} limit - Maximum number of suggestions
 * @returns {Array} - Array of mentor suggestions with match scores
 */
const getSuggestedMentors = async (menteePreferences, limit = 5) => {
  try {
    // Get all verified mentors
    const mentors = await MentorProfile.find({
      isVerified: true,
    }).populate('user', 'name email avatar bio');

    // Calculate match scores for each mentor
    const mentorsWithScores = mentors.map(mentor => ({
      mentor: mentor.toObject(),
      matchScore: calculateMatchScore(menteePreferences, mentor),
    }));

    // Sort by match score (descending) and rating
    mentorsWithScores.sort((a, b) => {
      // Primary sort: match score
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // Secondary sort: rating
      return b.mentor.rating - a.mentor.rating;
    });

    // Return top matches
    return mentorsWithScores.slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested mentors:', error);
    throw error;
  }
};

/**
 * Get mentor recommendations based on mentee's profile and goals
 * @param {String} menteeId - Mentee's user ID
 * @param {Object} goals - Mentee's goals and preferences
 * @param {Number} limit - Maximum number of recommendations
 * @returns {Array} - Array of recommended mentors
 */
const getRecommendedMentors = async (menteeId, goals, limit = 5) => {
  try {
    // Get mentee profile
    const mentee = await User.findById(menteeId);
    if (!mentee) {
      throw new Error('Mentee not found');
    }

    // Extract preferences from goals
    const preferences = {
      expertise: goals.expertise || [],
      industries: goals.industries || [],
      mentoringAreas: goals.mentoringAreas || [],
    };

    // Get suggested mentors
    const suggestions = await getSuggestedMentors(preferences, limit);

    return suggestions;
  } catch (error) {
    console.error('Error getting recommended mentors:', error);
    throw error;
  }
};

/**
 * Find mentors by specific criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} - Array of matching mentors
 */
const findMentorsByCriteria = async (criteria) => {
  try {
    const {
      expertise,
      industries,
      mentoringAreas,
      minRating,
      availableOnly,
      minExperience,
      maxExperience,
    } = criteria;

    // Build query
    const query = { isVerified: true };

    if (expertise && expertise.length > 0) {
      query.expertise = { $in: expertise };
    }

    if (industries && industries.length > 0) {
      query.industries = { $in: industries };
    }

    if (mentoringAreas && mentoringAreas.length > 0) {
      query.mentoringAreas = { $in: mentoringAreas };
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    if (availableOnly) {
      query.isAvailable = true;
      query.$expr = {
        $lt: ['$availability.currentMentees', '$availability.maxMentees'],
      };
    }

    if (minExperience || maxExperience) {
      query.yearsOfExperience = {};
      if (minExperience) query.yearsOfExperience.$gte = minExperience;
      if (maxExperience) query.yearsOfExperience.$lte = maxExperience;
    }

    const mentors = await MentorProfile.find(query)
      .populate('user', 'name email avatar bio')
      .sort('-rating -totalMentorships');

    return mentors;
  } catch (error) {
    console.error('Error finding mentors by criteria:', error);
    throw error;
  }
};

/**
 * Get similar mentors based on a given mentor
 * @param {String} mentorId - Mentor profile ID
 * @param {Number} limit - Maximum number of similar mentors
 * @returns {Array} - Array of similar mentors
 */
const getSimilarMentors = async (mentorId, limit = 5) => {
  try {
    // Get the reference mentor
    const referenceMentor = await MentorProfile.findById(mentorId);
    if (!referenceMentor) {
      throw new Error('Mentor not found');
    }

    // Find mentors with similar expertise and industries
    const similarMentors = await MentorProfile.find({
      _id: { $ne: mentorId },
      isVerified: true,
      $or: [
        { expertise: { $in: referenceMentor.expertise } },
        { industries: { $in: referenceMentor.industries } },
        { mentoringAreas: { $in: referenceMentor.mentoringAreas } },
      ],
    })
      .populate('user', 'name email avatar')
      .limit(limit);

    return similarMentors;
  } catch (error) {
    console.error('Error getting similar mentors:', error);
    throw error;
  }
};

/**
 * Check compatibility between mentee and mentor
 * @param {String} menteeId - Mentee user ID
 * @param {String} mentorProfileId - Mentor profile ID
 * @returns {Object} - Compatibility report
 */
const checkCompatibility = async (menteeId, mentorProfileId) => {
  try {
    const mentee = await User.findById(menteeId);
    const mentorProfile = await MentorProfile.findById(mentorProfileId);

    if (!mentee || !mentorProfile) {
      throw new Error('Mentee or mentor not found');
    }

    // For now, we'll use a basic compatibility check
    // In a real application, this would consider mentee's profile data
    const compatibility = {
      isAvailable: mentorProfile.canAcceptMentees,
      isVerified: mentorProfile.isVerified,
      rating: mentorProfile.rating,
      experience: mentorProfile.yearsOfExperience,
      totalMentorships: mentorProfile.totalMentorships,
      currentLoad: mentorProfile.availability.currentMentees,
      maxLoad: mentorProfile.availability.maxMentees,
      recommendation: mentorProfile.canAcceptMentees && mentorProfile.isVerified ? 'Highly Compatible' : 'Limited Availability',
    };

    return compatibility;
  } catch (error) {
    console.error('Error checking compatibility:', error);
    throw error;
  }
};

module.exports = {
  calculateMatchScore,
  getSuggestedMentors,
  getRecommendedMentors,
  findMentorsByCriteria,
  getSimilarMentors,
  checkCompatibility,
};
