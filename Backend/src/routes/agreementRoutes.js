const express = require('express');
const router = express.Router();
const { getAgreements, createAgreement, terminateAgreement } = require('../controllers/agreementController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAgreements).post(protect, createAgreement);
router.post('/:id/terminate', protect, terminateAgreement);

module.exports = router;
