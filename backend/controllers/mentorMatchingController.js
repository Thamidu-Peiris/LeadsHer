const {
  getRecommendedMentors,
  getSimilarMentors,
  checkCompatibility,
} = require('../utils/mentorMatching');

// @desc    Get recommended mentors for current user
// @route   GET /api/mentors/recommendations
// @access  Private
exports.getMentorRecommendations = async (req, res) => {
  try {
    const { expertise, industries, mentoringAreas, limit = 5 } = req.query;

    // Build preferences from query parameters
    const goals = {
      expertise: expertise ? expertise.split(',').map(e => e.trim()) : [],
      industries: industries ? industries.split(',').map(i => i.trim()) : [],
      mentoringAreas: mentoringAreas ? mentoringAreas.split(',').map(m => m.trim()) : [],
    };

    const recommendations = await getRecommendedMentors(
      req.user._id,
      goals,
      parseInt(limit)
    );

    res.status(200).json({
      message: 'Mentor recommendations retrieved successfully',
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting mentor recommendations:', error);
    res.status(500).json({
      message: 'Error getting mentor recommendations',
      error: error.message,
    });
  }
};

// @desc    Get similar mentors
// @route   GET /api/mentors/:id/similar
// @access  Public
exports.getSimilarMentorsById = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const similarMentors = await getSimilarMentors(
      req.params.id,
      parseInt(limit)
    );

    res.status(200).json({
      message: 'Similar mentors retrieved successfully',
      data: similarMentors,
      count: similarMentors.length,
    });
  } catch (error) {
    console.error('Error getting similar mentors:', error);
    res.status(500).json({
      message: 'Error getting similar mentors',
      error: error.message,
    });
  }
};

// @desc    Check compatibility with mentor
// @route   GET /api/mentors/:id/compatibility
// @access  Private
exports.checkMentorCompatibility = async (req, res) => {
  try {
    const compatibility = await checkCompatibility(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      message: 'Compatibility check completed',
      data: compatibility,
    });
  } catch (error) {
    console.error('Error checking compatibility:', error);
    res.status(500).json({
      message: 'Error checking compatibility',
      error: error.message,
    });
  }
};
