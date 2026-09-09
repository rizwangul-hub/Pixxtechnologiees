const AgentExpense = require('../models/AgentExpense');
const Tenancy = require('../models/Tenancy');
const AgentPayment = require('../models/AgentPayment');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { recalculateAgentPayment } = require('../services/agentSettlementService');

// @desc    Create new Agent Expense
// @route   POST /api/agent-expenses
// @access  Private
const createAgentExpense = async (req, res) => {
  try {
    const {
      agentId,
      tenancyId,
      propertyId,
      unitId,
      tenantId,
      expenseCategory,
      description,
      amount,
      date,
      notes,
      status,
    } = req.body;

    if (!agentId || !expenseCategory || !description || amount === undefined || !date) {
      return res.status(400).json({
        success: false,
        message: 'Agent, category, description, valid amount, and date are required',
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be negative or invalid',
      });
    }

    let targetPropertyId = propertyId;
    let targetUnitId = unitId;
    let targetTenantId = tenantId;
    let targetTenancyId = tenancyId;

    if (tenancyId) {
      const tenancy = await Tenancy.findById(tenancyId);
      if (tenancy) {
        if (!targetPropertyId) targetPropertyId = tenancy.propertyId;
        if (!targetUnitId) targetUnitId = tenancy.unitId;
        if (!targetTenantId) targetTenantId = tenancy.customerId;
      }
    } else if (agentId) {
      // Find active tenancy for agent if not provided
      const tenancy = await Tenancy.findOne({ agentId, status: 'Active' });
      if (tenancy) {
        targetTenancyId = tenancy._id;
        if (!targetPropertyId) targetPropertyId = tenancy.propertyId;
        if (!targetUnitId) targetUnitId = tenancy.unitId;
        if (!targetTenantId) targetTenantId = tenancy.customerId;
      }
    }

    if (!targetPropertyId || !targetUnitId || !targetTenantId || !targetTenancyId) {
      return res.status(400).json({
        success: false,
        message: 'Valid active tenancy, property, unit, and tenant references are required for agent expenses',
      });
    }

    // Parse month and year from date YYYY-MM-DD
    const dateParts = date.split('-');
    const billingYear = parseInt(dateParts[0], 10);
    const billingMonth = parseInt(dateParts[1], 10);

    let receiptUrl = '';
    let publicId = '';

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixxtechnologies/agent-expenses');
      receiptUrl = uploadResult.url;
      publicId = uploadResult.public_id;
    }

    const expense = await AgentExpense.create({
      agentId,
      tenancyId: targetTenancyId,
      propertyId: targetPropertyId,
      unitId: targetUnitId,
      tenantId: targetTenantId,
      expenseCategory,
      description,
      amount: numericAmount,
      date,
      billingMonth,
      billingYear,
      receiptUrl,
      publicId,
      notes: notes || '',
      status: status || 'Approved',
    });

    // If status is Approved, log in TransactionLedger
    if (expense.status === 'Approved') {
      const { recordLedgerTransaction } = require('../services/financialReconciliationService');
      await recordLedgerTransaction({
        transactionType: 'AgentExpenseDeduction',
        entryType: 'Debit',
        amount: numericAmount,
        date,
        propertyId: targetPropertyId,
        unitId: targetUnitId,
        tenantId: targetTenantId,
        tenancyId: targetTenancyId,
        agentId,
        relatedExpenseId: expense._id,
        description: `Agent Expense: ${description} (${expenseCategory})`,
        reference: expenseCategory,
        createdBy: req.manager ? req.manager._id : null,
      });
    }

    // Recalculate affected AgentPayment if one exists
    const payment = await AgentPayment.findOne({
      tenancyId: targetTenancyId,
      billingMonth,
      billingYear,
    });

    if (payment) {
      await recalculateAgentPayment(payment._id);
    }

    res.status(201).json({
      success: true,
      message: 'Agent expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    console.error('[Create Agent Expense Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to record agent expense',
      errors: [error.message],
    });
  }
};

// @desc    Get all agent expenses with filtering and pagination
// @route   GET /api/agent-expenses
// @access  Private
const getAgentExpenses = async (req, res) => {
  try {
    const {
      agentId,
      propertyId,
      unitId,
      tenantId,
      category,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    if (agentId) filter.agentId = agentId;
    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (tenantId) filter.tenantId = tenantId;
    if (category) filter.expenseCategory = category;
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await AgentExpense.countDocuments(filter);
    const expenses = await AgentExpense.find(filter)
      .populate('agentId', 'fullName phone email region')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .populate('tenantId', 'fullName name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const allFiltered = await AgentExpense.find(filter);
    const totalAmount = allFiltered.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Agent expenses retrieved successfully',
      count: expenses.length,
      totalAmount,
      data: expenses,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[Get Agent Expenses Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent expenses',
      errors: [error.message],
    });
  }
};

// @desc    Get single agent expense by ID
// @route   GET /api/agent-expenses/:id
// @access  Private
const getAgentExpenseById = async (req, res) => {
  try {
    const expense = await AgentExpense.findById(req.params.id)
      .populate('agentId', 'fullName phone email region')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .populate('tenantId', 'fullName name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Agent expense not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agent expense retrieved successfully',
      data: expense,
    });
  } catch (error) {
    console.error('[Get Agent Expense By ID Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent expense details',
      errors: [error.message],
    });
  }
};

// @desc    Update agent expense
// @route   PUT /api/agent-expenses/:id
// @access  Private
const updateAgentExpense = async (req, res) => {
  try {
    const expense = await AgentExpense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Agent expense not found',
      });
    }

    const { expenseCategory, description, amount, date, notes, status } = req.body;

    if (expenseCategory) expense.expenseCategory = expenseCategory;
    if (description) expense.description = description;
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (!isNaN(num) && num >= 0) expense.amount = num;
    }
    if (date) {
      expense.date = date;
      const dateParts = date.split('-');
      expense.billingYear = parseInt(dateParts[0], 10);
      expense.billingMonth = parseInt(dateParts[1], 10);
    }
    if (notes !== undefined) expense.notes = notes;
    if (status) expense.status = status;

    if (req.file) {
      if (expense.publicId) {
        await deleteFromCloudinary(expense.publicId).catch(() => {});
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixxtechnologies/agent-expenses');
      expense.receiptUrl = uploadResult.url;
      expense.publicId = uploadResult.public_id;
    }

    await expense.save();

    // Recalculate affected AgentPayment
    const payment = await AgentPayment.findOne({
      tenancyId: expense.tenancyId,
      billingMonth: expense.billingMonth,
      billingYear: expense.billingYear,
    });

    if (payment) {
      await recalculateAgentPayment(payment._id);
    }

    res.status(200).json({
      success: true,
      message: 'Agent expense updated successfully',
      data: expense,
    });
  } catch (error) {
    console.error('[Update Agent Expense Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent expense',
      errors: [error.message],
    });
  }
};

// @desc    Delete agent expense
// @route   DELETE /api/agent-expenses/:id
// @access  Private
const deleteAgentExpense = async (req, res) => {
  try {
    const expense = await AgentExpense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Agent expense not found',
      });
    }

    if (expense.publicId) {
      await deleteFromCloudinary(expense.publicId).catch(() => {});
    }

    const { tenancyId, billingMonth, billingYear } = expense;

    await expense.deleteOne();

    // Recalculate affected AgentPayment
    const payment = await AgentPayment.findOne({
      tenancyId,
      billingMonth,
      billingYear,
    });

    if (payment) {
      await recalculateAgentPayment(payment._id);
    }

    res.status(200).json({
      success: true,
      message: 'Agent expense deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Agent Expense Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent expense',
      errors: [error.message],
    });
  }
};

module.exports = {
  createAgentExpense,
  getAgentExpenses,
  getAgentExpenseById,
  updateAgentExpense,
  deleteAgentExpense,
};
