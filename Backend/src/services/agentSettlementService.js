const Tenancy = require('../models/Tenancy');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');

/**
 * Recalculate status and amounts for a single AgentPayment record
 */
const recalculateAgentPayment = async (paymentId) => {
  const payment = await AgentPayment.findById(paymentId);
  if (!payment) return null;

  // Aggregate all approved or deducted agent expenses for this tenancy, month, and year
  const expenses = await AgentExpense.find({
    tenancyId: payment.tenancyId,
    billingMonth: payment.billingMonth,
    billingYear: payment.billingYear,
    status: { $in: ['Approved', 'Deducted'] },
  });

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const expectedAmount = payment.expectedAmount || 0;
  const netAmount = Math.max(0, expectedAmount - totalExpense);
  const paidAmount = payment.paidAmount || 0;
  const remainingAmount = Math.max(0, netAmount - paidAmount);
  const overpaymentCredit = paidAmount > netAmount ? paidAmount - netAmount : 0;

  const todayStr = new Date().toISOString().split('T')[0];

  let status = 'Pending';
  if (paidAmount >= netAmount && netAmount >= 0) {
    status = 'Paid';
  } else if (paidAmount > 0 && paidAmount < netAmount) {
    status = 'Partially Paid';
  } else if (payment.dueDate < todayStr && remainingAmount > 0) {
    status = 'Overdue';
  } else {
    status = 'Pending';
  }

  payment.expenseAmount = totalExpense;
  payment.netAmount = netAmount;
  payment.remainingAmount = remainingAmount;
  payment.overpaymentCredit = overpaymentCredit;
  payment.status = status;

  await payment.save();
  return payment;
};

/**
 * Automatically generate monthly agent settlement records for all active tenancies with an agent
 */
const generateMonthlyAgentSettlements = async () => {
  try {
    const activeTenancies = await Tenancy.find({
      status: 'Active',
      agentId: { $ne: null },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)
    const todayStr = now.toISOString().split('T')[0];

    for (const tenancy of activeTenancies) {
      if (!tenancy.companyMonthlyAmount || tenancy.companyMonthlyAmount <= 0) {
        continue;
      }

      let startYear = currentYear;
      let startMonth = currentMonth;

      if (tenancy.startDate) {
        const parts = tenancy.startDate.split('-');
        if (parts.length === 3) {
          startYear = parseInt(parts[0], 10);
          startMonth = parseInt(parts[1], 10);
        }
      }

      // Generate settlement for months from start date up to current month/year
      let year = startYear;
      let month = startMonth;

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        // Format due date YYYY-MM-DD using agentPaymentDueDay
        const dueDay = Math.min(28, Math.max(1, tenancy.agentPaymentDueDay || 1));
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const dayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
        const dueDate = `${year}-${monthStr}-${dayStr}`;

        const existing = await AgentPayment.findOne({
          tenancyId: tenancy._id,
          billingMonth: month,
          billingYear: year,
        });

        if (!existing) {
          // Calculate approved agent expenses for this tenancy, month, year
          const expenses = await AgentExpense.find({
            tenancyId: tenancy._id,
            billingMonth: month,
            billingYear: year,
            status: { $in: ['Approved', 'Deducted'] },
          });

          const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const expectedAmount = tenancy.companyMonthlyAmount;
          const netAmount = Math.max(0, expectedAmount - totalExpense);
          const remainingAmount = netAmount;

          let status = 'Pending';
          if (dueDate < todayStr && remainingAmount > 0) {
            status = 'Overdue';
          }

          try {
            await AgentPayment.create({
              agentId: tenancy.agentId,
              tenancyId: tenancy._id,
              propertyId: tenancy.propertyId,
              tenantId: tenancy.customerId,
              billingMonth: month,
              billingYear: year,
              expectedAmount,
              expenseAmount: totalExpense,
              netAmount,
              paidAmount: 0,
              remainingAmount,
              dueDate,
              status,
            });
          } catch (createErr) {
            // Ignore duplicate key errors if concurrent request
            if (createErr.code !== 11000) {
              console.warn('[Agent Settlement Create Error]', createErr.message);
            }
          }
        } else {
          // Recalculate existing payment record
          await recalculateAgentPayment(existing._id);
        }

        // Increment month
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
    }
  } catch (err) {
    console.error('[Agent Settlement Generator Error]', err.message);
  }
};

module.exports = {
  generateMonthlyAgentSettlements,
  recalculateAgentPayment,
};
