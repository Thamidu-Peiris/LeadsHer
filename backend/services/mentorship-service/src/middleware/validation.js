// Validation middleware for mentorship system

const { validateSessionDateShape } = require('../utils/sessionDate');

exports.validateMentorProfile = (req, res, next) => {
  const { expertise, yearsOfExperience, industries, mentoringAreas, bio, availability } = req.body;
  const errors = [];
  if (expertise && (!Array.isArray(expertise) || expertise.length === 0)) errors.push('Expertise must be a non-empty array');
  if (yearsOfExperience !== undefined) { const years = parseInt(yearsOfExperience); if (isNaN(years) || years < 0) errors.push('Years of experience must be a non-negative number'); }
  if (industries && (!Array.isArray(industries) || industries.length === 0)) errors.push('Industries must be a non-empty array');
  if (mentoringAreas && (!Array.isArray(mentoringAreas) || mentoringAreas.length === 0)) errors.push('Mentoring areas must be a non-empty array');
  if (bio && typeof bio !== 'string') errors.push('Bio must be a string');
  if (bio && bio.length > 1000) errors.push('Bio cannot exceed 1000 characters');
  if (availability) {
    if (availability.maxMentees !== undefined) { const max = parseInt(availability.maxMentees); if (isNaN(max) || max < 1 || max > 10) errors.push('Max mentees must be between 1 and 10'); }
    if (availability.preferredTime && !Array.isArray(availability.preferredTime)) errors.push('Preferred time must be an array');
    if (availability.timezone && typeof availability.timezone !== 'string') errors.push('Timezone must be a string');
  }
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateMentorshipRequest = (req, res, next) => {
  const { mentorId, goals, preferredStartDate, message } = req.body;
  const errors = [];
  if (!mentorId || typeof mentorId !== 'string') errors.push('Valid mentor ID is required');
  if (!goals || !Array.isArray(goals) || goals.length === 0) errors.push('At least one goal is required');
  if (goals && goals.some(goal => typeof goal !== 'string' || goal.trim() === '')) errors.push('All goals must be non-empty strings');
  if (!preferredStartDate) {
    errors.push('Preferred start date is required');
  } else {
    const date = new Date(preferredStartDate);
    if (isNaN(date.getTime())) errors.push('Invalid preferred start date');
    else if (date <= new Date()) errors.push('Preferred start date must be in the future');
  }
  if (!message || typeof message !== 'string' || message.trim() === '') errors.push('Message is required');
  if (message && message.length > 500) errors.push('Message cannot exceed 500 characters');
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateSession = (req, res, next) => {
  const { date, duration, notes, topics } = req.body;
  const errors = [];
  if (!date) {
    errors.push('Session date is required');
  } else {
    const ymd = typeof date === 'string' ? date.trim().slice(0, 10) : '';
    const check = validateSessionDateShape(ymd);
    if (!check.ok) errors.push(check.error);
  }
  if (!duration) {
    errors.push('Session duration is required');
  } else {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur < 15) errors.push('Session duration must be at least 15 minutes');
  }
  if (notes && typeof notes !== 'string') errors.push('Notes must be a string');
  if (notes && notes.length > 1000) errors.push('Notes cannot exceed 1000 characters');
  if (topics && !Array.isArray(topics)) errors.push('Topics must be an array');
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateFeedback = (req, res, next) => {
  const { rating, comment } = req.body;
  const errors = [];
  if (!rating) {
    errors.push('Rating is required');
  } else {
    const rate = parseInt(rating);
    if (isNaN(rate) || rate < 1 || rate > 5) errors.push('Rating must be between 1 and 5');
  }
  if (!comment || typeof comment !== 'string' || comment.trim() === '') errors.push('Comment is required');
  if (comment && comment.length > 500) errors.push('Comment cannot exceed 500 characters');
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateGoals = (req, res, next) => {
  const { goals } = req.body;
  const errors = [];
  if (!goals || !Array.isArray(goals) || goals.length === 0) errors.push('At least one goal is required');
  if (goals && goals.some(goal => typeof goal !== 'string' || goal.trim() === '')) errors.push('All goals must be non-empty strings');
  if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });
  next();
};

exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) return res.status(400).json({ message: 'Invalid ID format' });
  next();
};
