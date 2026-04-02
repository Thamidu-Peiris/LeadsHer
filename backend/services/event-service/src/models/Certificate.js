const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        certificateCode: {
            type: String,
            unique: true,
            required: true,
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// One certificate per user per event
certificateSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
