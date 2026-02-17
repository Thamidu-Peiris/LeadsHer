/**
 * Password: minimum 8 characters, at least one letter, one number, one special character.
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const validatePassword = (req, res, next) => {
  const password = req.body?.password || req.body?.newPassword;
  if (!password) return next();
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters with letters, numbers, and special characters (@$!%*#?&).',
    });
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters with letters, numbers, and special characters.',
    });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: 'Password must include at least one letter, one number, and one special character (@$!%*#?&).',
    });
  }
  next();
};

const validateBio = (req, res, next) => {
  const bio = req.body?.bio;
  if (bio != null && typeof bio === 'string' && bio.length > 500) {
    return res.status(400).json({ message: 'Bio must be at most 500 characters.' });
  }
  next();
};

module.exports = { validatePassword, validateRegister, validateBio, PASSWORD_REGEX };
