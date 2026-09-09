const express = require('express');
const router = express.Router();
const {
  getLandlords,
  createLandlord,
  getLandlordById,
  updateLandlord,
  deleteLandlord,
  archiveLandlord,
  restoreLandlord,
  getLandlordProperties,
} = require('../controllers/landlordController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLandlords)
  .post(createLandlord);

router.route('/:id/archive').put(archiveLandlord);
router.route('/:id/restore').put(restoreLandlord);

router.route('/:id')
  .get(getLandlordById)
  .put(updateLandlord)
  .delete(deleteLandlord);

router.get('/:landlordId/properties', getLandlordProperties);

module.exports = router;
