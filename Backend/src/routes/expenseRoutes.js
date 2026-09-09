const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getExpenses);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, upload.single('attachment'), createExpense);
router.put('/:id', protect, upload.single('attachment'), updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
