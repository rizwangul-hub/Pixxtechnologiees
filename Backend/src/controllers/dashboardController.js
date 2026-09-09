const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const Tenancy = require('../models/Tenancy');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Landlord = require('../models/Landlord');
const TenantDocument = require('../models/TenantDocument');
const Agent = require('../models/Agent');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const { generateMonthlyPayments } = require('../services/paymentGeneratorService');
const { generateMonthlyAgentSettlements } = require('../services/agentSettlementService');

/**
 * @desc    Get consolidated main dashboard API
 * @route   GET /api/dashboard
 * @access  Private
 */
const getUnifiedDashboard = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const { propertyId, landlordId } = req.query;

    let propertyFilter = {};
    let unitFilter = {};
    let tenancyFilter = {};
    let paymentFilter = {};
    let expenseFilter = {};

    if (propertyId) {
      propertyFilter = { _id: propertyId };
      unitFilter = { propertyId };
      tenancyFilter = { propertyId };
      paymentFilter = { propertyId };
      expenseFilter = { propertyId };
    } else if (landlordId) {
      const landlordProps = await Property.find({ landlordId }).select('_id');
      const propIds = landlordProps.map((p) => p._id);
      propertyFilter = { _id: { $in: propIds } };
      unitFilter = { propertyId: { $in: propIds } };
      tenancyFilter = { propertyId: { $in: propIds } };
      paymentFilter = { propertyId: { $in: propIds } };
      expenseFilter = { propertyId: { $in: propIds } };
    }

    // 1. LANDLORD & PROPERTY INFORMATION
    const totalLandlords = await Landlord.countDocuments();
    const totalProperties = await Property.countDocuments(propertyFilter);
    const totalUnits = await Unit.countDocuments(unitFilter);
    const occupiedUnits = await Unit.countDocuments({ ...unitFilter, status: 'Occupied' });
    const availableUnits = await Unit.countDocuments({ ...unitFilter, status: 'Available' });
    const reservedUnits = await Unit.countDocuments({ ...unitFilter, status: 'Reserved' });
    const maintenanceUnits = await Unit.countDocuments({ ...unitFilter, status: 'Maintenance' });

    // 2. TENANT INFORMATION
    const totalCustomers = await Customer.countDocuments();
    const activeTenancies = await Tenancy.countDocuments({ ...tenancyFilter, status: 'Active' });
    const endedTenancies = await Tenancy.countDocuments({ ...tenancyFilter, status: 'Ended' });

    // 3. FINANCIAL & PAYMENT INFORMATION
    const payments = await Payment.find(paymentFilter);
    let monthlyExpectedRent = 0;
    let monthlyCollectedRent = 0;
    let monthlyOutstandingRent = 0;
    let totalOverdue = 0;
    let overduePaymentCount = 0;
    let upcomingPaymentCount = 0;
    let paidPaymentCount = 0;
    let pendingPaymentCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    payments.forEach((p) => {
      monthlyExpectedRent += p.amount || 0;
      monthlyCollectedRent += p.paidAmount || 0;
      monthlyOutstandingRent += p.remainingAmount || 0;

      if (p.status === 'Paid') {
        paidPaymentCount++;
      } else if (p.status === 'Overdue' || (p.dueDate < todayStr && p.remainingAmount > 0)) {
        totalOverdue += p.remainingAmount || 0;
        overduePaymentCount++;
      } else if (p.dueDate >= todayStr && p.remainingAmount > 0) {
        upcomingPaymentCount++;
        pendingPaymentCount++;
      } else {
        pendingPaymentCount++;
      }
    });

    // 4. EXPENSES (Property Expenses + Agent Maintenance Expenses)
    const propertyExpenses = await Expense.find(expenseFilter);
    const totalPropertyExpenses = propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const agentExpensesList = await AgentExpense.find({ status: { $in: ['Approved', 'Deducted'] } });
    const totalAgentExpenses = agentExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpenses = totalPropertyExpenses + totalAgentExpenses;

    // 5. TENANT DOCUMENTS EXPIRY ALERTS
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(todayDate.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const expiringDocumentsRaw = await TenantDocument.find({
      expiryDate: {
        $gte: todayDate,
        $lte: thirtyDaysFromNow,
      },
    }).populate('tenantId', 'fullName name phone email type');

    const expiredDocumentsRaw = await TenantDocument.find({
      expiryDate: {
        $ne: null,
        $lt: todayDate,
      },
    }).populate('tenantId', 'fullName name phone email type');

    const fallbackEmail = process.env.DOCUMENT_EXPIRY_FALLBACK_EMAIL || 'ftaccountants@hotmail.com';

    const expiringDocumentsList = await Promise.all(
      expiringDocumentsRaw.map(async (doc) => {
        const obj = doc.toObject({ virtuals: true });
        const activeTenancy = await Tenancy.findOne({
          customerId: doc.tenantId?._id || doc.tenantId,
          status: 'Active',
        })
          .populate('propertyId')
          .populate('unitId')
          .populate('agentId');

        const agent = activeTenancy?.agentId || null;
        let recipientEmail = agent?.email ? agent.email.trim() : '';
        let isFallbackRecipient = false;
        if (!recipientEmail || !recipientEmail.includes('@')) {
          recipientEmail = fallbackEmail;
          isFallbackRecipient = true;
        }

        const expDate = new Date(doc.expiryDate);
        expDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...obj,
          tenantName: doc.tenantId?.fullName || doc.tenantId?.name || 'Unknown Tenant',
          tenantId: doc.tenantId?._id || doc.tenantId,
          propertyName: activeTenancy?.propertyId?.title || activeTenancy?.propertyId?.name || 'Unassigned Property',
          unitName: activeTenancy?.unitId?.name || 'Unassigned Unit',
          agentName: agent?.fullName || 'No Agent',
          agentEmail: agent?.email || '',
          hasAgent: !!(agent && agent.email),
          recipientEmail: doc.expiryReminder30Recipient || recipientEmail,
          isFallbackRecipient,
          daysRemaining,
        };
      })
    );

    const expiredDocumentsList = await Promise.all(
      expiredDocumentsRaw.map(async (doc) => {
        const obj = doc.toObject({ virtuals: true });
        const activeTenancy = await Tenancy.findOne({
          customerId: doc.tenantId?._id || doc.tenantId,
          status: 'Active',
        })
          .populate('propertyId')
          .populate('unitId')
          .populate('agentId');

        const expDate = new Date(doc.expiryDate);
        expDate.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...obj,
          tenantName: doc.tenantId?.fullName || doc.tenantId?.name || 'Unknown Tenant',
          tenantId: doc.tenantId?._id || doc.tenantId,
          propertyName: activeTenancy?.propertyId?.title || activeTenancy?.propertyId?.name || 'Unassigned Property',
          unitName: activeTenancy?.unitId?.name || 'Unassigned Unit',
          agentName: activeTenancy?.agentId?.fullName || 'No Agent',
          daysRemaining,
        };
      })
    );

    const expiringWithoutAgentCount = expiringDocumentsList.filter((d) => d.isFallbackRecipient).length;

    // 6. LISTS
    const recentPayments = await Payment.find({ ...paymentFilter, paidAmount: { $gt: 0 } })
      .populate('customerId', 'fullName phone email name')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .sort({ paidDate: -1, updatedAt: -1 })
      .limit(5);

    const rawOverdue = await Payment.find({
      ...paymentFilter,
      $or: [
        { status: 'Overdue' },
        { dueDate: { $lt: todayStr }, remainingAmount: { $gt: 0 }, status: { $ne: 'Paid' } }
      ]
    })
      .populate('customerId', 'fullName phone email name')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .sort({ dueDate: 1 })
      .limit(10);

    const todayMs = new Date().getTime();
    const overduePayments = rawOverdue.map((p) => {
      const pObj = p.toObject();
      const dueMs = new Date(p.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
      return { ...pObj, daysOverdue: diffDays };
    });

    const upcomingPayments = await Payment.find({
      ...paymentFilter,
      dueDate: { $gte: todayStr },
      remainingAmount: { $gt: 0 },
      status: { $ne: 'Paid' }
    })
      .populate('customerId', 'fullName phone email name')
      .populate('propertyId', 'propertyName name')
      .populate('unitId', 'unitName name')
      .sort({ dueDate: 1 })
      .limit(5);

    const recentExpenses = await Expense.find(expenseFilter)
      .populate('propertyId', 'propertyName name')
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        propertyInfo: {
          totalLandlords,
          totalProperties,
          totalUnits,
          occupiedUnits,
          availableUnits,
          reservedUnits,
          maintenanceUnits,
        },
        tenantInfo: {
          totalCustomers,
          activeTenancies,
          endedTenancies,
        },
        financialInfo: {
          monthlyExpectedRent,
          monthlyCollectedRent,
          monthlyOutstandingRent,
          totalOverdue,
          totalPropertyExpenses,
          totalAgentExpenses,
          totalExpenses,
        },
        paymentInfo: {
          overduePaymentCount,
          upcomingPaymentCount,
          paidPaymentCount,
          pendingPaymentCount,
        },
        documentInfo: {
          expiringDocumentsCount: expiringDocumentsList.length,
          expiredDocumentsCount: expiredDocumentsList.length,
          expiringWithoutAgentCount,
        },
        recentPayments,
        overduePayments,
        upcomingPayments,
        recentExpenses,
        expiringDocuments: expiringDocumentsList,
        expiredDocuments: expiredDocumentsList,
      },
    });
  } catch (error) {
    console.error('[Dashboard Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      errors: [error.message],
    });
  }
};

/**
 * @desc    Get per-property dashboard summary
 * @route   GET /api/dashboard/properties
 * @access  Private
 */
const getPropertyDashboard = async (req, res) => {
  try {
    await generateMonthlyPayments();

    const properties = await Property.find().sort({ name: 1 });

    const propertySummaries = await Promise.all(
      properties.map(async (prop) => {
        const totalUnits = await Unit.countDocuments({ propertyId: prop._id });
        const occupiedUnits = await Unit.countDocuments({ propertyId: prop._id, status: 'Occupied' });
        const availableUnits = await Unit.countDocuments({ propertyId: prop._id, status: 'Available' });

        const payments = await Payment.find({ propertyId: prop._id });
        let monthlyExpectedRent = 0;
        let monthlyCollectedRent = 0;
        let outstandingRent = 0;

        payments.forEach((p) => {
          monthlyExpectedRent += p.amount || 0;
          monthlyCollectedRent += p.paidAmount || 0;
          outstandingRent += p.remainingAmount || 0;
        });

        return {
          propertyId: prop._id,
          propertyName: prop.propertyName || prop.name,
          propertyType: prop.type,
          totalUnits,
          occupiedUnits,
          availableUnits,
          monthlyExpectedRent,
          monthlyCollectedRent,
          outstandingRent,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Property dashboard data retrieved',
      data: propertySummaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve property dashboard data',
      errors: [error.message],
    });
  }
};

/**
 * @desc    Get Agent Financial Summary dashboard analytics
 * @route   GET /api/dashboard/agent-summary
 * @access  Private
 */
const getAgentDashboardSummary = async (req, res) => {
  try {
    await generateMonthlyAgentSettlements();

    const activeAgentsCount = await Agent.countDocuments({ status: 'Active' });
    const assignedTenancies = await Tenancy.find({ status: 'Active', agentId: { $ne: null } });
    const assignedUnitsCount = assignedTenancies.length;

    const allAgentPayments = await AgentPayment.find();

    let totalExpected = 0;
    let totalExpenses = 0;
    let totalNet = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;

    allAgentPayments.forEach((p) => {
      totalExpected += p.expectedAmount || 0;
      totalExpenses += p.expenseAmount || 0;
      totalNet += p.netAmount || 0;
      totalReceived += p.paidAmount || 0;
      totalOutstanding += p.remainingAmount || 0;

      if (p.status === 'Overdue') {
        overdueCount++;
      }
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthExpensesList = await AgentExpense.find({
      billingMonth: currentMonth,
      billingYear: currentYear,
      status: { $in: ['Approved', 'Deducted'] },
    });

    const expensesThisMonth = currentMonthExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Agent dashboard summary retrieved successfully',
      data: {
        activeAgents: activeAgentsCount,
        assignedUnits: assignedUnitsCount,
        overdueCount,
        totalExpected,
        totalExpectedAmount: totalExpected,
        totalExpenses,
        totalApprovedExpenses: totalExpenses,
        netAmount: totalNet,
        totalNetAmount: totalNet,
        totalReceived,
        totalPaidAmount: totalReceived,
        totalOutstanding,
        totalRemainingAmount: totalOutstanding,
        expensesThisMonth,
      },
    });
  } catch (error) {
    console.error('[Agent Dashboard Summary Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve agent dashboard summary',
      errors: [error.message],
    });
  }
};

module.exports = {
  getUnifiedDashboard,
  getPropertyDashboard,
  getAgentDashboardSummary,
};
