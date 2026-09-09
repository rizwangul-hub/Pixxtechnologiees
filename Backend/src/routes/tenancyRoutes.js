const express = require('express');
const router = express.Router();
const { assignTenancy, getTenancies, endTenancy } = require('../controllers/tenancyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTenancies).post(protect, assignTenancy);
router.post('/:id/end', protect, endTenancy);
router.put('/:id/end', protect, endTenancy);

module.exports = router;
