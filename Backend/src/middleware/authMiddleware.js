const jwt = require('jsonwebtoken');
const Manager = require('../models/Manager');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'pixx_technologies_jwt_secret_key_2026_super_secure';
      const decoded = jwt.verify(token, secret);

      const manager = await Manager.findById(decoded.id).select('-password');
      if (!manager) {
        return res.status(401).json({ success: false, message: 'Not authorized, manager account not found' });
      }

      req.manager = manager;
      return next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

module.exports = { protect };
