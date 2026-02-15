const mentorService = require('../services/mentorService');

exports.createOrUpdateMentorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'Mentor') {
      return res.status(403).json({ message: 'Only users with Mentor role can create mentor profiles' });
    }
    const mentorProfile = await mentorService.createOrUpdateProfile(req.user._id, req.body);
    res.status(200).json({
      message: mentorProfile.isNew ? 'Mentor profile created successfully' : 'Mentor profile updated successfully',
      data: mentorProfile,
    });
  } catch (error) {
    console.error('Error creating/updating mentor profile:', error);
    res.status(error.status || 400).json({ message: 'Error creating/updating mentor profile', error: error.message });
  }
};

exports.getAllMentors = async (req, res) => {
  try {
    const result = await mentorService.getAllMentors(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentors', error: error.message });
  }
};

exports.getMentorById = async (req, res) => {
  try {
    const mentorProfile = await mentorService.getMentorById(req.params.id);
    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentor profile', error: error.message });
  }
};

exports.getMentorByUserId = async (req, res) => {
  try {
    const mentorProfile = await mentorService.getMentorByUserId(req.params.userId);
    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentor profile', error: error.message });
  }
};

exports.getMyMentorProfile = async (req, res) => {
  try {
    const mentorProfile = await mentorService.getMyProfile(req.user._id);
    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentor profile', error: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const mentorProfile = await mentorService.toggleAvailability(req.user._id);
    res.status(200).json({
      message: `Mentor profile ${mentorProfile.isAvailable ? 'activated' : 'deactivated'}`,
      data: mentorProfile,
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(error.status || 500).json({ message: 'Error toggling availability', error: error.message });
  }
};

exports.getMentorStats = async (req, res) => {
  try {
    const stats = await mentorService.getMentorStats(req.params.id);
    res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    res.status(error.status || 500).json({ message: 'Error fetching mentor statistics', error: error.message });
  }
};
