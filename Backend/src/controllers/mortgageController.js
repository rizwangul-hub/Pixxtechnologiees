const Mortgage = require('../models/Mortgage');
const MortgagePayment = require('../models/MortgagePayment');
const Property = require('../models/Property');
const Landlord = require('../models/Landlord');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get all mortgages with search & filters
// @route   GET /api/mortgages
// @access  Private
const getMortgages = async (req, res) => {
  try {
    const { search, propertyId, landlordId, status } = req.query;

    let filter = {};

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      filter.propertyId = propertyId;
    }

    if (landlordId && mongoose.Types.ObjectId.isValid(landlordId)) {
      filter.landlordId = landlordId;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    let mortgages = await Mortgage.find(filter)
      .populate('propertyId', 'name address type city landlordId')
      .populate('landlordId', 'fullName email phone logo')
      .sort({ createdAt: -1 });

    // Client-side / regex search filtering across lenderName, reference, property name & landlord name
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      mortgages = mortgages.filter((m) => {
        const lender = (m.lenderName || '').toLowerCase();
        const ref = (m.mortgageAccountNumber || '').toLowerCase();
        const propName = (m.propertyId?.name || '').toLowerCase();
        const propAddress = (m.propertyId?.address || '').toLowerCase();
        const landlordName = (m.landlordId?.fullName || '').toLowerCase();

        return (
          lender.includes(q) ||
          ref.includes(q) ||
          propName.includes(q) ||
          propAddress.includes(q) ||
          landlordName.includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: mortgages.length,
      data: mortgages,
    });
  } catch (error) {
    console.error('[Get Mortgages Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get summary KPI metrics for mortgages
// @route   GET /api/mortgages/summary
// @access  Private
const getMortgageSummary = async (req, res) => {
  try {
    const mortgages = await Mortgage.find();

    const activeMortgages = mortgages.filter((m) => m.status === 'Active');
    const totalOutstanding = activeMortgages.reduce((sum, m) => sum + (m.currentOutstandingBalance || 0), 0);
    const totalOriginalLoans = activeMortgages.reduce((sum, m) => sum + (m.originalLoanAmount || 0), 0);
    const monthlyPaymentsTotal = activeMortgages.reduce((sum, m) => sum + (m.monthlyPayment || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const upcomingPayments = activeMortgages.filter((m) => {
      if (!m.nextPaymentDate) return false;
      const d = new Date(m.nextPaymentDate);
      return d >= today && d <= thirtyDaysFromNow;
    });

    res.status(200).json({
      success: true,
      data: {
        totalMortgages: mortgages.length,
        activeMortgagesCount: activeMortgages.length,
        totalOriginalLoans,
        totalOutstanding,
        monthlyPaymentsTotal,
        upcomingPaymentsCount: upcomingPayments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming mortgage payments (due in next 30 days)
// @route   GET /api/mortgages/upcoming
// @access  Private
const getUpcomingMortgagePayments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const mortgages = await Mortgage.find({
      status: 'Active',
      nextPaymentDate: { $gte: today, $lte: thirtyDaysFromNow },
    })
      .populate('propertyId', 'name address type city')
      .populate('landlordId', 'fullName email phone')
      .sort({ nextPaymentDate: 1 });

    res.status(200).json({
      success: true,
      count: mortgages.length,
      data: mortgages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single mortgage details by ID
// @route   GET /api/mortgages/:id
// @access  Private
const getMortgageById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const mortgage = await Mortgage.findById(id)
      .populate('propertyId', 'name address type city landlordId')
      .populate('landlordId', 'fullName email phone logo address');

    if (!mortgage) {
      return res.status(404).json({ success: false, message: 'Mortgage record not found' });
    }

    res.status(200).json({
      success: true,
      data: mortgage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new mortgage record
// @route   POST /api/mortgages
// @access  Private
const createMortgage = async (req, res) => {
  try {
    const {
      propertyId,
      lenderName,
      mortgageAccountNumber = '',
      originalLoanAmount,
      currentOutstandingBalance,
      interestRate = 0,
      monthlyPayment,
      paymentFrequency = 'Monthly',
      startDate,
      termMonths = 0,
      maturityDate = null,
      nextPaymentDate,
      status = 'Active',
      notes = '',
      documents = [],
    } = req.body;

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: 'Valid Property is required' });
    }

    if (!lenderName || !lenderName.trim()) {
      return res.status(400).json({ success: false, message: 'Lender / bank name is required' });
    }

    const origAmount = Number(originalLoanAmount);
    if (isNaN(origAmount) || origAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Original loan amount must be greater than 0' });
    }

    const currBalance = currentOutstandingBalance !== undefined ? Number(currentOutstandingBalance) : origAmount;
    if (isNaN(currBalance) || currBalance < 0) {
      return res.status(400).json({ success: false, message: 'Current outstanding balance cannot be negative' });
    }

    const mPayment = Number(monthlyPayment);
    if (isNaN(mPayment) || mPayment < 0) {
      return res.status(400).json({ success: false, message: 'Monthly payment cannot be negative' });
    }

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Mortgage start date is required' });
    }

    if (!nextPaymentDate) {
      return res.status(400).json({ success: false, message: 'Next payment due date is required' });
    }

    // Find property to auto-assign Landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Selected Property not found' });
    }

    if (!property.landlordId) {
      return res.status(400).json({
        success: false,
        message: 'The selected property does not have an assigned Landlord. Please assign a Landlord to the property first.',
      });
    }

    // Check if property already has an Active mortgage
    if (status === 'Active') {
      const existingActive = await Mortgage.findOne({ propertyId, status: 'Active' });
      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: `Property "${property.name}" already has an active mortgage with ${existingActive.lenderName}. Mark it as Paid Off or Closed before adding a new active mortgage.`,
        });
      }
    }

    const finalMaturityDate = maturityDate || req.body.endDate;

    const mortgage = await Mortgage.create({
      propertyId,
      landlordId: property.landlordId,
      lenderName: lenderName.trim(),
      mortgageAccountNumber: mortgageAccountNumber.trim(),
      originalLoanAmount: origAmount,
      currentOutstandingBalance: currBalance,
      interestRate: Number(interestRate) || 0,
      monthlyPayment: mPayment,
      paymentFrequency,
      startDate: new Date(startDate),
      termMonths: Number(termMonths) || 0,
      maturityDate: finalMaturityDate ? new Date(finalMaturityDate) : null,
      nextPaymentDate: new Date(nextPaymentDate),
      status,
      notes: notes.trim(),
      documents: Array.isArray(documents) ? documents : [],
      managerId: req.manager?._id || null,
    });

    const populated = await Mortgage.findById(mortgage._id)
      .populate('propertyId', 'name address type city')
      .populate('landlordId', 'fullName email phone');

    res.status(201).json({
      success: true,
      message: 'Mortgage record created successfully',
      data: populated,
    });
  } catch (error) {
    console.error('[Create Mortgage Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update mortgage details
// @route   PUT /api/mortgages/:id
// @access  Private
const updateMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const mortgage = await Mortgage.findById(id);
    if (!mortgage) {
      return res.status(404).json({ success: false, message: 'Mortgage record not found' });
    }

    const {
      lenderName,
      mortgageAccountNumber,
      originalLoanAmount,
      currentOutstandingBalance,
      interestRate,
      monthlyPayment,
      paymentFrequency,
      startDate,
      termMonths,
      maturityDate,
      endDate,
      nextPaymentDate,
      status,
      notes,
      documents,
    } = req.body;

    if (lenderName !== undefined) mortgage.lenderName = lenderName.trim();
    if (mortgageAccountNumber !== undefined) mortgage.mortgageAccountNumber = mortgageAccountNumber.trim();
    if (originalLoanAmount !== undefined) {
      const val = Number(originalLoanAmount);
      if (val <= 0) return res.status(400).json({ success: false, message: 'Original loan amount must be > 0' });
      mortgage.originalLoanAmount = val;
    }
    if (currentOutstandingBalance !== undefined) {
      const val = Number(currentOutstandingBalance);
      if (val < 0) return res.status(400).json({ success: false, message: 'Outstanding balance cannot be negative' });
      mortgage.currentOutstandingBalance = val;
      if (val === 0 && mortgage.status === 'Active') {
        mortgage.status = 'Paid Off';
      }
    }
    if (interestRate !== undefined) mortgage.interestRate = Math.max(0, Number(interestRate) || 0);
    if (monthlyPayment !== undefined) {
      const val = Number(monthlyPayment);
      if (val < 0) return res.status(400).json({ success: false, message: 'Monthly payment cannot be negative' });
      mortgage.monthlyPayment = val;
    }
    if (paymentFrequency !== undefined) mortgage.paymentFrequency = paymentFrequency;
    if (startDate) mortgage.startDate = new Date(startDate);
    if (termMonths !== undefined) mortgage.termMonths = Number(termMonths) || 0;
    
    const targetMaturity = maturityDate !== undefined ? maturityDate : endDate;
    if (targetMaturity !== undefined) mortgage.maturityDate = targetMaturity ? new Date(targetMaturity) : null;
    if (nextPaymentDate) mortgage.nextPaymentDate = new Date(nextPaymentDate);
    if (status !== undefined) mortgage.status = status;
    if (notes !== undefined) mortgage.notes = notes.trim();
    if (Array.isArray(documents)) mortgage.documents = documents;

    await mortgage.save();

    const updated = await Mortgage.findById(id)
      .populate('propertyId', 'name address type city')
      .populate('landlordId', 'fullName email phone');

    res.status(200).json({
      success: true,
      message: 'Mortgage updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete mortgage record & payment history
// @route   DELETE /api/mortgages/:id
// @access  Private
const deleteMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const mortgage = await Mortgage.findById(id);
    if (!mortgage) {
      return res.status(404).json({ success: false, message: 'Mortgage record not found' });
    }

    await Mortgage.findByIdAndDelete(id);
    await MortgagePayment.deleteMany({ mortgageId: id });
    await Notification.deleteMany({ mortgageId: id });

    res.status(200).json({
      success: true,
      message: 'Mortgage record and history deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history for a mortgage
// @route   GET /api/mortgages/:id/payments
// @access  Private
const getMortgagePayments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const payments = await MortgagePayment.find({ mortgageId: id })
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a mortgage payment & update outstanding balance
// @route   POST /api/mortgages/:id/payments
// @access  Private
const recordMortgagePayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const mortgage = await Mortgage.findById(id).populate('propertyId', 'name').populate('landlordId', 'fullName');
    if (!mortgage) {
      return res.status(404).json({ success: false, message: 'Mortgage record not found' });
    }

    const {
      paymentDate = new Date(),
      totalPayment,
      principalAmount = 0,
      interestAmount = 0,
      paymentMethod = 'Bank Transfer',
      reference = '',
      notes = '',
      nextPaymentDate,
    } = req.body;

    const totPay = Number(totalPayment);
    if (isNaN(totPay) || totPay <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const prinAmt = Number(principalAmount) || 0;
    const intAmt = Number(interestAmount) || 0;

    if (prinAmt < 0 || intAmt < 0) {
      return res.status(400).json({ success: false, message: 'Principal and Interest amounts cannot be negative' });
    }

    // Deduction logic: Use principal if provided, otherwise use total payment
    const balanceDeduction = prinAmt > 0 ? prinAmt : totPay;

    if (balanceDeduction > mortgage.currentOutstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment deduction (£${balanceDeduction.toLocaleString()}) exceeds current outstanding balance (£${mortgage.currentOutstandingBalance.toLocaleString()}). Balance cannot become negative.`,
      });
    }

    const newOutstandingBalance = Math.max(0, mortgage.currentOutstandingBalance - balanceDeduction);

    // Save Payment Log
    const paymentRecord = await MortgagePayment.create({
      mortgageId: mortgage._id,
      propertyId: mortgage.propertyId._id || mortgage.propertyId,
      landlordId: mortgage.landlordId._id || mortgage.landlordId,
      paymentDate: new Date(paymentDate),
      totalPayment: totPay,
      principalAmount: prinAmt,
      interestAmount: intAmt,
      remainingBalance: newOutstandingBalance,
      paymentMethod: paymentMethod.trim(),
      reference: reference.trim(),
      notes: notes.trim(),
      managerId: req.manager?._id || null,
    });

    // Update Mortgage Record
    mortgage.currentOutstandingBalance = newOutstandingBalance;

    if (newOutstandingBalance === 0) {
      mortgage.status = 'Paid Off';
    }

    // Auto-advance next payment date by 1 month if nextPaymentDate is provided or default
    if (nextPaymentDate) {
      mortgage.nextPaymentDate = new Date(nextPaymentDate);
    } else if (mortgage.nextPaymentDate) {
      const currentNext = new Date(mortgage.nextPaymentDate);
      currentNext.setMonth(currentNext.getMonth() + 1);
      mortgage.nextPaymentDate = currentNext;
    }

    await mortgage.save();

    res.status(201).json({
      success: true,
      message: 'Mortgage payment recorded successfully',
      payment: paymentRecord,
      updatedBalance: newOutstandingBalance,
      mortgageStatus: mortgage.status,
    });
  } catch (error) {
    console.error('[Record Mortgage Payment Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMortgages,
  getMortgageSummary,
  getUpcomingMortgagePayments,
  getMortgageById,
  createMortgage,
  updateMortgage,
  deleteMortgage,
  getMortgagePayments,
  recordMortgagePayment,
};
