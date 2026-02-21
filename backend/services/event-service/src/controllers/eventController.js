const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
// Imports removed

const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Error class defined below

class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.createEvent = catchAsync(async (req, res, next) => {
    // Only admin and mentor can create events - middleware should handle this check
    // role check: req.user.role
    if (!['admin', 'mentor'].includes(req.user.role)) {
        return next(new APIError('You do not have permission to perform this action', 403));
    }

    const newEvent = await Event.create({
        ...req.body,
        createdBy: req.user.id,
        host: req.body.host || req.user.id // Default to creator if not specified
    });

    res.status(201).json({
        status: 'success',
        data: {
            event: newEvent
        }
    });
});

exports.getAllEvents = catchAsync(async (req, res, next) => {
    // Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Event.find(JSON.parse(queryStr));

    // Search
    if (req.query.search) {
        query = query.find({ $text: { $search: req.query.search } });
    }

    // Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const events = await query;

    res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
            events
        }
    });
});

exports.getEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id)
        .populate('host', 'name email profilePicture')
        .populate('speakers', 'name email profilePicture');

    if (!event) {
        return next(new APIError('No event found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            event
        }
    });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        return next(new APIError('No event found with that ID', 404));
    }

    // Check permission
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
        return next(new APIError('You function do not have permission to perform this action', 403));
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            event: updatedEvent
        }
    });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        return next(new APIError('No event found with that ID', 404));
    }

    // Check permission
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
        return next(new APIError('You do not have permission to perform this action', 403));
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getMyEvents = catchAsync(async (req, res, next) => {
    // Get events where user is registered
    const registrations = await EventRegistration.find({ user: req.user.id });
    const eventIds = registrations.map(reg => reg.event);

    const events = await Event.find({ _id: { $in: eventIds } });

    res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
            events
        }
    });
});
