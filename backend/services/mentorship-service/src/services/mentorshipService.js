const Mentorship = require('../models/Mentorship');
const MentorProfile = require('../models/MentorProfile');
const { validateSessionStartAt, normalizeSessionStartInput } = require('../utils/sessionDate');
const { agoraUidFromObjectId, buildRtcToken } = require('./agoraTokenService');

/** Prefer client local YYYY-MM-DD + HH:mm; otherwise derive UTC date/time from the stored instant. */
function sessionWallParts(sessionInstant, calendarDate, time) {
  const cd = calendarDate != null ? String(calendarDate).trim() : '';
  const tm = time != null ? String(time).trim() : '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(cd) && /^\d{2}:\d{2}$/.test(tm)) {
    return { calendarDate: cd, time: tm };
  }
  const x = sessionInstant instanceof Date ? sessionInstant : new Date(sessionInstant);
  if (Number.isNaN(x.getTime())) return { calendarDate: '', time: '' };
  const y = x.getUTCFullYear();
  const mo = String(x.getUTCMonth() + 1).padStart(2, '0');
  const day = String(x.getUTCDate()).padStart(2, '0');
  const h = String(x.getUTCHours()).padStart(2, '0');
  const min = String(x.getUTCMinutes()).padStart(2, '0');
  return { calendarDate: `${y}-${mo}-${day}`, time: `${h}:${min}` };
}

const getActiveMentorships = async (userId, userRole, queryRole) => {
  let filter = { status: 'active' };
  if (queryRole === 'mentor' || (userRole === 'mentor' && !queryRole)) {
    filter.mentor = userId;
  } else if (queryRole === 'mentee' || (userRole === 'mentee' && !queryRole)) {
    filter.mentee = userId;
  } else {
    filter = { status: 'active', $or: [{ mentor: userId }, { mentee: userId }] };
  }
  const mentorships = await Mentorship.find(filter)
    .populate('mentor', 'name email avatar profilePicture')
    .populate('mentee', 'name email avatar profilePicture')
    .sort('-startDate');
  return { data: mentorships, count: mentorships.length };
};

const getMentorshipById = async (mentorshipId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId)
    .populate('mentor', 'name email avatar profilePicture bio')
    .populate('mentee', 'name email avatar profilePicture bio');
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
  const { startAt, duration, notes, topics } = sessionData;
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  if (mentorship.mentor.toString() !== userId.toString()) {
    const err = new Error('Only the mentor can log sessions');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error(`Cannot log session for ${mentorship.status} mentorship`);
    err.status = 400;
    throw err;
  }
  const startAtStr = normalizeSessionStartInput(sessionData) || '';
  const mentorshipLowerBound = mentorship.startDate || mentorship.createdAt;
  const validated = validateSessionStartAt(startAtStr, mentorshipLowerBound);
  if (!validated.ok) {
    const err = new Error(validated.error);
    err.status = 400;
    throw err;
  }
  const sessionDate = validated.sessionDate;
  const wall = sessionWallParts(sessionDate, sessionData.calendarDate, sessionData.time);
  mentorship.sessions.push({
    date: sessionDate,
    calendarDate: wall.calendarDate,
    time: wall.time,
    duration: parseInt(duration, 10),
    notes: notes || '',
    topics: topics || [],
    callStatus: 'scheduled',
  });
  const newSession = mentorship.sessions[mentorship.sessions.length - 1];
  newSession.agoraChannel = `lh_${mentorship._id}_${newSession._id}`;
  await mentorship.save();
  await mentorship.populate([
    { path: 'mentor', select: 'name email avatar profilePicture' },
    { path: 'mentee', select: 'name email avatar profilePicture' },
  ]);
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
  await mentorship.populate([
    { path: 'mentor', select: 'name email avatar profilePicture' },
    { path: 'mentee', select: 'name email avatar profilePicture' },
  ]);
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
  await mentorship.populate([
    { path: 'mentor', select: 'name email avatar profilePicture' },
    { path: 'mentee', select: 'name email avatar profilePicture' },
  ]);
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
  const numericRating = Number(rating);
  if (isMentor) {
    if (mentorship.feedback.mentorRating) {
      const err = new Error('You have already submitted feedback for this mentorship');
      err.status = 400;
      throw err;
    }
    mentorship.feedback.mentorRating = numericRating;
    mentorship.feedback.mentorComment = comment;
  } else {
    if (mentorship.feedback.menteeRating) {
      const err = new Error('You have already submitted feedback for this mentorship');
      err.status = 400;
      throw err;
    }
    mentorship.feedback.menteeRating = numericRating;
    mentorship.feedback.menteeComment = comment;
  }
  await mentorship.save();
  if (isMentee && mentorship.feedback.menteeRating) {
    const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
    if (mentorProfile) {
      await mentorProfile.updateRating(mentorship.feedback.menteeRating);
      await mentorProfile.save();
    }
  }
  await mentorship.populate([
    { path: 'mentor', select: 'name email avatar profilePicture' },
    { path: 'mentee', select: 'name email avatar profilePicture' },
  ]);
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

const getSessionSubdoc = (mentorship, sessionId) => {
  const s = mentorship.sessions.id(sessionId);
  if (!s) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  return s;
};

const ensureSessionVideoMeta = (mentorship, sessionSub) => {
  if (!sessionSub.agoraChannel) {
    sessionSub.agoraChannel = `lh_${mentorship._id}_${sessionSub._id}`;
  }
  if (!sessionSub.callStatus) {
    sessionSub.callStatus = 'scheduled';
  }
};

const assertSessionInVideoCallWindow = (sessionSub) => {
  const start = new Date(sessionSub.date).getTime();
  if (Number.isNaN(start)) {
    const err = new Error('Invalid session time');
    err.status = 400;
    throw err;
  }
  const durMs = (Number(sessionSub.duration) || 30) * 60 * 1000;
  const end = start + durMs;
  const now = Date.now();
  const earlyMs = 15 * 60 * 1000;
  const lateMs = 60 * 60 * 1000;
  if (now < start - earlyMs) {
    const err = new Error('Video call opens 15 minutes before the scheduled start time');
    err.status = 400;
    throw err;
  }
  if (now > end + lateMs) {
    const err = new Error('This session is outside the allowed video call window');
    err.status = 400;
    throw err;
  }
};

const issueAgoraRtcToken = async (mentorshipId, sessionId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId)
    .populate('mentor', 'name email avatar profilePicture')
    .populate('mentee', 'name email avatar profilePicture');
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  const mentorId = mentorship.mentor?._id?.toString?.() || mentorship.mentor.toString();
  const menteeId = mentorship.mentee?._id?.toString?.() || mentorship.mentee.toString();
  const uidStr = userId.toString();
  if (mentorId !== uidStr && menteeId !== uidStr) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error('Video calls are only available for active mentorships');
    err.status = 400;
    throw err;
  }
  const sessionSub = getSessionSubdoc(mentorship, sessionId);
  ensureSessionVideoMeta(mentorship, sessionSub);
  if (sessionSub.callStatus === 'completed') {
    const err = new Error('This session call is already completed');
    err.status = 400;
    throw err;
  }
  assertSessionInVideoCallWindow(sessionSub);
  if (sessionSub.callStatus === 'scheduled') {
    sessionSub.callStatus = 'in_progress';
    if (!sessionSub.callStartedAt) sessionSub.callStartedAt = new Date();
  }
  await mentorship.save();
  const channelName = sessionSub.agoraChannel;
  const uid = agoraUidFromObjectId(userId);
  const built = buildRtcToken({ channelName, uid });
  return {
    appId: built.appId,
    channel: channelName,
    token: built.token,
    uid: built.uid,
    privilegeExpiredTs: built.privilegeExpiredTs,
    callStatus: sessionSub.callStatus,
  };
};

const completeSessionVideoCall = async (mentorshipId, sessionId, userId) => {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) {
    const err = new Error('Mentorship not found');
    err.status = 404;
    throw err;
  }
  const mentorId = mentorship.mentor.toString();
  const menteeId = mentorship.mentee.toString();
  const uidStr = userId.toString();
  if (mentorId !== uidStr && menteeId !== uidStr) {
    const err = new Error('You do not have access to this mentorship');
    err.status = 403;
    throw err;
  }
  if (mentorship.status !== 'active') {
    const err = new Error('Cannot update sessions for this mentorship');
    err.status = 400;
    throw err;
  }
  const sessionSub = getSessionSubdoc(mentorship, sessionId);
  ensureSessionVideoMeta(mentorship, sessionSub);
  if (sessionSub.callStatus !== 'completed') {
    sessionSub.callStatus = 'completed';
    sessionSub.callEndedAt = new Date();
    await mentorship.save();
  }
  await mentorship.populate([
    { path: 'mentor', select: 'name email avatar profilePicture' },
    { path: 'mentee', select: 'name email avatar profilePicture' },
  ]);
  return mentorship;
};

const getMentorshipHistory = async (userId, { status, role }) => {
  let filter = {};
  if (role === 'mentor') filter.mentor = userId;
  else if (role === 'mentee') filter.mentee = userId;
  else filter.$or = [{ mentor: userId }, { mentee: userId }];
  if (status) filter.status = status;
  else filter.status = { $in: ['completed', 'paused', 'terminated'] };
  const mentorships = await Mentorship.find(filter)
    .populate('mentor', 'name email avatar profilePicture')
    .populate('mentee', 'name email avatar profilePicture')
    .sort({ endDate: -1, completedAt: -1, createdAt: -1 });
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
  issueAgoraRtcToken,
  completeSessionVideoCall,
};
