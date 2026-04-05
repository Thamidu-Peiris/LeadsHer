const fs = require('fs');
const crypto = require('crypto');
const Event = require('../models/Event');
const { getCloudinary } = require('../config/cloudinary');
const EventRegistration = require('../models/EventRegistration');
const Certificate = require('../models/Certificate');

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

/* ── CREATE ─────────────────────────────────────────────────────────────── */

exports.createEvent = catchAsync(async (req, res, next) => {
    if (!['admin', 'mentor'].includes(req.user.role)) {
        return next(new APIError('You do not have permission to perform this action', 403));
    }

    const newEvent = await Event.create({
        ...req.body,
        createdBy: req.user.id,
        host: req.body.host || req.user.id,
    });

    res.status(201).json({ status: 'success', data: { event: newEvent } });
});

/* ── GET ALL ────────────────────────────────────────────────────────────── */

exports.getAllEvents = catchAsync(async (req, res, next) => {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Event.find(JSON.parse(queryStr));

    if (req.query.search) {
        query = query.find({ $text: { $search: req.query.search } });
    }

    if (req.query.sort) {
        query = query.sort(req.query.sort.split(',').join(' '));
    } else {
        query = query.sort('-createdAt');
    }

    const page  = req.query.page  * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    query = query.skip((page - 1) * limit).limit(limit);

    const events = await query;

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
});

/* ── GET ONE ────────────────────────────────────────────────────────────── */

exports.getEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id)
        .populate('host', 'name email profilePicture')
        .populate('speakers', 'name email profilePicture');

    if (!event) return next(new APIError('No event found with that ID', 404));

    res.status(200).json({ status: 'success', data: { event } });
});

/* ── UPDATE ─────────────────────────────────────────────────────────────── */

exports.updateEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
        return next(new APIError('You do not have permission to perform this action', 403));
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ status: 'success', data: { event: updatedEvent } });
});

/* ── DELETE ─────────────────────────────────────────────────────────────── */

exports.deleteEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
        return next(new APIError('You do not have permission to perform this action', 403));
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(204).json({ status: 'success', data: null });
});

/* ── MY REGISTERED EVENTS ───────────────────────────────────────────────── */

exports.getMyEvents = catchAsync(async (req, res, next) => {
    const registrations = await EventRegistration.find({ user: req.user.id });
    const eventIds = registrations.map(r => r.event);
    const events = await Event.find({ _id: { $in: eventIds } }).sort('-date');

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
});

/* ── MY CREATED EVENTS (mentor / admin) ─────────────────────────────────── */

exports.getMyCreatedEvents = catchAsync(async (req, res, next) => {
    const events = await Event.find({ createdBy: req.user.id }).sort('-createdAt');

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
});

/* ── CANCEL EVENT (admin + event owner) ─────────────────────────────────── */

exports.cancelEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
        return next(new APIError('You do not have permission to cancel this event', 403));
    }

    const updated = await Event.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true, runValidators: true }
    );

    res.status(200).json({ status: 'success', data: { event: updated } });
});

/* ── RESCHEDULE EVENT (admin only) ──────────────────────────────────────── */

exports.rescheduleEvent = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    const { date, startTime, endTime, timezone } = req.body;
    const updates = {};
    if (date)      updates.date      = date;
    if (startTime) updates.startTime = startTime;
    if (endTime)   updates.endTime   = endTime;
    if (timezone)  updates.timezone  = timezone;

    // Reactivate if previously cancelled
    if (event.status === 'cancelled') updates.status = 'upcoming';

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ status: 'success', data: { event: updated } });
});

/* ── ISSUE CERTIFICATES (admin only) ────────────────────────────────────── */

exports.issueCertificates = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    const registrations = await EventRegistration.find({
        event: req.params.id,
        status: { $in: ['registered', 'attended'] },
    });

    const issued = [];
    for (const reg of registrations) {
        const code = `CERT-${event._id.toString().slice(-6).toUpperCase()}-${reg.user.toString().slice(-6).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        try {
            const cert = await Certificate.findOneAndUpdate(
                { event: event._id, user: reg.user },
                { $setOnInsert: { event: event._id, user: reg.user, issuedBy: req.user.id, certificateCode: code } },
                { upsert: true, new: true }
            );
            issued.push(cert);
        } catch (e) {
            // skip duplicates
        }
    }

    res.status(200).json({ status: 'success', results: issued.length, data: { certificates: issued } });
});

/* ── GET EVENT CERTIFICATES (admin / event owner) ───────────────────────── */

exports.getEventCertificates = catchAsync(async (req, res, next) => {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new APIError('No event found with that ID', 404));

    if (
        req.user.role !== 'admin' &&
        event.host.toString() !== req.user.id &&
        event.createdBy.toString() !== req.user.id
    ) {
        return next(new APIError('Permission denied', 403));
    }

    const certificates = await Certificate.find({ event: req.params.id })
        .populate('user', 'name email profilePicture')
        .sort('issuedAt');

    res.status(200).json({ status: 'success', results: certificates.length, data: { certificates } });
});

/* ── UPLOAD COVER (mentor / admin) — Cloudinary or local fallback ──────── */

exports.uploadEventCover = async (req, res) => {
    try {
        if (!req.file?.filename) {
            return res.status(400).json({ message: 'No image file provided.' });
        }

        const cloudinary = getCloudinary();
        if (cloudinary && req.file.path) {
            const uploadRes = await cloudinary.uploader.upload(req.file.path, {
                folder: 'leadsher/events/covers',
                resource_type: 'image',
            });
            try {
                fs.unlinkSync(req.file.path);
            } catch {}
            return res.status(201).json({ url: uploadRes.secure_url, provider: 'cloudinary' });
        }

        res.status(201).json({ url: `/uploads/events/${req.file.filename}`, provider: 'local' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Cover upload failed.' });
    }
};
