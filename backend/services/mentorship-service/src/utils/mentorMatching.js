const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

const calculateMatchScore = (menteePreferences, mentorProfile) => {
  let score = 0;
  let maxScore = 0;
  const weights = { expertise: 30, industries: 20, mentoringAreas: 30, availability: 20 };

  if (menteePreferences.expertise && menteePreferences.expertise.length > 0) {
    maxScore += weights.expertise;
    const matches = menteePreferences.expertise.filter(exp =>
      mentorProfile.expertise.some(me => me.toLowerCase() === exp.toLowerCase())
    );
    score += (matches.length / menteePreferences.expertise.length) * weights.expertise;
  }
  if (menteePreferences.industries && menteePreferences.industries.length > 0) {
    maxScore += weights.industries;
    const matches = menteePreferences.industries.filter(ind =>
      mentorProfile.industries.some(mi => mi.toLowerCase() === ind.toLowerCase())
    );
    score += (matches.length / menteePreferences.industries.length) * weights.industries;
  }
  if (menteePreferences.mentoringAreas && menteePreferences.mentoringAreas.length > 0) {
    maxScore += weights.mentoringAreas;
    const matches = menteePreferences.mentoringAreas.filter(area =>
      mentorProfile.mentoringAreas.some(ma => ma.toLowerCase() === area.toLowerCase())
    );
    score += (matches.length / menteePreferences.mentoringAreas.length) * weights.mentoringAreas;
  }
  maxScore += weights.availability;
  score += mentorProfile.canAcceptMentees ? weights.availability : weights.availability * 0.3;

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

const getSuggestedMentors = async (menteePreferences, limit = 5) => {
  const mentors = await MentorProfile.find({ isVerified: true }).populate('user', 'name email avatar profilePicture bio');
  const mentorsWithScores = mentors.map(mentor => ({
    mentor: mentor.toObject(),
    matchScore: calculateMatchScore(menteePreferences, mentor),
  }));
  mentorsWithScores.sort((a, b) => b.matchScore !== a.matchScore ? b.matchScore - a.matchScore : b.mentor.rating - a.mentor.rating);
  return mentorsWithScores.slice(0, limit);
};

const getRecommendedMentors = async (menteeId, goals, limit = 5) => {
  const mentee = await User.findById(menteeId);
  if (!mentee) throw new Error('Mentee not found');
  const preferences = {
    expertise: goals.expertise || [],
    industries: goals.industries || [],
    mentoringAreas: goals.mentoringAreas || [],
  };
  return getSuggestedMentors(preferences, limit);
};

const findMentorsByCriteria = async (criteria) => {
  const { expertise, industries, mentoringAreas, minRating, availableOnly, minExperience, maxExperience } = criteria;
  const query = { isVerified: true };
  if (expertise && expertise.length > 0) query.expertise = { $in: expertise };
  if (industries && industries.length > 0) query.industries = { $in: industries };
  if (mentoringAreas && mentoringAreas.length > 0) query.mentoringAreas = { $in: mentoringAreas };
  if (minRating) query.rating = { $gte: minRating };
  if (availableOnly) {
    query.isAvailable = true;
    query.$expr = { $lt: ['$availability.currentMentees', '$availability.maxMentees'] };
  }
  if (minExperience || maxExperience) {
    query.yearsOfExperience = {};
    if (minExperience) query.yearsOfExperience.$gte = minExperience;
    if (maxExperience) query.yearsOfExperience.$lte = maxExperience;
  }
  return MentorProfile.find(query).populate('user', 'name email avatar profilePicture bio').sort('-rating -totalMentorships');
};

const getSimilarMentors = async (mentorId, limit = 5) => {
  const referenceMentor = await MentorProfile.findById(mentorId);
  if (!referenceMentor) throw new Error('Mentor not found');
  return MentorProfile.find({
    _id: { $ne: mentorId },
    isVerified: true,
    $or: [
      { expertise: { $in: referenceMentor.expertise } },
      { industries: { $in: referenceMentor.industries } },
      { mentoringAreas: { $in: referenceMentor.mentoringAreas } },
    ],
  }).populate('user', 'name email avatar profilePicture').limit(limit);
};

const checkCompatibility = async (menteeId, mentorProfileId) => {
  const mentee = await User.findById(menteeId);
  const mentorProfile = await MentorProfile.findById(mentorProfileId);
  if (!mentee || !mentorProfile) throw new Error('Mentee or mentor not found');
  return {
    isAvailable: mentorProfile.canAcceptMentees,
    isVerified: mentorProfile.isVerified,
    rating: mentorProfile.rating,
    experience: mentorProfile.yearsOfExperience,
    totalMentorships: mentorProfile.totalMentorships,
    currentLoad: mentorProfile.availability.currentMentees,
    maxLoad: mentorProfile.availability.maxMentees,
    recommendation: mentorProfile.canAcceptMentees && mentorProfile.isVerified ? 'Highly Compatible' : 'Limited Availability',
  };
};

module.exports = { calculateMatchScore, getSuggestedMentors, getRecommendedMentors, findMentorsByCriteria, getSimilarMentors, checkCompatibility };
