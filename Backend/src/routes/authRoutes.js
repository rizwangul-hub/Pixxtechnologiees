const express = require('express');
const router = express.Router();
const { loginManager, getMe, logoutManager } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public auth routes
router.post('/login', loginManager);
router.post('/logout', logoutManager);

// Protected auth routes
router.get('/me', protect, getMe);

module.exports = router;
