const express = require('express');
const eventController = require('../controllers/eventController');
const registrationController = require('../controllers/registrationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

/* ── Public ──────────────────────────────────────────────────────────────── */

router.get('/', eventController.getAllEvents);

/* ── Protected — must be before /:id to avoid conflict ─────────────────── */

router.get('/my-events',   protect, eventController.getMyEvents);
router.get('/my-created',  protect, restrictTo('admin', 'mentor'), eventController.getMyCreatedEvents);

/* ── Single event CRUD ──────────────────────────────────────────────────── */

router.route('/:id')
    .get(eventController.getEvent)
    .patch(protect, restrictTo('admin', 'mentor'), eventController.updateEvent)
    .delete(protect, restrictTo('admin', 'mentor'), eventController.deleteEvent);

/* ── Registration ───────────────────────────────────────────────────────── */

router.post('/:id/register',   protect, registrationController.registerEvent);
router.delete('/:id/unregister', protect, registrationController.unregisterEvent);
router.get('/:id/attendees',   protect, registrationController.getAttendees);

/* ── Feedback (any registered attendee) ─────────────────────────────────── */

router.post('/:id/feedback', protect, registrationController.submitFeedback);

/* ── Admin + event-owner actions ────────────────────────────────────────── */

router.patch('/:id/cancel',      protect, restrictTo('admin', 'mentor'), eventController.cancelEvent);

/* ── Admin-only actions ─────────────────────────────────────────────────── */

router.patch('/:id/reschedule',  protect, restrictTo('admin'), eventController.rescheduleEvent);
router.post('/:id/certificates', protect, restrictTo('admin'), eventController.issueCertificates);
router.get('/:id/certificates',  protect, eventController.getEventCertificates);

/* ── Create (mentor / admin) ────────────────────────────────────────────── */

router.post('/', protect, restrictTo('admin', 'mentor'), eventController.createEvent);

module.exports = router;
