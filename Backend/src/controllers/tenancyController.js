const mongoose = require('mongoose');
const Tenancy = require('../models/Tenancy');
const Property = require('../models/Property');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const PaymentSchedule = require('../models/PaymentSchedule');
const { generateMonthlyPayments } = require('../services/paymentGeneratorService');
const { generateMonthlyAgentSettlements } = require('../services/agentSettlementService');

// @desc    Assign property to customer / Create active tenancy
// @route   POST /api/tenancies
// @access  Private
const assignTenancy = async (req, res) => {
  try {
    const {
      customerId,
      propertyId,
      unitId, // backward compatibility
      agentId,
      companyMonthlyAmount,
      agentPaymentDueDay,
      startDate,
      endDate,
      monthlyRent,
      paymentDueDay,
      securityDeposit,
      openingBalance,
      billingStartDate,
      notes,
    } = req.body;

    const targetPropertyId = propertyId || unitId;

    // 1. Verify required fields
    if (!customerId || !targetPropertyId || !startDate || monthlyRent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customerId, propertyId, startDate, and monthlyRent',
      });
    }

    // 2. Verify Property exists
    const property = await Property.findById(targetPropertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    if (property.isArchived) {
      return res.status(400).json({ success: false, message: 'Selected property is archived and cannot receive new tenancies.' });
    }

    // 3. Verify Customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (customer.isArchived) {
      return res.status(400).json({ success: false, message: 'Selected tenant is archived. Please restore the tenant before creating a new tenancy.' });
    }

    // 4. Verify Agent exists if provided
    if (agentId) {
      const agent = await Agent.findById(agentId);
      if (agent && agent.isArchived) {
        return res.status(400).json({ success: false, message: 'Selected agent is archived. Please select an active agent.' });
      }
    }

    // 5. Business Rule: Check if Property is already Occupied or has Active Tenancy
    const existingActiveTenancy = await Tenancy.findOne({ propertyId: targetPropertyId, status: 'Active', isArchived: { $ne: true } });
    if (existingActiveTenancy || property.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Property "${property.name || property.propertyName}" is currently occupied. Cannot assign two active tenancies to the same property.`,
      });
    }

    const openingBalanceAmount = Number(openingBalance) || 0;

    // 6. Create Tenancy
    const tenancy = await Tenancy.create({
      customerId,
      propertyId: targetPropertyId,
      landlordId: property.landlordId || null,
      agentId: agentId || null,
      companyMonthlyAmount: Number(companyMonthlyAmount) || 0,
      agentPaymentDueDay: Number(agentPaymentDueDay) || 1,
      startDate,
      endDate: endDate || '',
      monthlyRent: Number(monthlyRent) || 0,
      paymentDueDay: Number(paymentDueDay) || 1,
      securityDeposit: Number(securityDeposit) || 0,
      openingBalance: openingBalanceAmount,
      billingStartDate: billingStartDate || '',
      status: 'Active',
      notes: notes || '',
    });

    // 6a. If openingBalance > 0, create an Opening Balance payment record
    if (openingBalanceAmount > 0) {
      const Payment = require('../models/Payment');
      const todayStr = new Date().toISOString().split('T')[0];
      try {
        await Payment.create({
          customerId,
          propertyId: targetPropertyId,
          tenancyId: tenancy._id,
          amount: openingBalanceAmount,
          paidAmount: 0,
          remainingAmount: openingBalanceAmount,
          dueDate: todayStr,
          billingMonth: 0,   // 0 = special Opening Balance marker (not a real month)
          billingYear: 0,    // 0 = special Opening Balance marker
          status: 'Overdue', // Opening balances are always overdue (prior period)
          paymentType: 'Opening Balance',
          paymentMethod: 'Cash',
          notes: `Opening balance brought forward – prior unpaid rent before ${billingStartDate || startDate}`,
        });
      } catch (obErr) {
        console.warn('[Opening Balance Warning] Could not create opening balance payment:', obErr.message);
      }
    }

    // 7. Update Property status to Occupied
    property.status = 'Occupied';
    property.assetStatus = 'Occupied';
    property.customerName = customer.fullName || customer.name;
    await property.save();

    // 8. Trigger automated monthly rent payment generator and agent settlement generator
    try {
      await generateMonthlyPayments();
      if (agentId) {
        await generateMonthlyAgentSettlements();
      }
    } catch (svcErr) {
      console.warn('[Generator Warning]', svcErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Tenancy created successfully. Property marked as Occupied.',
      data: tenancy,
      propertyStatus: property.status,
    });
  } catch (error) {
    console.error('[Assign Tenancy Error]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tenancies
// @route   GET /api/tenancies
// @access  Private
const getTenancies = async (req, res) => {
  try {
    const { customerId, propertyId, unitId, agentId, status, archived, includeArchived } = req.query;
    const filter = {};
    if (customerId && customerId !== 'All' && customerId !== 'all' && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
    
    const targetPropId = propertyId || unitId;
    if (targetPropId && targetPropId !== 'All' && targetPropId !== 'all' && mongoose.Types.ObjectId.isValid(targetPropId)) {
      filter.propertyId = targetPropId;
    }
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
      .populate('propertyId', 'propertyName name type address city postcode landlordId')
      .populate('agentId', 'fullName name phone email region profileImage agencyName')
      .populate('landlordId', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tenancies.length, data: tenancies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End tenancy and revert property to Available
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

    // Revert Property status to Available unless another active tenancy exists
    if (tenancy.propertyId) {
      const otherActiveTenancy = await Tenancy.findOne({
        propertyId: tenancy.propertyId,
        status: 'Active',
        _id: { $ne: tenancy._id },
      });

      if (!otherActiveTenancy) {
        await Property.findByIdAndUpdate(tenancy.propertyId, {
          status: 'Available',
          assetStatus: 'Available',
          customerName: null,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tenancy ended. Property status set to Available.',
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
