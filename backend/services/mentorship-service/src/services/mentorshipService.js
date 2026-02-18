const Mentorship = require('../models/Mentorship');
const MentorProfile = require('../models/MentorProfile');

const getActiveMentorships = async (userId, userRole, queryRole) => {
  let filter = { status: 'active' };
  if (queryRole === 'mentor' || (userRole === 'mentor' && !queryRole)) {
    filter.mentor = userId;
  } else if (queryRole === 'mentee' || (userRole === 'mentee' && !queryRole)) {
    filter.mentee = userId;
  } else {
    filter = { status: 'active', $or: [{ mentor: userId }, { mentee: userId }] };
  }
  const mentorships = await Mentorship.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-startDate');
  return { data: mentorships, count: mentorships.length };
};

const getMentorshipById = async (mentorshipId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId).populate('mentor', 'name email avatar bio').populate('mentee', 'name email avatar bio');
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor._id.toString() !== userId.toString() && mentorship.mentee._id.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  return mentorship;
};

const logSession = async (mentorshipId, userId, sessionData) => {
  const { date, duration, notes, topics } = sessionData;
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error(`Cannot log session for ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  const sessionDate = new Date(date);
  if (sessionDate > new Date()) {
    const err = new Error('Session date cannot be in the future');
    err.status = 400;
    throw err;
  }
  if (sessionDate < mentorship.startDate) {
    const err = new Error('Session date cannot be before mentorship start date');
    err.status = 400;
    throw err;
  }
  mentorship.sessions.push({ date: sessionDate, duration: parseInt(duration), notes: notes || '', topics: topics || [] });
  await mentorship.save();
  await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return mentorship;
};

const updateGoals = async (mentorshipId, userId, goals) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error(`Cannot update goals for ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  mentorship.goals = goals;
  await mentorship.save();
  await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return mentorship;
};

const completeMentorship = async (mentorshipId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error(`Mentorship is already ${mentorship.status}`);
    err.status = 400;
    throw err;
  }
  if (!mentorship.canComplete) {
    const daysSinceStart = Math.floor((Date.now() - mentorship.startDate) / (1000 * 60 * 60 * 24));
    const issues = [];
    if (mentorship.sessions.length < 3) issues.push(`At least 3 sessions required (current: ${mentorship.sessions.length})`);
    if (daysSinceStart < mentorship.minimumDuration) issues.push(`Minimum duration of ${mentorship.minimumDuration} days required (current: ${daysSinceStart} days)`);
    const err = new Error('Mentorship does not meet minimum requirements for completion');
    err.status = 400;
    err.requirements = issues;
    throw err;
  }
  mentorship.status = 'completed';
  mentorship.endDate = Date.now();
  mentorship.completedAt = Date.now();
  await mentorship.save();
  const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
  if (mentorProfile) await mentorProfile.decrementMentees();
  await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return mentorship;
};

const submitFeedback = async (mentorshipId, userId, { rating, comment }) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  const isMentor = mentorship.mentor.toString() === userId.toString();
  const isMentee = mentorship.mentee.toString() === userId.toString();
  if (!isMentor && !isMentee) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'completed') {
    const err = new Error('Feedback can only be submitted for completed mentorships');
    err.status = 400;
    throw err;
  }
  if (!mentorship.feedback) mentorship.feedback = {};
  if (isMentor) {
    if (mentorship.feedback.mentorRating) {
      const err = new Error('You have already submitted feedback for this mentorship');
      err.status = 400;
      throw err;
    }
    mentorship.feedback.mentorRating = rating;
    mentorship.feedback.mentorComment = comment;
  } else {
    if (mentorship.feedback.menteeRating) {
      const err = new Error('You have already submitted feedback for this mentorship');
      err.status = 400;
      throw err;
    }
    mentorship.feedback.menteeRating = rating;
    mentorship.feedback.menteeComment = comment;
  }
  await mentorship.save();
  if (isMentee && mentorship.feedback.menteeRating) {
    const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
    if (mentorProfile) await mentorProfile.updateRating(mentorship.feedback.menteeRating);
  }
  await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return mentorship;
};

const pauseMentorship = async (mentorshipId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error(`Cannot pause ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  mentorship.status = 'paused';
  await mentorship.save();
  return mentorship;
};

const resumeMentorship = async (mentorshipId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'paused') {
    const err = new Error(`Cannot resume ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  mentorship.status = 'active';
  await mentorship.save();
  return mentorship;
};

const terminateMentorship = async (mentorshipId, userId, reason) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString() && mentorship.mentee.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active' && mentorship.status !== 'paused') {
    const err = new Error(`Cannot terminate ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  mentorship.status = 'terminated';
  mentorship.endDate = Date.now();
  await mentorship.save();
  const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
  if (mentorProfile) await mentorProfile.decrementMentees();
  return mentorship;
};

const getMentorshipHistory = async (userId, { status, role }) => {
  let filter = {};
  if (role === 'mentor') filter.mentor = userId;
  else if (role === 'mentee') filter.mentee = userId;
  else filter.$or = [{ mentor: userId }, { mentee: userId }];
  if (status) filter.status = status;
  else filter.status = { $in: ['completed', 'paused', 'terminated'] };
  const mentorships = await Mentorship.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-completedAt -createdAt');
  return { data: mentorships, count: mentorships.length };
};

module.exports = {
  getActiveMentorships,
  getMentorshipById,
  logSession,
  updateGoals,
  completeMentorship,
  submitFeedback,
  pauseMentorship,
  resumeMentorship,
  terminateMentorship,
  getMentorshipHistory,
};
