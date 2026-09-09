const express = require('express');
const router = express.Router();
const {
  getPayments,
  getOverduePayments,
  getUpcomingPayments,
  getPaymentSummary,
  getPaymentById,
  recordPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overdue', protect, getOverduePayments);
router.get('/upcoming', protect, getUpcomingPayments);
router.get('/summary', protect, getPaymentSummary);
router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);
router.post('/:id/pay', protect, recordPayment);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

module.exports = router;
