const express = require('express');
const eventController = require('../controllers/eventController');
const registrationController = require('../controllers/registrationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for Events
router.route('/')
    .get(eventController.getAllEvents)
    .post(protect, restrictTo('admin', 'mentor'), eventController.createEvent);

router.get('/my-events', protect, eventController.getMyEvents); // Get events user is registered for

router.route('/:id')
    .get(eventController.getEvent)
    .patch(protect, restrictTo('admin', 'mentor'), eventController.updateEvent) // Logic inside controller checks ownership
    .delete(protect, restrictTo('admin', 'mentor'), eventController.deleteEvent); // Logic inside controller checks ownership

// Routes for Registration
router.post('/:id/register', protect, registrationController.registerEvent);
router.delete('/:id/unregister', protect, registrationController.unregisterEvent);
router.get('/:id/attendees', protect, registrationController.getAttendees); // Host/Admin only check in controller

// Feedback could be added here or in a separate controller
// router.post('/:id/feedback', protect, registrationController.submitFeedback);

module.exports = router;
