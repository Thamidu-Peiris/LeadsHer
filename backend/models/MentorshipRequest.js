const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
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
    preferredStartDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v >= new Date();
        },
        message: 'Preferred start date must be in the future',
      },
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    respondedAt: {
      type: Date,
    },
    responseMessage: {
      type: String,
      maxlength: [500, 'Response message cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate pending requests
mentorshipRequestSchema.index(
  { mentor: 1, mentee: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

// Index for querying requests by mentor
mentorshipRequestSchema.index({ mentor: 1, status: 1 });

// Index for querying requests by mentee
mentorshipRequestSchema.index({ mentee: 1, status: 1 });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
