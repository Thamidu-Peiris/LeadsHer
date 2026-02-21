const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Event description is required']
        },
        category: {
            type: String,
            enum: ['webinar', 'workshop', 'networking', 'conference', 'panel-discussion'],
            required: [true, 'Event category is required']
        },
        type: {
            type: String,
            enum: ['virtual', 'physical', 'hybrid'],
            required: [true, 'Event type is required']
        },
        date: {
            type: Date,
            required: [true, 'Event date is required']
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required']
        },
        endTime: {
            type: String,
            required: [true, 'End time is required']
        },
        duration: {
            type: Number, // in minutes
            required: true
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        location: {
            venue: String,
            address: String,
            city: String,
            country: String,
            virtualLink: String
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to User model in Auth Service (conceptual reference, validation might need cross-service check or loose coupling)
            // Since this is a microservice, we might store just the ID. 
            // If we need population, we generally need to duplicate data or fetch from auth service. 
            // For now, assuming we store the ID and fetch details or user is enriched at gateway/frontend.
            required: true
        },
        speakers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        coverImage: {
            type: String, // Cloudinary URL
            default: ''
        },
        capacity: {
            type: Number,
            required: [true, 'Capacity is required']
        },
        registeredAttendees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        waitlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        agenda: [{
            time: String,
            topic: String,
            speaker: String
        }],
        tags: [String],
        isPaid: {
            type: Boolean,
            default: false
        },
        price: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes for search and filtering
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
