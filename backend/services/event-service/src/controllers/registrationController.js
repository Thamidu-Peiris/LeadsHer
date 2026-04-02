const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

const catchAsync = fn => (req, res, next) => fn(req, res, next).catch(next);

class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/* ── REGISTER ───────────────────────────────────────────────────────────── */

exports.registerEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    if (event.status !== 'upcoming') {
        return next(new APIError('Cannot register for past or cancelled events', 400));
    }

    // Block registration once the event start time has passed
    if (event.date && event.startTime) {
        try {
            const eventStart = new Date(event.date);
            const [hours, minutes] = event.startTime.split(':').map(Number);
            eventStart.setUTCHours(hours, minutes, 0, 0);
            if (new Date() >= eventStart) {
                return next(new APIError('Registration is closed — this event has already started', 400));
            }
        } catch {
            // ignore date parse issues — let the request proceed
        }
    }

    const existing = await EventRegistration.findOne({ event: event._id, user: req.user.id });
    if (existing) return next(new APIError('You are already registered for this event', 400));

    const registrationCount = await EventRegistration.countDocuments({
        event: event._id,
        status: 'registered',
    });

    const status = event.capacity && registrationCount >= event.capacity ? 'waitlisted' : 'registered';

    const registration = await EventRegistration.create({
        event: event._id,
        user: req.user.id,
        status,
    });

    if (status === 'registered') {
        event.registeredAttendees.push(req.user.id);
    } else {
        event.waitlist.push(req.user.id);
    }
    await event.save({ validateBeforeSave: false });

    res.status(201).json({
        status: 'success',
        data: {
            registration,
            message: status === 'waitlisted'
                ? 'Event is full. You have been added to the waitlist.'
                : 'Successfully registered for event.',
        },
    });
});

/* ── UNREGISTER (with 2-hour cutoff) ────────────────────────────────────── */

exports.unregisterEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    const registration = await EventRegistration.findOne({
        event: event._id,
        user: req.user.id,
    });
    if (!registration) return next(new APIError('You are not registered for this event', 400));

    // 2-hour cutoff enforcement
    if (event.date && event.startTime) {
        try {
            const eventDate = new Date(event.date);
            const [hours, minutes] = event.startTime.split(':').map(Number);
            eventDate.setUTCHours(hours, minutes, 0, 0);
            const cutoff = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
            if (new Date() > cutoff) {
                return next(new APIError('Cannot unregister within 2 hours of the event start time', 400));
            }
        } catch {
            // ignore date parse issues
        }
    }

    await EventRegistration.findByIdAndDelete(registration._id);

    event.registeredAttendees = event.registeredAttendees.filter(
        id => id.toString() !== req.user.id
    );
    event.waitlist = event.waitlist.filter(
        id => id.toString() !== req.user.id
    );

    // Promote next person from waitlist
    if (registration.status === 'registered' && event.waitlist.length > 0) {
        const nextUser = event.waitlist.shift();
        event.registeredAttendees.push(nextUser);
        await EventRegistration.findOneAndUpdate(
            { event: event._id, user: nextUser },
            { status: 'registered' }
        );
    }

    await event.save({ validateBeforeSave: false });

    res.status(204).json({ status: 'success', data: null });
});

/* ── GET ATTENDEES ──────────────────────────────────────────────────────── */

exports.getAttendees = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found', 404));

    if (
        req.user.role !== 'admin' &&
        event.host.toString() !== req.user.id &&
        event.createdBy.toString() !== req.user.id
    ) {
        return next(new APIError('Permission denied', 403));
    }

    const attendees = await EventRegistration.find({ event: req.params.id })
        .populate('user', 'name email profilePicture role');

    res.status(200).json({ status: 'success', results: attendees.length, data: { attendees } });
});

/* ── SUBMIT FEEDBACK ────────────────────────────────────────────────────── */

exports.submitFeedback = catchAsync(async (req, res, next) => {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return next(new APIError('Rating must be between 1 and 5', 400));
    }

    const registration = await EventRegistration.findOne({
        event: req.params.id,
        user: req.user.id,
        status: { $in: ['registered', 'attended'] },
    });

    if (!registration) {
        return next(new APIError('You must be registered for this event to submit feedback', 403));
    }

    registration.feedback = { rating: Number(rating), comment: comment || '' };
    await registration.save();

    res.status(200).json({ status: 'success', data: { registration } });
});
