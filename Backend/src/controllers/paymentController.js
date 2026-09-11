const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const { generateMonthlyPayments } = require('../services/paymentGeneratorService');

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

    const { property, unit, customer, tenancyId, status, date, month, year } = req.query;

    const filter = {};
    if (property && mongoose.Types.ObjectId.isValid(property)) filter.propertyId = property;
    
    if (customer && mongoose.Types.ObjectId.isValid(customer)) filter.customerId = customer;
    if (tenancyId && mongoose.Types.ObjectId.isValid(tenancyId)) filter.tenancyId = tenancyId;
    if (status) filter.status = status;
    if (date) filter.dueDate = date;
    if (month) filter.billingMonth = Number(month);
    if (year) filter.billingYear = Number(year);

    const payments = await Payment.find(filter)
      .populate('customerId', 'fullName phone email cnicOrId tenantName contactNumber name')
      .populate('propertyId', 'propertyName propertyType address name')
      
      .populate('tenancyId')
      .sort({ dueDate: -1, createdAt: -1 });

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
      .populate('propertyId', 'propertyName propertyType address name')
      
      .sort({ dueDate: 1 });

    const formattedData = overduePayments.map((p) => {
      const pObj = p.toObject();
      const dueMs = new Date(p.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
      return {
        ...pObj,
        daysOverdue: diffDays,
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
      .populate('propertyId')
      
      .populate('tenancyId');

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

    const { amountPaid, paymentDate, paymentMethod, reference, notes } = req.body;

    const payVal = Number(amountPaid);
    if (isNaN(payVal) || payVal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const newPaidAmount = (payment.paidAmount || 0) + payVal;
    const newRemaining = Math.max(0, payment.amount - newPaidAmount);
    const newStatus = calculatePaymentStatus(payment.amount, newPaidAmount, payment.dueDate);

    payment.paidAmount = newPaidAmount;
    payment.remainingAmount = newRemaining;
    payment.status = newStatus;
    if (paymentDate) payment.paidDate = paymentDate;
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
          paidDate: paymentDate || new Date().toISOString().split('T')[0],
          paymentMethod: paymentMethod || 'Cash',
          reference: reference || '',
        },
      }
    );

    const updatedPayment = await Payment.findById(payment._id)
      .populate('customerId')
      .populate('propertyId')
      

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
exports.updatePayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const { amount, paidAmount, dueDate, paymentMethod, reference, notes, status } = req.body;

    if (amount !== undefined) payment.amount = Number(amount);
    if (paidAmount !== undefined) payment.paidAmount = Number(paidAmount);
    if (dueDate) payment.dueDate = dueDate;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (reference) payment.reference = reference;
    if (notes) payment.notes = notes;

    payment.remainingAmount = Math.max(0, payment.amount - payment.paidAmount);
    payment.status = status || calculatePaymentStatus(payment.amount, payment.paidAmount, payment.dueDate);

    await payment.save();

    res.status(200).json({ success: true, message: 'Payment updated successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment', error: error.message });
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

    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    await Invoice.deleteMany({ paymentId: req.params.id });

    res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete payment', error: error.message });
  }
};
