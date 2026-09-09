const express = require('express');
const router = express.Router();
const {
  createAgentExpense,
  getAgentExpenses,
  getAgentExpenseById,
  updateAgentExpense,
  deleteAgentExpense,
} = require('../controllers/agentExpenseController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .post(upload.single('receipt'), createAgentExpense)
  .get(getAgentExpenses);

router.route('/:id')
  .get(getAgentExpenseById)
  .put(upload.single('receipt'), updateAgentExpense)
  .delete(deleteAgentExpense);

module.exports = router;
