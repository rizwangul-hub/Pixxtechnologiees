const Tenancy = require('../models/Tenancy');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const PaymentSchedule = require('../models/PaymentSchedule');
const { generateMonthlyPayments } = require('../services/paymentGeneratorService');
const { generateMonthlyAgentSettlements } = require('../services/agentSettlementService');

// @desc    Assign unit to customer / Create active tenancy
// @route   POST /api/tenancies
// @access  Private
const assignTenancy = async (req, res) => {
  try {
    const {
      customerId,
      propertyId,
      unitId,
      agentId,
      companyMonthlyAmount,
      agentPaymentDueDay,
      startDate,
      endDate,
      monthlyRent,
      paymentDueDay,
      securityDeposit,
      notes,
    } = req.body;

    // 1. Verify required fields
    if (!customerId || !propertyId || !unitId || !startDate || monthlyRent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customerId, propertyId, unitId, startDate, and monthlyRent',
      });
    }

    // 2. Verify Property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    if (property.isArchived) {
      return res.status(400).json({ success: false, message: 'Selected property is archived and cannot receive new tenancies.' });
    }

    // 3. Verify Unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    if (unit.isArchived) {
      return res.status(400).json({ success: false, message: 'Selected unit is archived and cannot receive new tenancies.' });
    }

    // 4. Verify Customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (customer.isArchived) {
      return res.status(400).json({ success: false, message: 'Selected tenant is archived. Please restore the tenant before creating a new tenancy.' });
    }

    // 4b. Verify Agent exists if provided
    if (agentId) {
      const AgentModel = require('../models/Agent');
      const agent = await AgentModel.findById(agentId);
      if (agent && agent.isArchived) {
        return res.status(400).json({ success: false, message: 'Selected agent is archived. Please select an active agent.' });
      }
    }

    // 5. Verify Unit belongs to selected Property
    if (unit.propertyId.toString() !== propertyId.toString()) {
      return res.status(400).json({
        success: false,
        message: `Unit "${unit.name || unit.unitName}" does not belong to Property "${property.name || property.propertyName}"`,
      });
    }

    // 6. Business Rule: Check if Unit is already Occupied
    if (unit.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Unit "${unit.name || unit.unitName}" is currently Occupied. Cannot assign two active tenancies to the same unit.`,
      });
    }

    // 7. Business Rule: Check if an Active Tenancy already exists for this Unit
    const existingActiveTenancy = await Tenancy.findOne({ unitId, status: 'Active' });
    if (existingActiveTenancy) {
      return res.status(400).json({
        success: false,
        message: `An active tenancy already exists for unit "${unit.name || unit.unitName}".`,
      });
    }

    // 8. Create Tenancy
    const tenancy = await Tenancy.create({
      customerId,
      propertyId,
      unitId,
      agentId: agentId || null,
      companyMonthlyAmount: Number(companyMonthlyAmount) || 0,
      agentPaymentDueDay: Number(agentPaymentDueDay) || 1,
      startDate,
      endDate: endDate || '',
      monthlyRent: Number(monthlyRent) || 0,
      paymentDueDay: Number(paymentDueDay) || 1,
      securityDeposit: Number(securityDeposit) || 0,
      status: 'Active',
      notes: notes || '',
    });

    // 9. Update Unit status to Occupied
    unit.status = 'Occupied';
    unit.customerName = customer.fullName || customer.name;
    await unit.save();

    // 10. Trigger automated monthly rent payment generator and agent settlement generator
    await generateMonthlyPayments();
    if (agentId) {
      await generateMonthlyAgentSettlements();
    }

    res.status(201).json({
      success: true,
      message: 'Tenancy created successfully. Unit marked as Occupied.',
      data: tenancy,
      unitStatus: unit.status,
    });
  } catch (error) {
    console.error('[Assign Tenancy Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const mongoose = require('mongoose');

// @desc    Get all tenancies
// @route   GET /api/tenancies
// @access  Private
const getTenancies = async (req, res) => {
  try {
    const { customerId, propertyId, unitId, agentId, status, archived, includeArchived } = req.query;
    const filter = {};
    if (customerId && customerId !== 'All' && customerId !== 'all' && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
    if (propertyId && propertyId !== 'All' && propertyId !== 'all' && mongoose.Types.ObjectId.isValid(propertyId)) filter.propertyId = propertyId;
    if (unitId && unitId !== 'All' && unitId !== 'all' && mongoose.Types.ObjectId.isValid(unitId)) filter.unitId = unitId;
    if (agentId && agentId !== 'All' && agentId !== 'all' && mongoose.Types.ObjectId.isValid(agentId)) filter.agentId = agentId;

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    const tenancies = await Tenancy.find(filter)
      .populate('customerId', 'fullName name phone email')
      .populate('propertyId', 'propertyName name type address')
      .populate('unitId', 'unitName name type floor price status')
      .populate('agentId', 'fullName phone email region profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tenancies.length, data: tenancies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End tenancy and revert unit to Available
// @route   POST /api/tenancies/:id/end or PUT /api/tenancies/:id/end
// @access  Private
const endTenancy = async (req, res) => {
  try {
    const tenancy = await Tenancy.findById(req.params.id);
    if (!tenancy) {
      return res.status(404).json({ success: false, message: 'Tenancy not found' });
    }

    tenancy.status = 'Ended';
    await tenancy.save();

    // Revert Unit status to Available unless another active tenancy exists
    if (tenancy.unitId) {
      const otherActiveTenancy = await Tenancy.findOne({
        unitId: tenancy.unitId,
        status: 'Active',
        _id: { $ne: tenancy._id },
      });

      if (!otherActiveTenancy) {
        await Unit.findByIdAndUpdate(tenancy.unitId, {
          status: 'Available',
          customerName: null,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tenancy ended. Unit status set to Available.',
      data: tenancy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  assignTenancy,
  getTenancies,
  endTenancy,
};
