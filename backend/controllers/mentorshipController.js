const Mentorship = require('../models/Mentorship');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

// @desc    Get all active mentorships for current user
// @route   GET /api/mentorship/active
// @access  Private
exports.getActiveMentorships = async (req, res) => {
  try {
    const { role } = req.query;

    // Build filter based on user role or query parameter
    let filter = { status: 'active' };

    if (role === 'mentor' || (req.user.role === 'Mentor' && !role)) {
      filter.mentor = req.user._id;
    } else if (role === 'mentee' || (req.user.role === 'Mentee' && !role)) {
      filter.mentee = req.user._id;
    } else {
      // Show both mentor and mentee relationships
      filter = {
        status: 'active',
        $or: [{ mentor: req.user._id }, { mentee: req.user._id }],
      };
    }

    const mentorships = await Mentorship.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('mentee', 'name email avatar')
      .sort('-startDate');

    res.status(200).json({
      data: mentorships,
      count: mentorships.length,
    });
  } catch (error) {
    console.error('Error fetching active mentorships:', error);
    res.status(500).json({
      message: 'Error fetching active mentorships',
      error: error.message,
    });
  }
};

// @desc    Get mentorship details by ID
// @route   GET /api/mentorship/:id
// @access  Private
exports.getMentorshipById = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('mentor', 'name email avatar bio')
      .populate('mentee', 'name email avatar bio');

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor._id.toString() !== req.user._id.toString() &&
      mentorship.mentee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    res.status(200).json({ data: mentorship });
  } catch (error) {
    console.error('Error fetching mentorship:', error);
    res.status(500).json({
      message: 'Error fetching mentorship',
      error: error.message,
    });
  }
};

// @desc    Log a mentorship session
// @route   POST /api/mentorship/:id/sessions
// @access  Private (Mentor or Mentee)
exports.logMentorshipSession = async (req, res) => {
  try {
    const { date, duration, notes, topics } = req.body;

    // Validate required fields
    if (!date || !duration) {
      return res.status(400).json({
        message: 'Please provide date and duration for the session',
      });
    }

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is active
    if (mentorship.status !== 'active') {
      return res.status(400).json({
        message: `Cannot log session for ${mentorship.status} mentorship`,
      });
    }

    // Validate session date
    const sessionDate = new Date(date);
    if (sessionDate > new Date()) {
      return res.status(400).json({
        message: 'Session date cannot be in the future',
      });
    }

    if (sessionDate < mentorship.startDate) {
      return res.status(400).json({
        message: 'Session date cannot be before mentorship start date',
      });
    }

    // Add session
    mentorship.sessions.push({
      date: sessionDate,
      duration: parseInt(duration),
      notes: notes || '',
      topics: topics || [],
    });

    await mentorship.save();

    await mentorship.populate([
      { path: 'mentor', select: 'name email avatar' },
      { path: 'mentee', select: 'name email avatar' },
    ]);

    res.status(201).json({
      message: 'Session logged successfully',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({
      message: 'Error logging session',
      error: error.message,
    });
  }
};

// @desc    Update mentorship goals
// @route   PUT /api/mentorship/:id/goals
// @access  Private (Mentor or Mentee)
exports.updateMentorshipGoals = async (req, res) => {
  try {
    const { goals } = req.body;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({
        message: 'Please provide at least one goal',
      });
    }

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is active
    if (mentorship.status !== 'active') {
      return res.status(400).json({
        message: `Cannot update goals for ${mentorship.status} mentorship`,
      });
    }

    mentorship.goals = goals;
    await mentorship.save();

    await mentorship.populate([
      { path: 'mentor', select: 'name email avatar' },
      { path: 'mentee', select: 'name email avatar' },
    ]);

    res.status(200).json({
      message: 'Mentorship goals updated successfully',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error updating goals:', error);
    res.status(500).json({
      message: 'Error updating goals',
      error: error.message,
    });
  }
};

// @desc    Complete mentorship
// @route   PUT /api/mentorship/:id/complete
// @access  Private (Mentor or Mentee)
exports.completeMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is active
    if (mentorship.status !== 'active') {
      return res.status(400).json({
        message: `Mentorship is already ${mentorship.status}`,
      });
    }

    // Validate minimum requirements
    if (!mentorship.canComplete) {
      const daysSinceStart = Math.floor(
        (Date.now() - mentorship.startDate) / (1000 * 60 * 60 * 24)
      );
      const issues = [];

      if (mentorship.sessions.length < 3) {
        issues.push(
          `At least 3 sessions required (current: ${mentorship.sessions.length})`
        );
      }

      if (daysSinceStart < mentorship.minimumDuration) {
        issues.push(
          `Minimum duration of ${mentorship.minimumDuration} days required (current: ${daysSinceStart} days)`
        );
      }

      return res.status(400).json({
        message: 'Mentorship does not meet minimum requirements for completion',
        requirements: issues,
      });
    }

    // Update mentorship status
    mentorship.status = 'completed';
    mentorship.endDate = Date.now();
    mentorship.completedAt = Date.now();
    await mentorship.save();

    // Update mentor profile - decrement current mentees
    const mentorProfile = await MentorProfile.findOne({
      user: mentorship.mentor,
    });
    if (mentorProfile) {
      await mentorProfile.decrementMentees();
    }

    await mentorship.populate([
      { path: 'mentor', select: 'name email avatar' },
      { path: 'mentee', select: 'name email avatar' },
    ]);

    res.status(200).json({
      message: 'Mentorship completed successfully. Please provide feedback.',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error completing mentorship:', error);
    res.status(500).json({
      message: 'Error completing mentorship',
      error: error.message,
    });
  }
};

// @desc    Submit feedback for mentorship
// @route   POST /api/mentorship/:id/feedback
// @access  Private (Mentor or Mentee)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        message: 'Please provide both rating and comment',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    const isMentor = mentorship.mentor.toString() === req.user._id.toString();
    const isMentee = mentorship.mentee.toString() === req.user._id.toString();

    if (!isMentor && !isMentee) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is completed
    if (mentorship.status !== 'completed') {
      return res.status(400).json({
        message: 'Feedback can only be submitted for completed mentorships',
      });
    }

    // Initialize feedback object if not exists
    if (!mentorship.feedback) {
      mentorship.feedback = {};
    }

    // Add feedback based on user role
    if (isMentor) {
      if (mentorship.feedback.mentorRating) {
        return res.status(400).json({
          message: 'You have already submitted feedback for this mentorship',
        });
      }
      mentorship.feedback.mentorRating = rating;
      mentorship.feedback.mentorComment = comment;
    } else {
      if (mentorship.feedback.menteeRating) {
        return res.status(400).json({
          message: 'You have already submitted feedback for this mentorship',
        });
      }
      mentorship.feedback.menteeRating = rating;
      mentorship.feedback.menteeComment = comment;
    }

    await mentorship.save();

    // If mentee provided feedback, update mentor's rating
    if (isMentee && mentorship.feedback.menteeRating) {
      const mentorProfile = await MentorProfile.findOne({
        user: mentorship.mentor,
      });
      if (mentorProfile) {
        await mentorProfile.updateRating(mentorship.feedback.menteeRating);
      }
    }

    await mentorship.populate([
      { path: 'mentor', select: 'name email avatar' },
      { path: 'mentee', select: 'name email avatar' },
    ]);

    res.status(200).json({
      message: 'Feedback submitted successfully',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      message: 'Error submitting feedback',
      error: error.message,
    });
  }
};

// @desc    Pause mentorship
// @route   PUT /api/mentorship/:id/pause
// @access  Private (Mentor or Mentee)
exports.pauseMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is active
    if (mentorship.status !== 'active') {
      return res.status(400).json({
        message: `Cannot pause ${mentorship.status} mentorship`,
      });
    }

    mentorship.status = 'paused';
    await mentorship.save();

    res.status(200).json({
      message: 'Mentorship paused successfully',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error pausing mentorship:', error);
    res.status(500).json({
      message: 'Error pausing mentorship',
      error: error.message,
    });
  }
};

// @desc    Resume paused mentorship
// @route   PUT /api/mentorship/:id/resume
// @access  Private (Mentor or Mentee)
exports.resumeMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is paused
    if (mentorship.status !== 'paused') {
      return res.status(400).json({
        message: `Cannot resume ${mentorship.status} mentorship`,
      });
    }

    mentorship.status = 'active';
    await mentorship.save();

    res.status(200).json({
      message: 'Mentorship resumed successfully',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error resuming mentorship:', error);
    res.status(500).json({
      message: 'Error resuming mentorship',
      error: error.message,
    });
  }
};

// @desc    Terminate mentorship
// @route   PUT /api/mentorship/:id/terminate
// @access  Private (Mentor or Mentee)
exports.terminateMentorship = async (req, res) => {
  try {
    const { reason } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (
      mentorship.mentor.toString() !== req.user._id.toString() &&
      mentorship.mentee.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You do not have access to this mentorship',
      });
    }

    // Check if mentorship is active or paused
    if (mentorship.status !== 'active' && mentorship.status !== 'paused') {
      return res.status(400).json({
        message: `Cannot terminate ${mentorship.status} mentorship`,
      });
    }

    mentorship.status = 'terminated';
    mentorship.endDate = Date.now();
    await mentorship.save();

    // Update mentor profile - decrement current mentees
    const mentorProfile = await MentorProfile.findOne({
      user: mentorship.mentor,
    });
    if (mentorProfile) {
      await mentorProfile.decrementMentees();
    }

    res.status(200).json({
      message: 'Mentorship terminated',
      data: mentorship,
    });
  } catch (error) {
    console.error('Error terminating mentorship:', error);
    res.status(500).json({
      message: 'Error terminating mentorship',
      error: error.message,
    });
  }
};

// @desc    Get mentorship history for current user
// @route   GET /api/mentorship/history
// @access  Private
exports.getMentorshipHistory = async (req, res) => {
  try {
    const { status, role } = req.query;

    let filter = {};

    // Filter by role
    if (role === 'mentor') {
      filter.mentor = req.user._id;
    } else if (role === 'mentee') {
      filter.mentee = req.user._id;
    } else {
      filter.$or = [{ mentor: req.user._id }, { mentee: req.user._id }];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    } else {
      // Exclude active mentorships (show only completed, paused, terminated)
      filter.status = { $in: ['completed', 'paused', 'terminated'] };
    }

    const mentorships = await Mentorship.find(filter)
      .populate('mentor', 'name email avatar')
      .populate('mentee', 'name email avatar')
      .sort('-completedAt -createdAt');

    res.status(200).json({
      data: mentorships,
      count: mentorships.length,
    });
  } catch (error) {
    console.error('Error fetching mentorship history:', error);
    res.status(500).json({
      message: 'Error fetching mentorship history',
      error: error.message,
    });
  }
};
