const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMortgages,
  getMortgageSummary,
  getUpcomingMortgagePayments,
  getMortgageById,
  createMortgage,
  updateMortgage,
  deleteMortgage,
  getMortgagePayments,
  recordMortgagePayment,
  addPropertyToMortgage,
  removePropertyFromMortgage,
  getPropertyMortgages,
} = require('../controllers/mortgageController');

router.use(protect);

router.get('/', getMortgages);
router.get('/summary', getMortgageSummary);
router.get('/upcoming', getUpcomingMortgagePayments);
router.get('/property/:propertyId', getPropertyMortgages);
router.get('/:id', getMortgageById);
router.post('/', createMortgage);
router.put('/:id', updateMortgage);
router.delete('/:id', deleteMortgage);

router.post('/:id/properties', addPropertyToMortgage);
router.delete('/:id/properties/:propertyId', removePropertyFromMortgage);

router.get('/:id/payments', getMortgagePayments);
router.post('/:id/payments', recordMortgagePayment);

module.exports = router;
