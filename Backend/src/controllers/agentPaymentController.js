const AgentPayment = require('../models/AgentPayment');
const { generateMonthlyAgentSettlements, recalculateAgentPayment } = require('../services/agentSettlementService');
const { recordLedgerTransaction } = require('../services/financialReconciliationService');

// @desc    Get all agent payments with filtering and pagination
// @route   GET /api/agent-payments
// @access  Private
const getAgentPayments = async (req, res) => {
  try {
    await generateMonthlyAgentSettlements();

    const {
      agentId,
      propertyId,
      unitId,
      tenantId,
      billingMonth,
      billingYear,
      status,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    if (agentId) filter.agentId = agentId;
    if (propertyId) filter.propertyId = propertyId;
    if (unitId) filter.unitId = unitId;
    if (tenantId) filter.tenantId = tenantId;
    if (billingMonth) filter.billingMonth = parseInt(billingMonth, 10);
    if (billingYear) filter.billingYear = parseInt(billingYear, 10);
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      filter.dueDate = {};
      if (dateFrom) filter.dueDate.$gte = dateFrom;
      if (dateTo) filter.dueDate.$lte = dateTo;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await AgentPayment.countDocuments(filter);
    const payments = await AgentPayment.find(filter)
      .populate('agentId', 'fullName phone email region')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .populate('tenantId', 'fullName name phone email')
      .populate('tenancyId', 'monthlyRent companyMonthlyAmount')
      .sort({ billingYear: -1, billingMonth: -1, dueDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate totals across filtered set
    const allFiltered = await AgentPayment.find(filter);
    const summary = {
      totalExpected: allFiltered.reduce((s, p) => s + (p.expectedAmount || 0), 0),
      totalExpenses: allFiltered.reduce((s, p) => s + (p.expenseAmount || 0), 0),
      totalNet: allFiltered.reduce((s, p) => s + (p.netAmount || 0), 0),
      totalPaid: allFiltered.reduce((s, p) => s + (p.paidAmount || 0), 0),
      totalRemaining: allFiltered.reduce((s, p) => s + (p.remainingAmount || 0), 0),
    };

    res.status(200).json({
      success: true,
      message: 'Agent payments retrieved successfully',
      count: payments.length,
      summary,
      data: payments,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[Get Agent Payments Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent payments',
      errors: [error.message],
    });
  }
};

// @desc    Get single agent payment by ID
// @route   GET /api/agent-payments/:id
// @access  Private
const getAgentPaymentById = async (req, res) => {
  try {
    const payment = await AgentPayment.findById(req.params.id)
      .populate('agentId', 'fullName phone email region')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name price')
      .populate('tenantId', 'fullName name phone email')
      .populate('tenancyId', 'monthlyRent companyMonthlyAmount startDate');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Agent payment record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agent payment record retrieved successfully',
      data: payment,
    });
  } catch (error) {
    console.error('[Get Agent Payment By ID Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent payment record',
      errors: [error.message],
    });
  }
};

// @desc    Record payment received from Agent
// @route   POST /api/agent-payments/:id/pay
// @access  Private
const recordAgentPayment = async (req, res) => {
  try {
    const payment = await AgentPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Agent payment record not found',
      });
    }

    const { amountPaid, paidAmount, paymentMethod, paidDate, reference, notes } = req.body;
    const incomingAmount = parseFloat(amountPaid !== undefined ? amountPaid : paidAmount);

    if (isNaN(incomingAmount) || incomingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive payment amount is required',
      });
    }

    // Recalculate expenses and net amount first
    await recalculateAgentPayment(payment._id);
    const updated = await AgentPayment.findById(payment._id);

    const currentPaid = updated.paidAmount || 0;
    const newTotalPaid = currentPaid + incomingAmount;
    const paymentRecordDate = paidDate || new Date().toISOString().split('T')[0];

    updated.paidAmount = newTotalPaid;
    updated.paidDate = paymentRecordDate;
    if (paymentMethod) updated.paymentMethod = paymentMethod;
    if (reference) updated.reference = reference;
    if (notes) updated.notes = notes;

    // Push to partial payments history array
    updated.payments.push({
      amount: incomingAmount,
      date: paymentRecordDate,
      paymentMethod: paymentMethod || 'Bank Transfer',
      reference: reference || '',
      notes: notes || '',
      recordedBy: req.manager ? req.manager._id : null,
    });

    await updated.save();

    // Record immutable ledger entry
    await recordLedgerTransaction({
      transactionType: 'AgentPayment',
      entryType: 'Credit',
      amount: incomingAmount,
      date: paymentRecordDate,
      propertyId: updated.propertyId,
      unitId: updated.unitId,
      tenantId: updated.tenantId,
      tenancyId: updated.tenancyId,
      agentId: updated.agentId,
      relatedSettlementId: updated._id,
      description: `Payment received from Agent for ${updated.billingMonth}/${updated.billingYear}`,
      reference: reference || '',
      paymentMethod: paymentMethod || 'Bank Transfer',
      createdBy: req.manager ? req.manager._id : null,
    });

    const finalRecord = await recalculateAgentPayment(updated._id);

    res.status(200).json({
      success: true,
      message: 'Agent payment recorded successfully',
      data: finalRecord,
    });
  } catch (error) {
    console.error('[Record Agent Payment Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to record agent payment',
      errors: [error.message],
    });
  }
};

// @desc    Update agent payment details
// @route   PUT /api/agent-payments/:id
// @access  Private
const updateAgentPayment = async (req, res) => {
  try {
    const payment = await AgentPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Agent payment record not found',
      });
    }

    const { expectedAmount, paidAmount, paymentMethod, reference, notes, dueDate, paidDate } = req.body;

    if (expectedAmount !== undefined && expectedAmount >= 0) {
      payment.expectedAmount = expectedAmount;
    }
    if (paidAmount !== undefined && paidAmount >= 0) {
      payment.paidAmount = paidAmount;
    }
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (reference !== undefined) payment.reference = reference;
    if (notes !== undefined) payment.notes = notes;
    if (dueDate !== undefined) payment.dueDate = dueDate;
    if (paidDate !== undefined) payment.paidDate = paidDate;

    await payment.save();
    const recalculated = await recalculateAgentPayment(payment._id);

    res.status(200).json({
      success: true,
      message: 'Agent payment updated successfully',
      data: recalculated,
    });
  } catch (error) {
    console.error('[Update Agent Payment Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent payment record',
      errors: [error.message],
    });
  }
};

// @desc    Delete agent payment record
// @route   DELETE /api/agent-payments/:id
// @access  Private
const deleteAgentPayment = async (req, res) => {
  try {
    const payment = await AgentPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Agent payment record not found',
      });
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Agent payment record deleted successfully',
    });
  } catch (error) {
    console.error('[Delete Agent Payment Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent payment record',
      errors: [error.message],
    });
  }
};

module.exports = {
  getAgentPayments,
  getAgentPaymentById,
  recordAgentPayment,
  updateAgentPayment,
  deleteAgentPayment,
};
