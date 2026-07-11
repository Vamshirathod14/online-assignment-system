const jwt = require('jsonwebtoken');
const { Admin, Student } = require('../models');

const activeTokens = new Map();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id);
      req.userRole = 'admin';
    } else if (decoded.role === 'student') {
      req.user = await Student.findById(decoded.id);
      req.userRole = 'student';
    } else {
      return res.status(401).json({ success: false, message: 'Invalid token role' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (decoded.role === 'student') {
      const tokenKey = `${decoded.id}`;
      const existingToken = activeTokens.get(tokenKey);

      if (existingToken && existingToken !== token) {
        activeTokens.set(tokenKey, token);
      } else if (!existingToken) {
        activeTokens.set(tokenKey, token);
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const checkActiveSession = (req, res, next) => {
  if (req.userRole === 'student') {
    const tokenKey = `${req.user._id}`;
    const currentToken = req.headers.authorization?.split(' ')[1];
    const storedToken = activeTokens.get(tokenKey);

    if (storedToken && storedToken !== currentToken) {
      return res.status(401).json({
        success: false,
        message: 'Another session is active. Please login again.',
        sessionConflict: true,
      });
    }
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

module.exports = { protect, authorize, checkActiveSession };
