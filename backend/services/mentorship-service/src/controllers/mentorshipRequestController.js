const mentorshipRequestService = require('../services/mentorshipRequestService');

exports.createMentorshipRequest = async (req, res) => {
  try {
    const { mentorId, goals, preferredStartDate, message } = req.body;
    if (!mentorId || !goals || !preferredStartDate || !message) {
      return res.status(400).json({ message: 'Please provide mentorId, goals, preferredStartDate, and message' });
    }
    const mentorshipRequest = await mentorshipRequestService.createRequest(req.user._id, { mentorId, goals, preferredStartDate, message });
    res.status(201).json({ message: 'Mentorship request created successfully', data: mentorshipRequest });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(error.status || 500).json({ message: 'Error creating mentorship request', error: error.message });
  }
};

exports.getMentorshipRequests = async (req, res) => {
  try {
    const result = await mentorshipRequestService.getRequests(req.user._id, req.user.role, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching mentorship requests:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentorship requests', error: error.message });
  }
};

exports.getMentorshipRequestById = async (req, res) => {
  try {
    const request = await mentorshipRequestService.getRequestById(req.params.id, req.user._id);
    res.status(200).json({ data: request });
  } catch (error) {
    console.error('Error fetching mentorship request:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentorship request', error: error.message });
  }
};

exports.acceptMentorshipRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const result = await mentorshipRequestService.acceptRequest(req.params.id, req.user._id, responseMessage);
    res.status(200).json({ message: 'Mentorship request accepted successfully', data: result });
  } catch (error) {
    console.error('Error accepting mentorship request:', error);
    res.status(error.status || 500).json({ message: 'Error accepting mentorship request', error: error.message });
  }
};

exports.rejectMentorshipRequest = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const request = await mentorshipRequestService.rejectRequest(req.params.id, req.user._id, responseMessage);
    res.status(200).json({ message: 'Mentorship request rejected', data: request });
  } catch (error) {
    console.error('Error rejecting mentorship request:', error);
    res.status(error.status || 500).json({ message: 'Error rejecting mentorship request', error: error.message });
  }
};

exports.cancelMentorshipRequest = async (req, res) => {
  try {
    const request = await mentorshipRequestService.cancelRequest(req.params.id, req.user._id);
    res.status(200).json({ message: 'Mentorship request cancelled', data: request });
  } catch (error) {
    console.error('Error cancelling mentorship request:', error);
    res.status(error.status || 500).json({ message: 'Error cancelling mentorship request', error: error.message });
  }
};
