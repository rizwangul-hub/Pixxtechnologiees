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
} = require('../controllers/mortgageController');

router.use(protect);

router.get('/', getMortgages);
router.get('/summary', getMortgageSummary);
router.get('/upcoming', getUpcomingMortgagePayments);
router.get('/:id', getMortgageById);
router.post('/', createMortgage);
router.put('/:id', updateMortgage);
router.delete('/:id', deleteMortgage);

router.get('/:id/payments', getMortgagePayments);
router.post('/:id/payments', recordMortgagePayment);

module.exports = router;
