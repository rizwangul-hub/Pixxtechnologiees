const Agreement = require('../models/Agreement');
const Unit = require('../models/Unit');
const PaymentSchedule = require('../models/PaymentSchedule');

// @desc    Get all agreements
// @route   GET /api/agreements
// @access  Private
const getAgreements = async (req, res) => {
  try {
    const { customerId, unitId, status } = req.query;
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (unitId) filter.unitId = unitId;
    if (status) filter.status = status;

    const agreements = await Agreement.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: agreements.length, data: agreements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create agreement, update unit to Occupied, and generate payment schedules
// @route   POST /api/agreements
// @access  Private
const createAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.create(req.body);

    // Update Unit status to Occupied
    if (agreement.unitId) {
      await Unit.findByIdAndUpdate(agreement.unitId, {
        status: 'Occupied',
        customerName: agreement.customerName,
      });
    }

    // Generate automated PaymentSchedules
    const schedulesToInsert = [];
    const {
      _id: agreementId,
      customerId,
      customerName,
      propertyId,
      propertyName,
      unitId,
      unitName,
      agreementType,
      startDate,
      endDate,
      monthlyOrSalePrice,
      securityDeposit,
      dueDayOfMonth = 1,
    } = agreement;

    const price = Number(monthlyOrSalePrice) || 0;

    // Security Deposit Schedule item
    if (Number(securityDeposit) > 0) {
      schedulesToInsert.push({
        agreementId,
        customerId,
        customerName,
        propertyId,
        propertyName,
        unitId,
        unitName,
        periodName: 'Security Deposit',
        dueDate: startDate,
        expectedAmount: Number(securityDeposit),
        paidAmount: 0,
        remainingAmount: Number(securityDeposit),
        type: 'Security Deposit',
        status: 'Pending',
        notes: 'Initial refundable security deposit',
      });
    }

    if (agreementType === 'Rent') {
      const start = new Date(startDate || new Date());
      const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

      let current = new Date(start);
      let monthCount = 0;

      while (current <= end && monthCount < 60) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dueDay = Math.min(Number(dueDayOfMonth) || 1, 28);
        const dueDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

        schedulesToInsert.push({
          agreementId,
          customerId,
          customerName,
          propertyId,
          propertyName,
          unitId,
          unitName,
          periodName: `${monthLabel} Rent`,
          dueDate: dueDateStr,
          expectedAmount: price,
          paidAmount: 0,
          remainingAmount: price,
          type: 'Rent',
          status: 'Pending',
          notes: `Monthly rent obligation for ${monthLabel}`,
        });

        current.setMonth(current.getMonth() + 1);
        monthCount++;
      }
    } else if (agreementType === 'Sale') {
      schedulesToInsert.push({
        agreementId,
        customerId,
        customerName,
        propertyId,
        propertyName,
        unitId,
        unitName,
        periodName: 'Property Sale Price',
        dueDate: startDate,
        expectedAmount: price,
        paidAmount: 0,
        remainingAmount: price,
        type: 'Sale',
        status: 'Pending',
        notes: 'Total agreed sale price payment obligation',
      });
    }

    if (schedulesToInsert.length > 0) {
      await PaymentSchedule.insertMany(schedulesToInsert);
    }

    res.status(201).json({ success: true, data: agreement, generatedSchedulesCount: schedulesToInsert.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Terminate agreement and revert unit status to Available
// @route   POST /api/agreements/:id/terminate
// @access  Private
const terminateAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Agreement not found' });
    }

    agreement.status = 'Terminated';
    await agreement.save();

    // Revert Unit status to Available
    if (agreement.unitId) {
      await Unit.findByIdAndUpdate(agreement.unitId, {
        status: 'Available',
        customerName: null,
      });
    }

    res.status(200).json({ success: true, message: 'Agreement terminated successfully', data: agreement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAgreements,
  createAgreement,
  terminateAgreement,
};
