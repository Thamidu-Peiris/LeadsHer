const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');

// @desc    Create or update mentor profile
// @route   POST /api/mentors/profile
// @access  Private (Mentor only)
exports.createOrUpdateMentorProfile = async (req, res) => {
  try {
    const {
      expertise,
      yearsOfExperience,
      industries,
      mentoringAreas,
      availability,
      bio,
      achievements,
    } = req.body;

    // Check if user has Mentor role
    if (req.user.role !== 'Mentor') {
      return res.status(403).json({
        message: 'Only users with Mentor role can create mentor profiles',
      });
    }

    // Find existing profile or create new one
    let mentorProfile = await MentorProfile.findOne({ user: req.user._id });

    if (mentorProfile) {
      // Update existing profile
      mentorProfile.expertise = expertise || mentorProfile.expertise;
      mentorProfile.yearsOfExperience = yearsOfExperience !== undefined ? yearsOfExperience : mentorProfile.yearsOfExperience;
      mentorProfile.industries = industries || mentorProfile.industries;
      mentorProfile.mentoringAreas = mentoringAreas || mentorProfile.mentoringAreas;
      mentorProfile.bio = bio || mentorProfile.bio;
      mentorProfile.achievements = achievements || mentorProfile.achievements;
      
      if (availability) {
        mentorProfile.availability = {
          ...mentorProfile.availability,
          ...availability,
        };
      }

      await mentorProfile.save();
    } else {
      // Create new profile
      mentorProfile = await MentorProfile.create({
        user: req.user._id,
        expertise,
        yearsOfExperience,
        industries,
        mentoringAreas,
        availability: availability || {},
        bio,
        achievements: achievements || [],
      });
    }

    await mentorProfile.populate('user', 'name email avatar');

    res.status(200).json({
      message: mentorProfile.isNew ? 'Mentor profile created successfully' : 'Mentor profile updated successfully',
      data: mentorProfile,
    });
  } catch (error) {
    console.error('Error creating/updating mentor profile:', error);
    res.status(400).json({
      message: 'Error creating/updating mentor profile',
      error: error.message,
    });
  }
};

// @desc    Get all available mentors with filters
// @route   GET /api/mentors
// @access  Public
exports.getAllMentors = async (req, res) => {
  try {
    const {
      expertise,
      industry,
      minExperience,
      maxExperience,
      availableOnly,
      page = 1,
      limit = 10,
      sort = '-rating',
    } = req.query;

    // Build filter object
    const filter = {};

    if (expertise) {
      filter.expertise = { $in: expertise.split(',').map(e => e.trim()) };
    }

    if (industry) {
      filter.industries = { $in: industry.split(',').map(i => i.trim()) };
    }

    if (minExperience || maxExperience) {
      filter.yearsOfExperience = {};
      if (minExperience) filter.yearsOfExperience.$gte = parseInt(minExperience);
      if (maxExperience) filter.yearsOfExperience.$lte = parseInt(maxExperience);
    }

    if (availableOnly === 'true') {
      filter.isAvailable = true;
      filter.isVerified = true;
      filter.$expr = {
        $lt: ['$availability.currentMentees', '$availability.maxMentees'],
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const mentors = await MentorProfile.find(filter)
      .populate('user', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MentorProfile.countDocuments(filter);

    res.status(200).json({
      data: mentors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({
      message: 'Error fetching mentors',
      error: error.message,
    });
  }
};

// @desc    Get single mentor profile by ID
// @route   GET /api/mentors/:id
// @access  Public
exports.getMentorById = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findById(req.params.id).populate(
      'user',
      'name email avatar bio'
    );

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({
      message: 'Error fetching mentor profile',
      error: error.message,
    });
  }
};

// @desc    Get mentor profile by user ID
// @route   GET /api/mentors/user/:userId
// @access  Public
exports.getMentorByUserId = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({
      user: req.params.userId,
    }).populate('user', 'name email avatar bio');

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({
      message: 'Error fetching mentor profile',
      error: error.message,
    });
  }
};

// @desc    Get my mentor profile
// @route   GET /api/mentors/me
// @access  Private (Mentor only)
exports.getMyMentorProfile = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({
      user: req.user._id,
    }).populate('user', 'name email avatar bio');

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    res.status(200).json({ data: mentorProfile });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({
      message: 'Error fetching mentor profile',
      error: error.message,
    });
  }
};

// @desc    Toggle mentor availability
// @route   PUT /api/mentors/availability
// @access  Private (Mentor only)
exports.toggleAvailability = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ user: req.user._id });

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    mentorProfile.isAvailable = !mentorProfile.isAvailable;
    await mentorProfile.save();

    res.status(200).json({
      message: `Mentor profile ${mentorProfile.isAvailable ? 'activated' : 'deactivated'}`,
      data: mentorProfile,
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      message: 'Error toggling availability',
      error: error.message,
    });
  }
};

// @desc    Get mentor statistics
// @route   GET /api/mentors/:id/stats
// @access  Public
exports.getMentorStats = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findById(req.params.id);

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Get mentorship statistics
    const activeMentorships = await Mentorship.countDocuments({
      mentor: mentorProfile.user,
      status: 'active',
    });

    const completedMentorships = await Mentorship.countDocuments({
      mentor: mentorProfile.user,
      status: 'completed',
    });

    const totalSessions = await Mentorship.aggregate([
      { $match: { mentor: mentorProfile.user } },
      { $unwind: '$sessions' },
      { $count: 'total' },
    ]);

    res.status(200).json({
      data: {
        rating: mentorProfile.rating,
        totalReviews: mentorProfile.totalReviews,
        totalMentorships: mentorProfile.totalMentorships,
        activeMentorships,
        completedMentorships,
        totalSessions: totalSessions[0]?.total || 0,
        availability: mentorProfile.availability,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    res.status(500).json({
      message: 'Error fetching mentor statistics',
      error: error.message,
    });
  }
};
