const MentorshipRequest = require('../models/MentorshipRequest');
const MentorProfile = require('../models/MentorProfile');
const Mentorship = require('../models/Mentorship');

const createRequest = async (userId, { mentorId, goals, preferredStartDate, message }) => {
  const mentorProfile = await MentorProfile.findOne({ user: mentorId });
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  if (!mentorProfile.isVerified) {
    const err = new Error('This mentor is not verified to accept requests');
    err.status = 400;
    throw err;
  }
  if (!mentorProfile.canAcceptMentees) {
    const err = new Error('This mentor is not currently accepting new mentees');
    err.status = 400;
    throw err;
  }
  const activeMentorship = await Mentorship.findOne({ mentee: userId, status: 'active' });
  if (activeMentorship) {
    const err = new Error('You already have an active mentorship. Complete it before requesting a new one.');
    err.status = 400;
    throw err;
  }
  const existingRequest = await MentorshipRequest.findOne({ mentor: mentorId, mentee: userId, status: 'pending' });
  if (existingRequest) {
    const err = new Error('You already have a pending request to this mentor');
    err.status = 400;
    throw err;
  }
  const startDate = new Date(preferredStartDate);
  if (startDate <= new Date()) {
    const err = new Error('Preferred start date must be in the future');
    err.status = 400;
    throw err;
  }
  const mentorshipRequest = await MentorshipRequest.create({ mentor: mentorId, mentee: userId, goals, preferredStartDate: startDate, message });
  await mentorshipRequest.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return mentorshipRequest;
};

const getRequests = async (userId, userRole, { status, type = 'received' }) => {
  const filter = {};
  if (type === 'received' && userRole === 'mentor') filter.mentor = userId;
  else if (type === 'sent') filter.mentee = userId;
  else filter.$or = [{ mentor: userId }, { mentee: userId }];
  if (status) filter.status = status;
  const requests = await MentorshipRequest.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-createdAt');
  return { data: requests, count: requests.length };
};

const getRequestById = async (requestId, userId) => {
  const request = await MentorshipRequest.findById(requestId).populate('mentor', 'name email avatar bio').populate('mentee', 'name email avatar bio');
  if (!request) {
    const err = new Error('Mentorship request not found');
    err.status = 404;
    throw err;
  }
  if (request.mentor._id.toString() !== userId.toString() && request.mentee._id.toString() !== userId.toString()) {
    const err = new Error('You do not have access to this request');
    err.status = 403;
    throw err;
  }
  return request;
};

const acceptRequest = async (requestId, userId, responseMessage) => {
  const request = await MentorshipRequest.findById(requestId);
  if (!request) {
    const err = new Error('Mentorship request not found');
    err.status = 404;
    throw err;
  }
  if (request.mentor.toString() !== userId.toString()) {
    const err = new Error('Only the mentor can accept this request');
    err.status = 403;
    throw err;
  }
  if (request.status !== 'pending') {
    const err = new Error(`Request is already ${request.status}`);
    err.status = 400;
    throw err;
  }
  const mentorProfile = await MentorProfile.findOne({ user: userId });
  if (!mentorProfile) {
    const err = new Error('Mentor profile not found');
    err.status = 404;
    throw err;
  }
  if (!mentorProfile.canAcceptMentees) {
    const err = new Error('You cannot accept new mentees at this time');
    err.status = 400;
    throw err;
  }
  const activeMentorship = await Mentorship.findOne({ mentee: request.mentee, status: 'active' });
  if (activeMentorship) {
    const err = new Error('This mentee already has an active mentorship');
    err.status = 400;
    throw err;
  }
  request.status = 'accepted';
  request.respondedAt = Date.now();
  request.responseMessage = responseMessage || 'Request accepted';
  await request.save();
  // Start mentorship immediately on accept (preferredStartDate is scheduling preference).
  const mentorship = await Mentorship.create({
    mentor: request.mentor,
    mentee: request.mentee,
    goals: request.goals,
    startDate: Date.now(),
    status: 'active',
  });
  await mentorProfile.incrementMentees();
  mentorProfile.totalMentorships += 1;
  await mentorProfile.save();
  await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return { request, mentorship };
};

const rejectRequest = async (requestId, userId, responseMessage) => {
  const request = await MentorshipRequest.findById(requestId);
  if (!request) {
    const err = new Error('Mentorship request not found');
    err.status = 404;
    throw err;
  }
  if (request.mentor.toString() !== userId.toString()) {
    const err = new Error('Only the mentor can reject this request');
    err.status = 403;
    throw err;
  }
  if (request.status !== 'pending') {
    const err = new Error(`Request is already ${request.status}`);
    err.status = 400;
    throw err;
  }
  request.status = 'rejected';
  request.respondedAt = Date.now();
  request.responseMessage = responseMessage || 'Request rejected';
  await request.save();
  await request.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
  return request;
};

const cancelRequest = async (requestId, userId) => {
  const request = await MentorshipRequest.findById(requestId);
  if (!request) {
    const err = new Error('Mentorship request not found');
    err.status = 404;
    throw err;
  }
  if (request.mentee.toString() !== userId.toString()) {
    const err = new Error('Only the mentee can cancel this request');
    err.status = 403;
    throw err;
  }
  if (request.status !== 'pending') {
    const err = new Error(`Cannot cancel request that is already ${request.status}`);
    err.status = 400;
    throw err;
  }
  request.status = 'cancelled';
  await request.save();
  return request;
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};
