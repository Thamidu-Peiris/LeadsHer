const MentorshipRequest = require('../models/MentorshipRequest');
const MentorProfile = require('../models/MentorProfile');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

exports.createMentorshipRequest = async (req, res) => {
  try {
    const { mentorId, goals, preferredStartDate, message } = req.body;
    if (!mentorId || !goals || !preferredStartDate || !message) {
      return res.status(400).json({ message: 'Please provide mentorId, goals, preferredStartDate, and message' });
    }
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) return res.status(404).json({ message: 'Mentor profile not found' });
    if (!mentorProfile.isVerified) return res.status(400).json({ message: 'This mentor is not verified to accept requests' });
    if (!mentorProfile.canAcceptMentees) return res.status(400).json({ message: 'This mentor is not currently accepting new mentees' });
    const activeMentorship = await Mentorship.findOne({ mentee: req.user._id, status: 'active' });
    if (activeMentorship) return res.status(400).json({ message: 'You already have an active mentorship. Complete it before requesting a new one.' });
    const existingRequest = await MentorshipRequest.findOne({ mentor: mentorId, mentee: req.user._id, status: 'pending' });
    if (existingRequest) return res.status(400).json({ message: 'You already have a pending request to this mentor' });
    const startDate = new Date(preferredStartDate);
    if (startDate <= new Date()) return res.status(400).json({ message: 'Preferred start date must be in the future' });
    const mentorshipRequest = await MentorshipRequest.create({ mentor: mentorId, mentee: req.user._id, goals, preferredStartDate: startDate, message });
    await mentorshipRequest.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(201).json({ message: 'Mentorship request created successfully', data: mentorshipRequest });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(500).json({ message: 'Error creating mentorship request', error: error.message });
  }
};

exports.getMentorshipRequests = async (req, res) => {
  try {
    const { status, type = 'received' } = req.query;
    const filter = {};
    if (type === 'received' && req.user.role === 'Mentor') filter.mentor = req.user._id;
    else if (type === 'sent') filter.mentee = req.user._id;
    else filter.$or = [{ mentor: req.user._id }, { mentee: req.user._id }];
    if (status) filter.status = status;
    const requests = await MentorshipRequest.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-createdAt');
    res.status(200).json({ data: requests, count: requests.length });
  } catch (error) {
    console.error('Error fetching mentorship requests:', error);
    res.status(500).json({ message: 'Error fetching mentorship requests', error: error.message });
  }
};

exports.getMentorshipRequestById = async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id).populate('mentor', 'name email avatar bio').populate('mentee', 'name email avatar bio');
    if (!request) return res.status(404).json({ message: 'Mentorship request not found' });
    if (request.mentor._id.toString() !== req.user._id.toString() && request.mentee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this request' });
    }
    res.status(200).json({ data: request });
  } catch (error) {
    console.error('Error fetching mentorship request:', error);
    res.status(500).json({ message: 'Error fetching mentorship request', error: error.message });
  }
};

exports.acceptMentorshipRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Mentorship request not found' });
    if (request.mentor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the mentor can accept this request' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Request is already ${request.status}` });
    const mentorProfile = await MentorProfile.findOne({ user: req.user._id });
    if (!mentorProfile.canAcceptMentees) return res.status(400).json({ message: 'You cannot accept new mentees at this time' });
    const activeMentorship = await Mentorship.findOne({ mentee: request.mentee, status: 'active' });
    if (activeMentorship) return res.status(400).json({ message: 'This mentee already has an active mentorship' });
    request.status = 'accepted';
    request.respondedAt = Date.now();
    request.responseMessage = responseMessage || 'Request accepted';
    await request.save();
    const mentorship = await Mentorship.create({ mentor: request.mentor, mentee: request.mentee, goals: request.goals, startDate: request.preferredStartDate, status: 'active' });
    await mentorProfile.incrementMentees();
    mentorProfile.totalMentorships += 1;
    await mentorProfile.save();
    await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(200).json({ message: 'Mentorship request accepted successfully', data: { request, mentorship } });
  } catch (error) {
    console.error('Error accepting mentorship request:', error);
    res.status(500).json({ message: 'Error accepting mentorship request', error: error.message });
  }
};

exports.rejectMentorshipRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Mentorship request not found' });
    if (request.mentor.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the mentor can reject this request' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Request is already ${request.status}` });
    request.status = 'rejected';
    request.respondedAt = Date.now();
    request.responseMessage = responseMessage || 'Request rejected';
    await request.save();
    await request.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(200).json({ message: 'Mentorship request rejected', data: request });
  } catch (error) {
    console.error('Error rejecting mentorship request:', error);
    res.status(500).json({ message: 'Error rejecting mentorship request', error: error.message });
  }
};

exports.cancelMentorshipRequest = async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Mentorship request not found' });
    if (request.mentee.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the mentee can cancel this request' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Cannot cancel request that is already ${request.status}` });
    request.status = 'cancelled';
    await request.save();
    res.status(200).json({ message: 'Mentorship request cancelled', data: request });
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    res.status(500).json({ message: 'Error cancelling mentorship request', error: error.message });
  }
};
