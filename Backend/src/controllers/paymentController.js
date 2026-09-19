const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Tenancy = require('../models/Tenancy');
const Property = require('../models/Property');
const Expense = require('../models/Expense');
const AgentPayment = require('../models/AgentPayment');
const { generateMonthlyPayments } = require('../services/paymentGeneratorService');
const { recalculateAgentPayment } = require('../services/agentSettlementService');

/**
 * Helper to calculate status based on amounts and due date
 */
function calculatePaymentStatus(amount, paidAmount, dueDate) {
  const remaining = Math.max(0, amount - paidAmount);
  const todayStr = new Date().toISOString().split('T')[0];

  if (remaining <= 0) {
    return 'Received';
  } else if (paidAmount > 0) {
    return 'Partially Received';
  } else if (dueDate && dueDate < todayStr) {
    return 'Overdue';
  } else {
    return 'Pending';
  }
}

/**
 * GET /api/payments
 */
exports.getPayments = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const {
      property,
      propertyId,
      unit,
      customer,
      customerId,
      tenantId,
      tenancyId,
      status,
      date,
      month,
      year,
      search,
    } = req.query;

    const filter = {};
    const propId = property || propertyId;
    if (propId && mongoose.Types.ObjectId.isValid(propId)) filter.propertyId = propId;

    const custId = customer || customerId || tenantId;
    if (custId && mongoose.Types.ObjectId.isValid(custId)) filter.customerId = custId;
    if (tenancyId && mongoose.Types.ObjectId.isValid(tenancyId)) filter.tenancyId = tenancyId;

    if (status && status !== 'All') {
      if (status === 'Paid' || status === 'Received') {
        filter.status = { $in: ['Paid', 'Received'] };
      } else if (status === 'Partially Paid' || status === 'Partially Received') {
        filter.status = { $in: ['Partially Paid', 'Partially Received'] };
      } else {
        filter.status = status;
      }
    }
    if (date) filter.dueDate = date;
    if (month) filter.billingMonth = Number(month);
    if (year) filter.billingYear = Number(year);

    let payments = await Payment.find(filter)
      .populate('customerId', 'fullName phone email cnicOrId tenantName contactNumber name')
      .populate({
        path: 'propertyId',
        select: 'propertyName propertyType address name landlordId agentId agentFee',
        populate: { path: 'landlordId', select: 'fullName name phone email logo' },
      })
      .populate({
        path: 'tenancyId',
        populate: [
          { path: 'landlordId', select: 'fullName name phone email logo' },
          { path: 'agentId', select: 'fullName name phone email' },
        ],
      })
      .populate('agentId', 'fullName name phone email')
      .populate('expenseId')
      .sort({ dueDate: -1, createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      payments = payments.filter((p) => {
        const cust = p.customerId;
        const custName = (cust?.fullName || cust?.name || cust?.tenantName || '').toLowerCase();
        const custPhone = (cust?.phone || cust?.contactNumber || '').toLowerCase();
        const prop = p.propertyId;
        const propName = (prop?.propertyName || prop?.name || prop?.address || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const method = (p.paymentMethod || '').toLowerCase();
        return (
          custName.includes(q) ||
          custPhone.includes(q) ||
          propName.includes(q) ||
          ref.includes(q) ||
          notes.includes(q) ||
          method.includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/overdue
 */
exports.getOverduePayments = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date().getTime();

    const overduePayments = await Payment.find({
      $or: [
        { status: 'Overdue' },
        { dueDate: { $lt: todayStr }, remainingAmount: { $gt: 0 }, status: { $nin: ['Paid', 'Received'] } }
      ]
    })
      .populate('customerId', 'fullName phone email tenantName contactNumber name')
      .populate({
        path: 'propertyId',
        select: 'propertyName propertyType address name landlordId agentId agentFee',
        populate: { path: 'landlordId', select: 'fullName name phone email logo' },
      })
      .populate({
        path: 'tenancyId',
        populate: [
          { path: 'landlordId', select: 'fullName name phone email logo' },
          { path: 'agentId', select: 'fullName name phone email' },
        ],
      })
      .populate('agentId', 'fullName name phone email')
      .populate('expenseId')
      .sort({ dueDate: 1 });

    const formattedData = overduePayments.map((p) => {
      const pObj = p.toObject();
      const dueMs = new Date(p.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
      const landlord = p.propertyId?.landlordId || p.tenancyId?.landlordId || null;
      return {
        ...pObj,
        daysOverdue: diffDays,
        landlord,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue payments',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/upcoming
 */
exports.getUpcomingPayments = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingPayments = await Payment.find({
      dueDate: { $gte: todayStr },
      remainingAmount: { $gt: 0 },
      status: { $nin: ['Paid', 'Received'] },
    })
      .populate('customerId', 'fullName phone email tenantName contactNumber name')
      .populate('propertyId', 'propertyName propertyType address name')
      
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: upcomingPayments.length,
      data: upcomingPayments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming payments',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/summary
 */
exports.getPaymentSummary = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const payments = await Payment.find();
    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    payments.forEach((p) => {
      totalExpected += p.amount || 0;
      totalCollected += p.paidAmount || 0;
      totalOutstanding += p.remainingAmount || 0;

      if (p.status === 'Overdue' || (p.dueDate < todayStr && p.remainingAmount > 0)) {
        totalOverdue += p.remainingAmount || 0;
        overdueCount++;
      } else if (p.dueDate >= todayStr && p.remainingAmount > 0) {
        upcomingCount++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        overdueCount,
        upcomingCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = await Payment.findById(req.params.id)
      .populate('customerId')
      .populate({
        path: 'propertyId',
        select: 'propertyName propertyType address name landlordId agentId agentFee',
        populate: { path: 'landlordId', select: 'fullName name phone email logo' },
      })
      .populate({
        path: 'tenancyId',
        populate: [
          { path: 'landlordId', select: 'fullName name phone email logo' },
          { path: 'agentId', select: 'fullName name phone email' },
        ],
      })
      .populate('agentId', 'fullName name phone email')
      .populate('expenseId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment', error: error.message });
  }
};

/**
 * POST /api/payments/:id/pay
 */
exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid payment record ID' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const {
      amountPaid,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      agentId,
      agentFee,
      expenseAmount,
      expenseDescription,
      expenseCategory,
      expenseSupplier,
      expenseReceiptUrl,
      attachments,
    } = req.body;

    const payVal = Number(amountPaid);
    if (isNaN(payVal) || payVal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const tenancy = await Tenancy.findById(payment.tenancyId).populate('propertyId');
    const property = await Property.findById(payment.propertyId);

    const resolvedAgentId = agentId || tenancy?.agentId || property?.agentId || null;
    const landlordId = property?.landlordId || tenancy?.landlordId || null;

    const parsedAgentFee = Math.max(0, Number(agentFee) || 0);
    const parsedExpenseAmount = Math.max(0, Number(expenseAmount) || 0);
    const payDate = paymentDate || new Date().toISOString().split('T')[0];

    // 1. Credit Agent Fee into Agent's ledger if applicable
    if (resolvedAgentId && parsedAgentFee > 0) {
      payment.agentId = resolvedAgentId;
      payment.agentFee = parsedAgentFee;

      const bMonth = payment.billingMonth || (new Date().getMonth() + 1);
      const bYear = payment.billingYear || new Date().getFullYear();

      let agentPayment = await AgentPayment.findOne({
        tenancyId: payment.tenancyId,
        billingMonth: bMonth,
        billingYear: bYear,
      });

      if (!agentPayment) {
        const expectedFee = tenancy?.companyMonthlyAmount || property?.agentFee || parsedAgentFee;
        agentPayment = new AgentPayment({
          agentId: resolvedAgentId,
          tenancyId: payment.tenancyId,
          propertyId: payment.propertyId,
          tenantId: payment.customerId,
          billingMonth: bMonth,
          billingYear: bYear,
          expectedAmount: Math.max(expectedFee, parsedAgentFee),
          netAmount: Math.max(expectedFee, parsedAgentFee),
          dueDate: payment.dueDate || payDate,
          paidAmount: 0,
          remainingAmount: Math.max(expectedFee, parsedAgentFee),
          status: 'Pending',
          payments: [],
        });
      }

      agentPayment.agentId = resolvedAgentId;
      agentPayment.paidAmount = (agentPayment.paidAmount || 0) + parsedAgentFee;
      agentPayment.paidDate = payDate;
      agentPayment.paymentMethod = paymentMethod || 'Bank Transfer';
      agentPayment.payments.push({
        amount: parsedAgentFee,
        date: payDate,
        paymentMethod: paymentMethod || 'Bank Transfer',
        reference: reference ? `Deducted from rent (${reference})` : `Deducted from tenant rent #${payment._id}`,
        notes: `Auto-credited from tenant rent payment #${payment._id}`,
      });

      const netFee = agentPayment.netAmount || agentPayment.expectedAmount || parsedAgentFee;
      agentPayment.remainingAmount = Math.max(0, netFee - agentPayment.paidAmount);
      if (agentPayment.paidAmount >= netFee) {
        agentPayment.status = 'Paid';
      } else if (agentPayment.paidAmount > 0) {
        agentPayment.status = 'Partially Paid';
      }

      await agentPayment.save();

      try {
        await recalculateAgentPayment(agentPayment._id);
      } catch (rErr) {
        console.warn('[Recalculate Agent Payment Notice]', rErr.message);
      }
    } else if (resolvedAgentId) {
      payment.agentId = resolvedAgentId;
    }

    // 2. Create Property Expense record if expense deducted
    if (parsedExpenseAmount > 0) {
      const expenseFiles = [];
      if (expenseReceiptUrl && typeof expenseReceiptUrl === 'string') {
        expenseFiles.push(expenseReceiptUrl);
      }
      if (Array.isArray(attachments)) {
        attachments.forEach((att) => {
          if (att && typeof att === 'string' && !expenseFiles.includes(att)) {
            expenseFiles.push(att);
          }
        });
      }

      const newExpense = new Expense({
        propertyId: payment.propertyId,
        landlordId: landlordId,
        supplier: expenseSupplier || 'Property Maintenance',
        description: expenseDescription || `Expense deducted during rent collection #${payment._id}`,
        category: expenseCategory || 'Maintenance',
        amount: parsedExpenseAmount,
        date: payDate,
        paidAmount: parsedExpenseAmount,
        remainingAmount: 0,
        status: 'Paid',
        notes: `Deducted from tenant rent payment #${payment._id}`,
        attachments: expenseFiles,
      });

      await newExpense.save();
      payment.expenseId = newExpense._id;
      payment.expenseAmount = parsedExpenseAmount;
    }

    // 3. Compute net amount payable to Landlord
    payment.netLandlordAmount = Math.max(0, payVal - parsedAgentFee - parsedExpenseAmount);

    const newPaidAmount = (payment.paidAmount || 0) + payVal;
    const newRemaining = Math.max(0, payment.amount - newPaidAmount);
    const newStatus = calculatePaymentStatus(payment.amount, newPaidAmount, payment.dueDate);

    payment.paidAmount = newPaidAmount;
    payment.remainingAmount = newRemaining;
    payment.status = newStatus;
    if (payDate) payment.paidDate = payDate;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (reference) payment.reference = reference;
    if (notes) payment.notes = payment.notes ? `${payment.notes} | ${notes}` : notes;

    await payment.save();

    // Sync with corresponding Invoice
    await Invoice.updateOne(
      { paymentId: payment._id },
      {
        status: newStatus,
        paymentInfo: {
          paidAmount: newPaidAmount,
          paidDate: payDate,
          paymentMethod: paymentMethod || 'Cash',
          reference: reference || '',
        },
      }
    );

    const updatedPayment = await Payment.findById(payment._id)
      .populate('customerId')
      .populate({
        path: 'propertyId',
        select: 'propertyName propertyType address name landlordId agentId agentFee',
        populate: { path: 'landlordId', select: 'fullName name phone email logo' },
      })
      .populate({
        path: 'tenancyId',
        populate: [
          { path: 'landlordId', select: 'fullName name phone email logo' },
          { path: 'agentId', select: 'fullName name phone email' },
        ],
      })
      .populate('agentId', 'fullName name phone email')
      .populate('expenseId');

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message,
    });
  }
};

/**
 * PUT /api/payments/:id
 */
/**
 * PUT /api/payments/:id
 */
exports.updatePayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const {
      amount,
      paidAmount,
      dueDate,
      paidDate,
      paymentDate,
      paymentMethod,
      reference,
      referenceNo,
      notes,
      status,
    } = req.body;

    if (amount !== undefined) payment.amount = Math.max(0, Number(amount));
    if (paidAmount !== undefined) payment.paidAmount = Math.max(0, Number(paidAmount));
    if (dueDate) payment.dueDate = dueDate;

    const effectivePaidDate = paidDate !== undefined ? paidDate : paymentDate;
    if (effectivePaidDate !== undefined) payment.paidDate = effectivePaidDate;

    if (paymentMethod) payment.paymentMethod = paymentMethod;

    const effectiveRef = reference !== undefined ? reference : referenceNo;
    if (effectiveRef !== undefined) payment.reference = effectiveRef;

    if (notes !== undefined) payment.notes = notes;

    payment.remainingAmount = Math.max(0, payment.amount - (payment.paidAmount || 0));
    payment.status = status || calculatePaymentStatus(payment.amount, payment.paidAmount || 0, payment.dueDate);

    if (payment.paidAmount === 0 && !effectivePaidDate) {
      payment.paidDate = '';
    }

    await payment.save();

    // Sync with corresponding Invoice
    await Invoice.updateOne(
      { paymentId: payment._id },
      {
        status: payment.status,
        paymentInfo: {
          paidAmount: payment.paidAmount,
          paidDate: payment.paidDate || new Date().toISOString().split('T')[0],
          paymentMethod: payment.paymentMethod || 'Cash',
          reference: payment.reference || '',
        },
      }
    );

    const populatedPayment = await Payment.findById(payment._id)
      .populate('customerId', 'fullName phone email cnicOrId tenantName contactNumber name')
      .populate('propertyId', 'propertyName propertyType address name')
      .populate('tenancyId');

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: populatedPayment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment', error: error.message });
  }
};

/**
 * POST /api/payments/:id/reset
 * Rollback/undo an accidental or duplicate recorded payment back to unpaid
 */
exports.resetPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.paidAmount = 0;
    payment.paidDate = '';
    payment.remainingAmount = payment.amount;
    payment.status = calculatePaymentStatus(payment.amount, 0, payment.dueDate);
    payment.reference = '';
    if (payment.notes) {
      // Remove recorded receipt notes if appended with pipe
      payment.notes = payment.notes.replace(/\|\s*[^|]*$/, '').trim();
    }

    // Revert property expense if created by this payment
    if (payment.expenseId) {
      try {
        await Expense.findByIdAndDelete(payment.expenseId);
      } catch (expErr) {
        console.warn('[Reset Payment Expense Cleanup Notice]', expErr.message);
      }
      payment.expenseId = null;
      payment.expenseAmount = 0;
    }

    // Revert agent credit if recorded
    if (payment.agentId && (payment.agentFee || 0) > 0) {
      try {
        const agentPayment = await AgentPayment.findOne({
          tenancyId: payment.tenancyId,
          billingMonth: payment.billingMonth,
          billingYear: payment.billingYear,
        });
        if (agentPayment) {
          agentPayment.paidAmount = Math.max(0, (agentPayment.paidAmount || 0) - payment.agentFee);
          agentPayment.payments = (agentPayment.payments || []).filter(
            (p) => !p.notes?.includes(String(payment._id)) && !p.reference?.includes(String(payment._id))
          );
          const netFee = agentPayment.netAmount || agentPayment.expectedAmount || 0;
          agentPayment.remainingAmount = Math.max(0, netFee - agentPayment.paidAmount);
          if (agentPayment.paidAmount >= netFee && netFee > 0) {
            agentPayment.status = 'Paid';
          } else if (agentPayment.paidAmount > 0) {
            agentPayment.status = 'Partially Paid';
          } else {
            agentPayment.status = 'Pending';
          }
          await agentPayment.save();
          await recalculateAgentPayment(agentPayment._id);
        }
      } catch (agErr) {
        console.warn('[Reset Payment Agent Reversal Notice]', agErr.message);
      }
      payment.agentFee = 0;
    }
    payment.netLandlordAmount = 0;

    await payment.save();

    await Invoice.updateOne(
      { paymentId: payment._id },
      {
        status: payment.status,
        paymentInfo: {
          paidAmount: 0,
          paidDate: '',
          paymentMethod: 'Cash',
          reference: '',
        },
      }
    );

    const populatedPayment = await Payment.findById(payment._id)
      .populate('customerId', 'fullName phone email cnicOrId tenantName contactNumber name')
      .populate('propertyId', 'propertyName propertyType address name')
      .populate('tenancyId');

    res.status(200).json({
      success: true,
      message: 'Payment record successfully reset to unpaid status',
      data: populatedPayment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset payment', error: error.message });
  }
};

/**
 * DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // If query ?reset=true or resetOnly is passed, reset payment rather than permanently deleting
    if (req.query.reset === 'true' || req.body?.resetOnly) {
      payment.paidAmount = 0;
      payment.paidDate = '';
      payment.remainingAmount = payment.amount;
      payment.status = calculatePaymentStatus(payment.amount, 0, payment.dueDate);
      payment.reference = '';
      await payment.save();

      await Invoice.updateOne(
        { paymentId: payment._id },
        {
          status: payment.status,
          paymentInfo: { paidAmount: 0, paidDate: '', reference: '' },
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Payment reset to unpaid successfully',
        data: payment,
      });
    }

    await Payment.findByIdAndDelete(req.params.id);
    await Invoice.deleteMany({ paymentId: req.params.id });

    res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete payment', error: error.message });
  }
};
