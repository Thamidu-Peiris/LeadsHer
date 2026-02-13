const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    expertise: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one area of expertise is required',
      },
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: [0, 'Years of experience cannot be negative'],
    },
    industries: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one industry is required',
      },
    },
    mentoringAreas: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one mentoring area is required',
      },
    },
    availability: {
      maxMentees: {
        type: Number,
        default: 3,
        min: [1, 'Must allow at least 1 mentee'],
        max: [10, 'Maximum 10 mentees allowed'],
      },
      currentMentees: {
        type: Number,
        default: 0,
        min: [0, 'Current mentees cannot be negative'],
      },
      preferredTime: {
        type: [String],
        default: [],
      },
      timezone: {
        type: String,
        required: true,
      },
    },
    bio: {
      type: String,
      required: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    achievements: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be between 0 and 5'],
      max: [5, 'Rating must be between 0 and 5'],
    },
    totalMentorships: {
      type: Number,
      default: 0,
      min: [0, 'Total mentorships cannot be negative'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual to check if mentor can accept new mentees
mentorProfileSchema.virtual('canAcceptMentees').get(function () {
  return (
    this.isAvailable &&
    this.isVerified &&
    this.availability.currentMentees < this.availability.maxMentees
  );
});

// Method to update rating
mentorProfileSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating * this.totalReviews + newRating;
  this.totalReviews += 1;
  this.rating = totalRating / this.totalReviews;
  return this.save();
};

// Method to increment current mentees
mentorProfileSchema.methods.incrementMentees = function () {
  this.availability.currentMentees += 1;
  if (this.availability.currentMentees >= this.availability.maxMentees) {
    this.isAvailable = false;
  }
  return this.save();
};

// Method to decrement current mentees
mentorProfileSchema.methods.decrementMentees = function () {
  if (this.availability.currentMentees > 0) {
    this.availability.currentMentees -= 1;
    this.isAvailable = true;
  }
  return this.save();
};

// Ensure virtuals are included in JSON
mentorProfileSchema.set('toJSON', { virtuals: true });
mentorProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);
