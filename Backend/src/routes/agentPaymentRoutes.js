const express = require('express');
const router = express.Router();
const {
  getAgentPayments,
  getAgentPaymentById,
  recordAgentPayment,
  updateAgentPayment,
  deleteAgentPayment,
} = require('../controllers/agentPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAgentPayments);

router.route('/:id')
  .get(getAgentPaymentById)
  .put(updateAgentPayment)
  .delete(deleteAgentPayment);

router.route('/:id/pay')
  .post(recordAgentPayment);

module.exports = router;
