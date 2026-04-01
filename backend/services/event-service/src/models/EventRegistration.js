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
        },
        certificateIssued: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate registration
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
