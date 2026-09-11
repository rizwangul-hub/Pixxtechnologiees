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
    const { search, propertyId, landlordId, status, mortgageType } = req.query;

    let filter = {};

    // Filter by Property: checks both legacy propertyId AND properties.propertyId
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      const pObjId = new mongoose.Types.ObjectId(propertyId);
      filter.$or = [
        { propertyId: pObjId },
        { 'properties.propertyId': pObjId },
      ];
    }

    if (landlordId && mongoose.Types.ObjectId.isValid(landlordId)) {
      filter.landlordId = landlordId;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (mortgageType && mortgageType !== 'All') {
      filter.mortgageType = mortgageType;
    }

    let mortgages = await Mortgage.find(filter)
      .populate('propertyId', 'name address type city landlordId')
      .populate('properties.propertyId', 'name address type city landlordId isArchived')
      .populate('landlordId', 'fullName email phone logo')
      .sort({ createdAt: -1 });

    // Client-side / regex search filtering across lenderName, reference, property names & landlord name
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      mortgages = mortgages.filter((m) => {
        const lender = (m.lenderName || '').toLowerCase();
        const ref = (m.mortgageAccountNumber || '').toLowerCase();
        const facilityRef = (m.mortgageReference || '').toLowerCase();
        const primaryPropName = (m.propertyId?.name || '').toLowerCase();
        const primaryPropAddress = (m.propertyId?.address || '').toLowerCase();
        const landlordName = (m.landlordId?.fullName || '').toLowerCase();

        const securedPropNames = (m.properties || [])
          .map((p) => (p.propertyId?.name || '').toLowerCase())
          .join(' ');
        const securedPropAddresses = (m.properties || [])
          .map((p) => (p.propertyId?.address || '').toLowerCase())
          .join(' ');

        return (
          lender.includes(q) ||
          ref.includes(q) ||
          facilityRef.includes(q) ||
          primaryPropName.includes(q) ||
          primaryPropAddress.includes(q) ||
          securedPropNames.includes(q) ||
          securedPropAddresses.includes(q) ||
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
    const { landlordId } = req.query;
    const filter = {};
    if (landlordId && mongoose.Types.ObjectId.isValid(landlordId)) {
      filter.landlordId = landlordId;
    }

    const mortgages = await Mortgage.find(filter);

    const activeMortgages = mortgages.filter((m) => m.status === 'Active');
    const individualCount = activeMortgages.filter((m) => (m.mortgageType || 'Individual Property') === 'Individual Property').length;
    const collectiveCount = activeMortgages.filter((m) => m.mortgageType === 'Collective / Group').length;

    // ONE source of truth: each mortgage facility counted exactly once
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
        individualCount,
        collectiveCount,
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
      .populate('properties.propertyId', 'name address type city')
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
      .populate('properties.propertyId', 'name address type city landlordId isArchived')
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

// Helper to normalize and validate properties array
async function validateAndNormalizeProperties(landlordId, mortgageType, propertyIdInput, propertiesInput, originalLoanAmount) {
  let normalizedProps = [];

  if (mortgageType === 'Individual Property') {
    const targetPropId = propertyIdInput || (Array.isArray(propertiesInput) && propertiesInput[0]?.propertyId) || propertiesInput;
    if (!targetPropId || !mongoose.Types.ObjectId.isValid(targetPropId)) {
      throw new Error('A valid property is required for an Individual Property Mortgage');
    }

    const prop = await Property.findById(targetPropId);
    if (!prop) throw new Error('Selected property not found');
    if (prop.landlordId.toString() !== landlordId.toString()) {
      throw new Error(`Property "${prop.name}" does not belong to the selected landlord`);
    }

    normalizedProps = [
      {
        propertyId: prop._id,
        allocatedAmount: Number(originalLoanAmount) || 0,
        notes: 'Primary secured property',
        securedAt: new Date(),
        status: 'Active',
      },
    ];
  } else {
    // Collective / Group Mortgage
    let propList = [];
    if (Array.isArray(propertiesInput)) {
      propList = propertiesInput;
    } else if (propertyIdInput) {
      propList = [propertyIdInput];
    }

    if (propList.length === 0) {
      throw new Error('At least one property must be selected for a Collective Mortgage facility');
    }

    const seenIds = new Set();
    let totalAllocated = 0;

    for (const item of propList) {
      const pid = item.propertyId || item._id || item.id || item;
      if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
        throw new Error('Invalid property ID in secured properties list');
      }

      const strId = pid.toString();
      if (seenIds.has(strId)) {
        throw new Error('Duplicate properties cannot be added to the same mortgage facility');
      }
      seenIds.add(strId);

      const prop = await Property.findById(pid);
      if (!prop) {
        throw new Error(`Property with ID ${pid} not found`);
      }
      if (prop.landlordId.toString() !== landlordId.toString()) {
        throw new Error(`Property "${prop.name}" does not belong to the selected landlord`);
      }

      const alloc = Number(item.allocatedAmount) || 0;
      if (alloc < 0) {
        throw new Error(`Allocation for property "${prop.name}" cannot be negative`);
      }
      totalAllocated += alloc;

      normalizedProps.push({
        propertyId: prop._id,
        allocatedAmount: alloc,
        notes: typeof item.notes === 'string' ? item.notes.trim() : '',
        securedAt: item.securedAt ? new Date(item.securedAt) : new Date(),
        status: item.status || 'Active',
      });
    }

    // Validate allocation sum if any allocation was provided
    if (totalAllocated > 0 && totalAllocated > Number(originalLoanAmount)) {
      throw new Error(
        `Total property allocations (£${totalAllocated.toLocaleString()}) cannot exceed the mortgage facility amount (£${Number(originalLoanAmount).toLocaleString()}).`
      );
    }
  }

  return normalizedProps;
}

// @desc    Create a new mortgage facility record
// @route   POST /api/mortgages
// @access  Private
const createMortgage = async (req, res) => {
  try {
    const {
      landlordId: landlordIdInput,
      propertyId,
      properties: propertiesInput,
      mortgageType = 'Individual Property',
      mortgageReference = '',
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

    if (!lenderName || !lenderName.trim()) {
      return res.status(400).json({ success: false, message: 'Lender or bank name is required' });
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

    // Determine Landlord: from body, or infer from selected property
    let effectiveLandlordId = landlordIdInput;
    if (!effectiveLandlordId) {
      const samplePropId = propertyId || (Array.isArray(propertiesInput) && propertiesInput[0]?.propertyId) || propertiesInput;
      if (samplePropId && mongoose.Types.ObjectId.isValid(samplePropId)) {
        const p = await Property.findById(samplePropId);
        if (p) effectiveLandlordId = p.landlordId;
      }
    }

    if (!effectiveLandlordId || !mongoose.Types.ObjectId.isValid(effectiveLandlordId)) {
      return res.status(400).json({ success: false, message: 'Valid Landlord is required for a mortgage facility' });
    }

    const landlord = await Landlord.findById(effectiveLandlordId);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Selected Landlord not found' });
    }

    // Validate and normalize secured properties
    let normalizedProperties = [];
    try {
      normalizedProperties = await validateAndNormalizeProperties(
        effectiveLandlordId,
        mortgageType,
        propertyId,
        propertiesInput,
        origAmount
      );
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Check for duplicate active individual mortgage on the same property
    if (status === 'Active' && mortgageType === 'Individual Property') {
      const targetPropId = normalizedProperties[0].propertyId;
      const existingActive = await Mortgage.findOne({
        propertyId: targetPropId,
        mortgageType: 'Individual Property',
        status: 'Active',
      });
      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: `This property already has an active individual mortgage with ${existingActive.lenderName}. Mark it as Paid Off or Closed before adding a new active mortgage.`,
        });
      }
    }

    const finalMaturityDate = maturityDate || req.body.endDate;
    const finalRef = (mortgageReference || mortgageAccountNumber || '').trim();

    const mortgage = await Mortgage.create({
      propertyId: normalizedProperties[0]?.propertyId || null,
      landlordId: effectiveLandlordId,
      mortgageType,
      mortgageReference: finalRef,
      lenderName: lenderName.trim(),
      mortgageAccountNumber: (mortgageAccountNumber || finalRef).trim(),
      properties: normalizedProperties,
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
      .populate('properties.propertyId', 'name address type city isArchived')
      .populate('landlordId', 'fullName email phone');

    res.status(201).json({
      success: true,
      message: 'Mortgage facility created successfully',
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
      mortgageType,
      mortgageReference,
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
      properties: propertiesInput,
      propertyId,
    } = req.body;

    if (mortgageType !== undefined) {
      mortgage.mortgageType = mortgageType;
    }

    if (mortgageReference !== undefined) mortgage.mortgageReference = mortgageReference.trim();
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

    // If updating properties array, validate and preserve historical records
    if (propertiesInput !== undefined || propertyId !== undefined) {
      const effectiveType = mortgageType || mortgage.mortgageType;
      const normalizedProps = await validateAndNormalizeProperties(
        mortgage.landlordId,
        effectiveType,
        propertyId,
        propertiesInput,
        mortgage.originalLoanAmount
      );

      // Preserve previously secured properties marked as Released rather than deleting historical relationships
      const existingProps = mortgage.properties || [];
      const newPropIds = new Set(normalizedProps.map((p) => p.propertyId.toString()));

      const finalProps = [...normalizedProps];

      for (const oldP of existingProps) {
        const oldStrId = (oldP.propertyId?._id || oldP.propertyId).toString();
        if (!newPropIds.has(oldStrId)) {
          // Keep as historical released property
          finalProps.push({
            propertyId: oldP.propertyId,
            allocatedAmount: oldP.allocatedAmount || 0,
            notes: oldP.notes || 'Released from mortgage facility',
            securedAt: oldP.securedAt || mortgage.createdAt,
            releasedAt: oldP.releasedAt || new Date(),
            status: 'Released',
          });
        }
      }

      mortgage.properties = finalProps;
      if (finalProps[0]?.propertyId) {
        mortgage.propertyId = finalProps[0].propertyId;
      }
    }

    await mortgage.save();

    const updated = await Mortgage.findById(id)
      .populate('propertyId', 'name address type city')
      .populate('properties.propertyId', 'name address type city isArchived')
      .populate('landlordId', 'fullName email phone');

    res.status(200).json({
      success: true,
      message: 'Mortgage updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('[Update Mortgage Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a property to an existing collective mortgage facility
// @route   POST /api/mortgages/:id/properties
// @access  Private
const addPropertyToMortgage = async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyId, allocatedAmount = 0, notes = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: 'Valid Mortgage ID and Property ID are required' });
    }

    const mortgage = await Mortgage.findById(id);
    if (!mortgage) return res.status(404).json({ success: false, message: 'Mortgage facility not found' });

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    if (property.landlordId.toString() !== mortgage.landlordId.toString()) {
      return res.status(400).json({ success: false, message: 'Property does not belong to the facility landlord' });
    }

    // Check if property is already active in this facility
    const existingIndex = mortgage.properties.findIndex(
      (p) => (p.propertyId?._id || p.propertyId).toString() === propertyId && p.status === 'Active'
    );

    if (existingIndex >= 0) {
      return res.status(400).json({ success: false, message: 'Property is already actively secured under this facility' });
    }

    const alloc = Math.max(0, Number(allocatedAmount) || 0);

    mortgage.properties.push({
      propertyId,
      allocatedAmount: alloc,
      notes: notes.trim(),
      securedAt: new Date(),
      status: 'Active',
    });

    if (mortgage.properties.length > 1) {
      mortgage.mortgageType = 'Collective / Group';
    }

    await mortgage.save();

    const populated = await Mortgage.findById(id)
      .populate('propertyId', 'name address type city')
      .populate('properties.propertyId', 'name address type city')
      .populate('landlordId', 'fullName email phone');

    res.status(200).json({
      success: true,
      message: `Property "${property.name}" secured under mortgage facility`,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Release / Remove property from mortgage facility (Historical preservation)
// @route   DELETE /api/mortgages/:id/properties/:propertyId
// @access  Private
const removePropertyFromMortgage = async (req, res) => {
  try {
    const { id, propertyId } = req.params;

    const mortgage = await Mortgage.findById(id);
    if (!mortgage) return res.status(404).json({ success: false, message: 'Mortgage facility not found' });

    const item = mortgage.properties.find(
      (p) => (p.propertyId?._id || p.propertyId).toString() === propertyId && p.status === 'Active'
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Active secured relationship not found for this property' });
    }

    // Mark as Released to preserve historical data
    item.status = 'Released';
    item.releasedAt = new Date();
    item.notes = (item.notes ? item.notes + ' | ' : '') + `Released on ${new Date().toISOString().split('T')[0]}`;

    await mortgage.save();

    res.status(200).json({
      success: true,
      message: 'Property released from mortgage facility (history preserved)',
      data: mortgage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all mortgages securing a specific property
// @route   GET /api/mortgages/property/:propertyId
// @access  Private
const getPropertyMortgages = async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID' });
    }

    const pObjId = new mongoose.Types.ObjectId(propertyId);
    const mortgages = await Mortgage.find({
      $or: [
        { propertyId: pObjId },
        { 'properties.propertyId': pObjId },
      ],
    })
      .populate('landlordId', 'fullName email phone')
      .populate('properties.propertyId', 'name address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: mortgages.length,
      data: mortgages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history for a mortgage facility
// @route   GET /api/mortgages/:id/payments
// @access  Private
const getMortgagePayments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mortgage ID' });
    }

    const payments = await MortgagePayment.find({ mortgageId: id })
      .populate('propertyId', 'name address')
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

    const mortgage = await Mortgage.findById(id)
      .populate('propertyId', 'name')
      .populate('properties.propertyId', 'name')
      .populate('landlordId', 'fullName');

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
      propertyId,
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

    // Deduction logic: Only principal portion reduces outstanding balance if specified
    const balanceDeduction = prinAmt > 0 ? prinAmt : totPay;

    if (balanceDeduction > mortgage.currentOutstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment deduction (£${balanceDeduction.toLocaleString()}) exceeds current outstanding balance (£${mortgage.currentOutstandingBalance.toLocaleString()}). Balance cannot become negative.`,
      });
    }

    const newOutstandingBalance = Math.max(0, mortgage.currentOutstandingBalance - balanceDeduction);

    // Save ONE Payment Record against the Mortgage Facility
    const effectivePropId = propertyId || mortgage.propertyId?._id || mortgage.properties?.[0]?.propertyId?._id || null;

    const paymentRecord = await MortgagePayment.create({
      mortgageId: mortgage._id,
      propertyId: effectivePropId,
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

    // Update Mortgage Record Balance
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
      message: 'Mortgage payment recorded successfully against facility',
      payment: paymentRecord,
      updatedBalance: newOutstandingBalance,
      mortgageStatus: mortgage.status,
    });
  } catch (error) {
    console.error('[Record Mortgage Payment Error]', error.message);
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

module.exports = {
  getMortgages,
  getMortgageSummary,
  getUpcomingMortgagePayments,
  getMortgageById,
  createMortgage,
  updateMortgage,
  deleteMortgage,
  addPropertyToMortgage,
  removePropertyFromMortgage,
  getPropertyMortgages,
  getMortgagePayments,
  recordMortgagePayment,
};
