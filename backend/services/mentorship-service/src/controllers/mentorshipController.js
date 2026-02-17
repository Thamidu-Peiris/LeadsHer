const mentorshipService = require('../services/mentorshipService');

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
    const { date, duration, notes, topics } = req.body;
    if (!date || !duration) return res.status(400).json({ message: 'Please provide date and duration for the session' });
    const mentorship = await mentorshipService.logSession(req.params.id, req.user._id, { date, duration, notes, topics });
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
