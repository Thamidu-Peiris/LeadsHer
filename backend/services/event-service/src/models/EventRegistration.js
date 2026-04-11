const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['registered', 'attended', 'cancelled', 'waitlisted'],
            default: 'registered'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        attendedAt: {
            type: Date
        },
        /** Set when “~24h before start” reminder email was sent successfully (SMTP). */
        reminderEmailSentAt: {
            type: Date,
            default: null,
        },
        feedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                maxlength: 500
            }
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate registration
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
