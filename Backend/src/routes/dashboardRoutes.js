const express = require('express');
const router = express.Router();
const {
  getUnifiedDashboard,
  getPropertyDashboard,
  getAgentDashboardSummary,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUnifiedDashboard);
router.get('/properties', protect, getPropertyDashboard);
router.get('/agent-summary', protect, getAgentDashboardSummary);
router.get('/summary', protect, getUnifiedDashboard);
router.get('/financial-summary', protect, getUnifiedDashboard);

module.exports = router;
