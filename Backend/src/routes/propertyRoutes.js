const express = require('express');
const router = express.Router();
const {
  getProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  archiveProperty,
  restoreProperty,
  getPropertyUnits,
} = require('../controllers/propertyController');
const { createUnit } = require('../controllers/unitController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProperties).post(protect, createProperty);
router.route('/:id/archive').put(protect, archiveProperty);
router.route('/:id/restore').put(protect, restoreProperty);
router.route('/:id').get(protect, getPropertyById).put(protect, updateProperty).delete(protect, deleteProperty);
router.route('/:id/units').get(protect, getPropertyUnits).post(protect, (req, res, next) => {
  req.body.propertyId = req.params.id;
  createUnit(req, res, next);
});
router.route('/:propertyId/units').get(protect, getPropertyUnits).post(protect, (req, res, next) => {
  req.body.propertyId = req.params.propertyId;
  createUnit(req, res, next);
});

module.exports = router;
