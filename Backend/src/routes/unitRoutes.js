const express = require('express');
const router = express.Router();
const { getUnits, createUnit, getUnitById, updateUnit, deleteUnit, archiveUnit, restoreUnit } = require('../controllers/unitController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getUnits).post(protect, createUnit);
router.route('/:id/archive').put(protect, archiveUnit);
router.route('/:id/restore').put(protect, restoreUnit);
router.route('/:id').get(protect, getUnitById).put(protect, updateUnit).delete(protect, deleteUnit);

module.exports = router;
