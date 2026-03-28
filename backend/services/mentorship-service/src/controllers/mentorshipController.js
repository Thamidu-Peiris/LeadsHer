const mentorshipService = require('../services/mentorshipService');
const Mentorship = require('../models/Mentorship');
const MentorshipRequest = require('../models/MentorshipRequest');
const adminOps = require('../utils/adminOperations');

exports.getActiveMentorships = async (req, res) => {
  try {
    const result = await mentorshipService.getActiveMentorships(req.user._id, req.user.role, req.query.role);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching active mentorships:', error);
    res.status(error.status || 500).json({ message: 'Error fetching active mentorships', error: error.message });
  }
};

exports.getMentorshipById = async (req, res) => {
  try {
    const mentorship = await mentorshipService.getMentorshipById(req.params.id, req.user._id);
    res.status(200).json({ data: mentorship });
  } catch (error) {
    console.error('Error fetching mentorship:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentorship', error: error.message });
  }
};

exports.logMentorshipSession = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const startAt = body.startAt ?? body.date;
    const { duration, notes, topics } = body;
    // validateSession middleware already enforces shape; keep a safe fallback for misconfigured routes
    if (startAt == null || startAt === '' || duration === undefined || duration === null) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: ['Session date is required'],
      });
    }
    const mentorship = await mentorshipService.logSession(req.params.id, req.user._id, {
      startAt,
      duration,
      notes,
      topics,
      date: body.date,
      calendarDate: body.calendarDate,
      time: body.time,
    });
    res.status(201).json({ message: 'Session logged successfully', data: mentorship });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(error.status || 500).json({ message: 'Error logging session', error: error.message });
  }
};

exports.updateMentorshipGoals = async (req, res) => {
  try {
    const { goals } = req.body;
    if (!goals || !Array.isArray(goals) || goals.length === 0) return res.status(400).json({ message: 'Please provide at least one goal' });
    const mentorship = await mentorshipService.updateGoals(req.params.id, req.user._id, goals);
    res.status(200).json({ message: 'Mentorship goals updated successfully', data: mentorship });
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(error.status || 500).json({ message: 'Error updating goals', error: error.message });
  }
};

exports.completeMentorship = async (req, res) => {
  try {
    const mentorship = await mentorshipService.completeMentorship(req.params.id, req.user._id);
    res.status(200).json({ message: 'Mentorship completed successfully. Please provide feedback.', data: mentorship });
  } catch (error) {
    console.error('Error completing mentorship:', error);
    const response = { message: error.message || 'Error completing mentorship' };
    if (error.requirements) response.requirements = error.requirements;
    res.status(error.status || 500).json(response);
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Please provide both rating and comment' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const mentorship = await mentorshipService.submitFeedback(req.params.id, req.user._id, { rating, comment });
    res.status(200).json({ message: 'Feedback submitted successfully', data: mentorship });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(error.status || 500).json({ message: 'Error submitting feedback', error: error.message });
  }
};

exports.pauseMentorship = async (req, res) => {
  try {
    const mentorship = await mentorshipService.pauseMentorship(req.params.id, req.user._id);
    res.status(200).json({ message: 'Mentorship paused successfully', data: mentorship });
  } catch (error) {
    console.error('Error pausing mentorship:', error);
    res.status(error.status || 500).json({ message: 'Error pausing mentorship', error: error.message });
  }
};

exports.resumeMentorship = async (req, res) => {
  try {
    const mentorship = await mentorshipService.resumeMentorship(req.params.id, req.user._id);
    res.status(200).json({ message: 'Mentorship resumed successfully', data: mentorship });
  } catch (error) {
    console.error('Error resuming mentorship:', error);
    res.status(error.status || 500).json({ message: 'Error resuming mentorship', error: error.message });
  }
};

exports.terminateMentorship = async (req, res) => {
  try {
    const { reason } = req.body;
    const mentorship = await mentorshipService.terminateMentorship(req.params.id, req.user._id, reason);
    res.status(200).json({ message: 'Mentorship terminated', data: mentorship });
  } catch (error) {
    console.error('Error terminating mentorship:', error);
    res.status(error.status || 500).json({ message: 'Error terminating mentorship', error: error.message });
  }
};

exports.getMentorshipHistory = async (req, res) => {
  try {
    const result = await mentorshipService.getMentorshipHistory(req.user._id, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching mentorship history:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentorship history', error: error.message });
  }
};

// Admin endpoints
exports.adminGetMentorshipRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query?.status) filter.status = req.query.status;
    const items = await MentorshipRequest.find(filter)
      .populate('mentor', 'name email avatar profilePicture')
      .populate('mentee', 'name email avatar profilePicture')
      .sort('-createdAt');
    res.status(200).json({ data: items, count: items.length });
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error fetching mentorship requests', error: error.message });
  }
};

exports.adminGetActiveMentorships = async (req, res) => {
  try {
    const items = await Mentorship.find({ status: 'active' })
      .populate('mentor', 'name email avatar profilePicture')
      .populate('mentee', 'name email avatar profilePicture')
      .sort('-startDate');
    res.status(200).json({ data: items, count: items.length });
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error fetching active mentorships', error: error.message });
  }
};

exports.adminTerminateMentorship = async (req, res) => {
  try {
    const item = await Mentorship.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Mentorship not found' });
    if (!['active', 'paused'].includes(item.status)) {
      return res.status(400).json({ message: `Cannot terminate ${item.status} mentorship` });
    }
    item.status = 'terminated';
    item.endDate = Date.now();
    await item.save();
    await item.populate([
      { path: 'mentor', select: 'name email profilePicture' },
      { path: 'mentee', select: 'name email profilePicture' },
    ]);
    res.status(200).json({ message: 'Mentorship terminated by admin', data: item });
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error terminating mentorship', error: error.message });
  }
};

exports.adminGetFeedbackRatings = async (req, res) => {
  try {
    const items = await Mentorship.find({
      status: 'completed',
      $or: [{ 'feedback.mentorRating': { $exists: true } }, { 'feedback.menteeRating': { $exists: true } }],
    })
      .populate('mentor', 'name email avatar profilePicture')
      .populate('mentee', 'name email avatar profilePicture')
      .sort('-completedAt');
    res.status(200).json({ data: items, count: items.length });
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error fetching feedback & ratings', error: error.message });
  }
};

exports.adminGetReports = async (req, res) => {
  try {
    const stats = await adminOps.getPlatformStats();
    const attention = await adminOps.getMentorshipsRequiringAttention();
    res.status(200).json({ data: { stats, attention } });
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error generating mentorship reports', error: error.message });
  }
};
