const Mentorship = require('../models/Mentorship');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

exports.getActiveMentorships = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = { status: 'active' };
    if (role === 'mentor' || (req.user.role === 'Mentor' && !role)) {
      filter.mentor = req.user._id;
    } else if (role === 'mentee' || (req.user.role === 'Mentee' && !role)) {
      filter.mentee = req.user._id;
    } else {
      filter = { status: 'active', $or: [{ mentor: req.user._id }, { mentee: req.user._id }] };
    }
    const mentorships = await Mentorship.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-startDate');
    res.status(200).json({ data: mentorships, count: mentorships.length });
  } catch (error) {
    console.error('Error fetching active mentorships:', error);
    res.status(500).json({ message: 'Error fetching active mentorships', error: error.message });
  }
};

exports.getMentorshipById = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id).populate('mentor', 'name email avatar bio').populate('mentee', 'name email avatar bio');
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor._id.toString() !== req.user._id.toString() && mentorship.mentee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    res.status(200).json({ data: mentorship });
  } catch (error) {
    console.error('Error fetching mentorship:', error);
    res.status(500).json({ message: 'Error fetching mentorship', error: error.message });
  }
};

exports.logMentorshipSession = async (req, res) => {
  try {
    const { date, duration, notes, topics } = req.body;
    if (!date || !duration) return res.status(400).json({ message: 'Please provide date and duration for the session' });
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'active') return res.status(400).json({ message: `Cannot log session for ${mentorship.status} mentorship` });
    const sessionDate = new Date(date);
    if (sessionDate > new Date()) return res.status(400).json({ message: 'Session date cannot be in the future' });
    if (sessionDate < mentorship.startDate) return res.status(400).json({ message: 'Session date cannot be before mentorship start date' });
    mentorship.sessions.push({ date: sessionDate, duration: parseInt(duration), notes: notes || '', topics: topics || [] });
    await mentorship.save();
    await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(201).json({ message: 'Session logged successfully', data: mentorship });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({ message: 'Error logging session', error: error.message });
  }
};

exports.updateMentorshipGoals = async (req, res) => {
  try {
    const { goals } = req.body;
    if (!goals || !Array.isArray(goals) || goals.length === 0) return res.status(400).json({ message: 'Please provide at least one goal' });
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'active') return res.status(400).json({ message: `Cannot update goals for ${mentorship.status} mentorship` });
    mentorship.goals = goals;
    await mentorship.save();
    await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(200).json({ message: 'Mentorship goals updated successfully', data: mentorship });
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(500).json({ message: 'Error updating goals', error: error.message });
  }
};

exports.completeMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'active') return res.status(400).json({ message: `Mentorship is already ${mentorship.status}` });
    if (!mentorship.canComplete) {
      const daysSinceStart = Math.floor((Date.now() - mentorship.startDate) / (1000 * 60 * 60 * 24));
      const issues = [];
      if (mentorship.sessions.length < 3) issues.push(`At least 3 sessions required (current: ${mentorship.sessions.length})`);
      if (daysSinceStart < mentorship.minimumDuration) issues.push(`Minimum duration of ${mentorship.minimumDuration} days required (current: ${daysSinceStart} days)`);
      return res.status(400).json({ message: 'Mentorship does not meet minimum requirements for completion', requirements: issues });
    }
    mentorship.status = 'completed';
    mentorship.endDate = Date.now();
    mentorship.completedAt = Date.now();
    await mentorship.save();
    const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
    if (mentorProfile) await mentorProfile.decrementMentees();
    await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(200).json({ message: 'Mentorship completed successfully. Please provide feedback.', data: mentorship });
  } catch (error) {
    console.error('Error completing mentorship:', error);
    res.status(500).json({ message: 'Error completing mentorship', error: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Please provide both rating and comment' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    const isMentor = mentorship.mentor.toString() === req.user._id.toString();
    const isMentee = mentorship.mentee.toString() === req.user._id.toString();
    if (!isMentor && !isMentee) return res.status(403).json({ message: 'You do not have access to this mentorship' });
    if (mentorship.status !== 'completed') return res.status(400).json({ message: 'Feedback can only be submitted for completed mentorships' });
    if (!mentorship.feedback) mentorship.feedback = {};
    if (isMentor) {
      if (mentorship.feedback.mentorRating) return res.status(400).json({ message: 'You have already submitted feedback for this mentorship' });
      mentorship.feedback.mentorRating = rating;
      mentorship.feedback.mentorComment = comment;
    } else {
      if (mentorship.feedback.menteeRating) return res.status(400).json({ message: 'You have already submitted feedback for this mentorship' });
      mentorship.feedback.menteeRating = rating;
      mentorship.feedback.menteeComment = comment;
    }
    await mentorship.save();
    if (isMentee && mentorship.feedback.menteeRating) {
      const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
      if (mentorProfile) await mentorProfile.updateRating(mentorship.feedback.menteeRating);
    }
    await mentorship.populate([{ path: 'mentor', select: 'name email avatar' }, { path: 'mentee', select: 'name email avatar' }]);
    res.status(200).json({ message: 'Feedback submitted successfully', data: mentorship });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
};

exports.pauseMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'active') return res.status(400).json({ message: `Cannot pause ${mentorship.status} mentorship` });
    mentorship.status = 'paused';
    await mentorship.save();
    res.status(200).json({ message: 'Mentorship paused successfully', data: mentorship });
  } catch (error) {
    console.error('Error pausing mentorship:', error);
    res.status(500).json({ message: 'Error pausing mentorship', error: error.message });
  }
};

exports.resumeMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'paused') return res.status(400).json({ message: `Cannot resume ${mentorship.status} mentorship` });
    mentorship.status = 'active';
    await mentorship.save();
    res.status(200).json({ message: 'Mentorship resumed successfully', data: mentorship });
  } catch (error) {
    console.error('Error resuming mentorship:', error);
    res.status(500).json({ message: 'Error resuming mentorship', error: error.message });
  }
};

exports.terminateMentorship = async (req, res) => {
  try {
    const { reason } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });
    if (mentorship.mentor.toString() !== req.user._id.toString() && mentorship.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this mentorship' });
    }
    if (mentorship.status !== 'active' && mentorship.status !== 'paused') {
      return res.status(400).json({ message: `Cannot terminate ${mentorship.status} mentorship` });
    }
    mentorship.status = 'terminated';
    mentorship.endDate = Date.now();
    await mentorship.save();
    const mentorProfile = await MentorProfile.findOne({ user: mentorship.mentor });
    if (mentorProfile) await mentorProfile.decrementMentees();
    res.status(200).json({ message: 'Mentorship terminated', data: mentorship });
  } catch (error) {
    console.error('Error terminating mentorship:', error);
    res.status(500).json({ message: 'Error terminating mentorship', error: error.message });
  }
};

exports.getMentorshipHistory = async (req, res) => {
  try {
    const { status, role } = req.query;
    let filter = {};
    if (role === 'mentor') filter.mentor = req.user._id;
    else if (role === 'mentee') filter.mentee = req.user._id;
    else filter.$or = [{ mentor: req.user._id }, { mentee: req.user._id }];
    if (status) filter.status = status;
    else filter.status = { $in: ['completed', 'paused', 'terminated'] };
    const mentorships = await Mentorship.find(filter).populate('mentor', 'name email avatar').populate('mentee', 'name email avatar').sort('-completedAt -createdAt');
    res.status(200).json({ data: mentorships, count: mentorships.length });
  } catch (error) {
    console.error('Error fetching mentorship history:', error);
    res.status(500).json({ message: 'Error fetching mentorship history', error: error.message });
  }
};
