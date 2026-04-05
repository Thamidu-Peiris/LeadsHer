const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id).select('+emailVerificationCodeHash');
        if (!currentUser) {
            return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
        }

        const settings = await AppSettings.getSingleton();
        const pending =
            settings.emailVerificationRequired !== false &&
            !currentUser.isEmailVerified &&
            currentUser.emailVerificationCodeHash;
        if (pending) {
            return res.status(403).json({
                status: 'fail',
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Verify your email to continue.',
            });
        }

        if (!currentUser.isEmailVerified && !currentUser.emailVerificationCodeHash) {
            currentUser.isEmailVerified = true;
            await currentUser.save({ validateBeforeSave: false });
        }

        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
