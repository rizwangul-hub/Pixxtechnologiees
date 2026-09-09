const Expense = require('../models/Expense');
const { uploadToCloudinary } = require('../services/cloudinaryService');

function calculateExpenseStatus(amount, paidAmount, dueDate) {
  const remaining = Math.max(0, amount - paidAmount);
  const todayStr = new Date().toISOString().split('T')[0];

  if (remaining <= 0) {
    return 'Paid';
  } else if (paidAmount > 0) {
    return 'Partially Paid';
  } else if (dueDate && dueDate < todayStr) {
    return 'Overdue';
  } else {
    return 'Pending';
  }
}

const mongoose = require('mongoose');

/**
 * GET /api/expenses
 */
exports.getExpenses = async (req, res) => {
  try {
    const { property, category, status, date } = req.query;
    const filter = {};
    if (property && property !== 'All' && property !== 'all' && mongoose.Types.ObjectId.isValid(property)) {
      filter.propertyId = property;
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (date) filter.date = date;

    const expenses = await Expense.find(filter)
      .populate('propertyId', 'propertyName propertyType address')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message,
    });
  }
};

/**
 * GET /api/expenses/:id
 */
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('propertyId');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch expense', error: error.message });
  }
};

/**
 * POST /api/expenses
 */
exports.createExpense = async (req, res) => {
  try {
    const { propertyId, supplier, description, category, amount, date, dueDate, paidAmount, notes } = req.body;

    if (!propertyId || !description || amount === undefined || !date) {
      return res.status(400).json({
        success: false,
        message: 'propertyId, description, amount, and date are required',
      });
    }

    const amt = Number(amount);
    const paid = Number(paidAmount || 0);
    const remaining = Math.max(0, amt - paid);
    const status = calculateExpenseStatus(amt, paid, dueDate);

    const attachments = [];
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixx_technologies/expenses');
      attachments.push(uploadResult.url);
    }

    const expense = await Expense.create({
      propertyId,
      supplier: supplier || '',
      description,
      category: category || 'Maintenance',
      amount: amt,
      date,
      dueDate: dueDate || '',
      paidAmount: paid,
      remainingAmount: remaining,
      status,
      notes: notes || '',
      attachments,
    });

    const populatedExpense = await Expense.findById(expense._id).populate('propertyId');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message,
    });
  }
};

/**
 * PUT /api/expenses/:id
 */
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const { propertyId, supplier, description, category, amount, date, dueDate, paidAmount, notes, status } = req.body;

    if (propertyId) expense.propertyId = propertyId;
    if (supplier !== undefined) expense.supplier = supplier;
    if (description) expense.description = description;
    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date) expense.date = date;
    if (dueDate !== undefined) expense.dueDate = dueDate;
    if (paidAmount !== undefined) expense.paidAmount = Number(paidAmount);
    if (notes !== undefined) expense.notes = notes;

    expense.remainingAmount = Math.max(0, expense.amount - expense.paidAmount);
    expense.status = status || calculateExpenseStatus(expense.amount, expense.paidAmount, expense.dueDate);

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixx_technologies/expenses');
      expense.attachments.push(uploadResult.url);
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id).populate('propertyId');

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/expenses/:id
 */
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete expense', error: error.message });
  }
};
