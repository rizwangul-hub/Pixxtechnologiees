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
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProperties)
  .post(protect, createProperty);

router.route('/:id/archive').put(protect, archiveProperty);
router.route('/:id/restore').put(protect, restoreProperty);
router.route('/:id')
  .get(protect, getPropertyById)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

module.exports = router;
