const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: { type: Date, required: [true, 'Session date is required'] },
  /** Local calendar day when the session starts (YYYY-MM-DD). */
  calendarDate: { type: String, trim: true },
  /** Local wall-clock time when the session starts (HH:mm, 24h). */
  time: { type: String, trim: true },
  duration: { type: Number, required: true, min: [15, 'Session duration must be at least 15 minutes'] },
  notes: { type: String, maxlength: [1000, 'Notes cannot exceed 1000 characters'] },
  topics: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  /** Agora RTC channel name (stable per session). */
  agoraChannel: { type: String, trim: true },
  /** Video call lifecycle for this logged session (separate from overall mentorship status). */
  callStatus: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed'],
    default: 'scheduled',
  },
  callStartedAt: { type: Date },
  callEndedAt: { type: Date },
});

const feedbackSchema = new mongoose.Schema({
  mentorRating: { type: Number, min: [1, 'Rating must be between 1 and 5'], max: [5, 'Rating must be between 1 and 5'] },
  menteeRating: { type: Number, min: [1, 'Rating must be between 1 and 5'], max: [5, 'Rating must be between 1 and 5'] },
  mentorComment: { type: String, maxlength: [500, 'Comment cannot exceed 500 characters'] },
  menteeComment: { type: String, maxlength: [500, 'Comment cannot exceed 500 characters'] },
});

const mentorshipSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed', 'paused', 'terminated'], default: 'active' },
    goals: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one goal is required',
      },
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    sessions: { type: [sessionSchema], default: [] },
    feedback: { type: feedbackSchema, default: {} },
    completedAt: { type: Date },
    minimumDuration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ mentee: 1, status: 1 });
mentorshipSchema.index(
  { mentor: 1, mentee: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

mentorshipSchema.virtual('totalSessionDuration').get(function () {
  return this.sessions.reduce((total, session) => total + session.duration, 0);
});

mentorshipSchema.virtual('canComplete').get(function () {
  const daysSinceStart = (Date.now() - this.startDate) / (1000 * 60 * 60 * 24);
  const hasMinimumSessions = this.sessions.length >= 3;
  const hasMinimumDuration = daysSinceStart >= this.minimumDuration;
  return hasMinimumSessions && hasMinimumDuration && this.status === 'active';
});

mentorshipSchema.methods.isFeedbackComplete = function () {
  return (
    this.feedback.mentorRating &&
    this.feedback.menteeRating &&
    this.feedback.mentorComment &&
    this.feedback.menteeComment
  );
};

mentorshipSchema.set('toJSON', { virtuals: true });
mentorshipSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
