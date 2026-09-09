const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const Landlord = require('../models/Landlord');
const Tenancy = require('../models/Tenancy');
const Agent = require('../models/Agent');
const Payment = require('../models/Payment');
const PaymentSchedule = require('../models/PaymentSchedule');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const Expense = require('../models/Expense');
const Mortgage = require('../models/Mortgage');
const MortgagePayment = require('../models/MortgagePayment');

/**
 * Currency Formatter Helper for Reports
 */
function formatReportCurrency(amount) {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `(£${absFormatted})` : `£${absFormatted}`;
}

/**
 * UK Date Formatter Helper for Reports (DD/MM/YYYY)
 */
function formatUKDate(dateInput) {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) return dateInput;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function safeIdEquals(a, b) {
  if (!a || !b) return false;
  const strA = (a._id || a.id || a).toString();
  const strB = (b._id || b.id || b).toString();
  return strA === strB;
}

/**
 * Safe Mongoose Entity Lookup Helper
 * Prevents Cast to ObjectId failed errors when idVal is "All", "all", or custom string IDs
 */
async function findEntitySafely(Model, idVal) {
  if (!idVal || String(idVal).trim().toLowerCase() === 'all') return null;

  if (mongoose.Types.ObjectId.isValid(idVal)) {
    try {
      const found = await Model.findById(idVal);
      if (found) return found;
    } catch (e) {}
  }

  try {
    const found = await Model.findOne({ id: idVal });
    if (found) return found;
  } catch (e) {}

  if (typeof idVal === 'string' && idVal.trim().length > 0) {
    try {
      const found = await Model.findOne({
        $or: [{ name: idVal }, { title: idVal }, { fullName: idVal }, { propertyName: idVal }],
      });
      if (found) return found;
    } catch (e) {}
  }

  return null;
}

function filterValidObjectIds(idList) {
  if (!Array.isArray(idList)) return [];
  const validMap = new Map();
  for (const item of idList) {
    if (!item) continue;
    const str = (item._id || item.id || item).toString().trim();
    if (mongoose.Types.ObjectId.isValid(str)) {
      validMap.set(str, new mongoose.Types.ObjectId(str));
    }
  }
  return Array.from(validMap.values());
}

/**
 * 1. TENANT STATEMENT DATA GENERATOR
 */
async function generateTenantStatementData(tenantId, fromDate, toDate, propertyId) {
  const isAll = !tenantId || String(tenantId).trim().toLowerCase() === 'all';
  let tenant = await findEntitySafely(Customer, tenantId);

  if (!tenant) {
    tenant = {
      _id: isAll ? 'all_tenants' : tenantId,
      name: isAll ? 'All Tenants Portfolio' : (typeof tenantId === 'string' ? tenantId : 'Tenant'),
      fullName: isAll ? 'All Tenants Portfolio' : (typeof tenantId === 'string' ? tenantId : 'Tenant'),
      phone: '-',
      email: '-',
    };
  }

  // Find tenancy
  const validTenantObjectIds = isAll ? [] : filterValidObjectIds([tenant._id, tenant.id, tenantId]);
  const tenancyQuery = isAll
    ? {}
    : (validTenantObjectIds.length > 0 ? { customerId: { $in: validTenantObjectIds } } : { customerId: new mongoose.Types.ObjectId() });

  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const propDoc = await findEntitySafely(Property, propertyId);
    const validProps = filterValidObjectIds([propDoc?._id, propDoc?.id, propertyId]);
    if (validProps.length > 0) {
      tenancyQuery.propertyId = { $in: validProps };
    } else {
      tenancyQuery.propertyId = new mongoose.Types.ObjectId();
    }
  }

  const tenancies = await Tenancy.find(tenancyQuery)
    .populate('propertyId')
    .populate('unitId')
    .populate('agentId');

  const primaryTenancy = tenancies[0] || null;
  let property = primaryTenancy?.propertyId || null;
  let unit = primaryTenancy?.unitId || null;
  let landlord = null;

  if (property && property.landlordId && mongoose.Types.ObjectId.isValid(property.landlordId)) {
    landlord = await Landlord.findById(property.landlordId);
  }

  // Fetch all payment records for this tenant
  const paymentQuery = isAll
    ? {}
    : (validTenantObjectIds.length > 0 ? { customerId: { $in: validTenantObjectIds } } : { customerId: new mongoose.Types.ObjectId() });

  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const propDoc = await findEntitySafely(Property, propertyId);
    const validProps = filterValidObjectIds([propDoc?._id, propDoc?.id, propertyId]);
    if (validProps.length > 0) {
      paymentQuery.propertyId = { $in: validProps };
    } else {
      paymentQuery.propertyId = new mongoose.Types.ObjectId();
    }
  }
  const allPayments = await Payment.find(paymentQuery).sort({ dueDate: 1, createdAt: 1 });

  // Build full raw transaction list
  const allTransactions = [];

  for (const p of allPayments) {
    const rentPeriod = `Rent for ${p.billingMonth < 10 ? '0' + p.billingMonth : p.billingMonth}/${p.billingYear}`;
    const refNo = p.invoiceNumber || (p._id ? `INV-${p._id.toString().slice(-4).toUpperCase()}` : '');

    // Rent Charge (Debit)
    allTransactions.push({
      id: `rent-${p._id}`,
      date: p.dueDate,
      createdAt: p.createdAt || p.dueDate,
      reference: refNo,
      description: rentPeriod,
      payee: tenant.fullName || tenant.name,
      debit: p.amount || 0,
      credit: 0,
      type: 'Charge',
    });

    // Payment Received (Credit)
    if (p.paidAmount && p.paidAmount > 0) {
      allTransactions.push({
        id: `pay-${p._id}`,
        date: p.paidDate || p.dueDate,
        createdAt: p.updatedAt || p.paidDate || p.dueDate,
        reference: p.reference || p.paymentMethod || '',
        description: 'Payment',
        payee: tenant.fullName || tenant.name,
        debit: 0,
        credit: p.paidAmount,
        type: 'Payment',
      });
    }
  }

  // Sort all transactions chronologically
  allTransactions.sort((a, b) => {
    if (a.date === b.date) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return a.date.localeCompare(b.date);
  });

  // Calculate Starting Balance / Balance Forward prior to `fromDate`
  let balanceForward = 0;
  const periodStart = fromDate || '1970-01-01';
  const periodEnd = toDate || '2099-12-31';

  const inPeriodTransactions = [];

  for (const txn of allTransactions) {
    if (txn.date < periodStart) {
      balanceForward += txn.debit - txn.credit;
    } else if (txn.date <= periodEnd) {
      inPeriodTransactions.push(txn);
    }
  }

  // Build statement transactions with running balance
  let runningBalance = balanceForward;
  let totalRentDue = 0;
  let totalPayments = 0;

  const statementRows = [];

  statementRows.push({
    date: periodStart,
    reference: '',
    description: 'Starting Balance',
    payee: '',
    debit: 0,
    credit: 0,
    debitFormatted: '',
    creditFormatted: '',
    balance: runningBalance,
    balanceFormatted: formatReportCurrency(runningBalance),
  });

  for (const txn of inPeriodTransactions) {
    runningBalance += txn.debit - txn.credit;
    totalRentDue += txn.debit;
    totalPayments += txn.credit;

    statementRows.push({
      date: txn.date,
      reference: txn.reference,
      description: txn.description,
      payee: txn.payee,
      debit: txn.debit,
      credit: txn.credit,
      debitFormatted: txn.debit > 0 ? formatReportCurrency(txn.debit) : '',
      creditFormatted: txn.credit > 0 ? formatReportCurrency(txn.credit) : '',
      balance: runningBalance,
      balanceFormatted: formatReportCurrency(runningBalance),
    });
  }

  const totalAmountDue = balanceForward + totalRentDue;
  const totalOutstanding = runningBalance;

  return {
    reportType: 'Tenant Statement',
    statementDate: new Date().toISOString().split('T')[0],
    fromDate: periodStart,
    toDate: periodEnd,
    landlord: {
      id: landlord?._id || '',
      name: landlord?.fullName || 'PixxTechnologies Property Management',
      address: landlord?.address || '',
      logoUrl: landlord?.logo?.url || '',
    },
    tenant: {
      id: tenant._id,
      name: tenant.fullName || tenant.name,
      address: tenant.address || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
    },
    property: {
      id: property?._id || '',
      name: property?.title || property?.name || 'Assigned Property',
      address: property?.address || '',
      unitName: unit?.name || '',
    },
    summary: {
      balanceForward,
      balanceForwardFormatted: formatReportCurrency(balanceForward),
      totalRentDue,
      totalRentDueFormatted: formatReportCurrency(totalRentDue),
      totalAmountDue,
      totalAmountDueFormatted: formatReportCurrency(totalAmountDue),
      totalPayments,
      totalPaymentsFormatted: formatReportCurrency(totalPayments),
      totalOutstanding,
      totalOutstandingFormatted: formatReportCurrency(totalOutstanding),
    },
    transactions: statementRows,
  };
}

function getOrdinalDay(dayNum) {
  const d = parseInt(dayNum, 10) || 1;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRecent3Months(endDateInput) {
  let end = endDateInput ? new Date(endDateInput) : new Date();
  if (isNaN(end.getTime())) end = new Date();

  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const yr = String(d.getFullYear()).slice(-2);
    const label = `${monthNames[d.getMonth()]}-${yr}`;
    const startStr = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const endStr = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    months.push({
      label,
      year: d.getFullYear(),
      month: d.getMonth(),
      startStr,
      endStr,
    });
  }
  return months;
}

function isPaymentInMonth(pay, mInfo) {
  if (pay.billingMonth && pay.billingYear) {
    if (Number(pay.billingMonth) === mInfo.month + 1 && Number(pay.billingYear) === mInfo.year) {
      return true;
    }
  }

  const rawDate = pay.paidDate || pay.dueDate || pay.paymentDate || pay.createdAt;
  if (!rawDate) return false;

  let dObj;
  if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    const [dd, mm, yyyy] = rawDate.split('/');
    dObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else {
    dObj = new Date(rawDate);
  }

  if (isNaN(dObj.getTime())) return false;
  return dObj.getFullYear() === mInfo.year && dObj.getMonth() === mInfo.month;
}

/**
 * 2. LANDLORD REPORT DATA GENERATOR
 */
async function generateLandlordReportData(landlordId, fromDate, toDate) {
  const isAll = !landlordId || landlordId === 'All' || landlordId === 'all';
  let landlord = await findEntitySafely(Landlord, landlordId);

  if (!landlord) {
    landlord = {
      _id: isAll ? 'all_landlords' : landlordId,
      name: isAll ? 'All Landlords Portfolio' : (typeof landlordId === 'string' ? landlordId : 'Landlord'),
      fullName: isAll ? 'All Landlords Portfolio' : (typeof landlordId === 'string' ? landlordId : 'Landlord'),
      email: 'portfolio@pixxtechnologies.com',
      phone: '-',
    };
  }

  const validLandlordObjectIds = isAll ? [] : filterValidObjectIds([landlord._id, landlord.id, landlordId]);
  const propQueryFilter = isAll ? {} : (validLandlordObjectIds.length > 0 ? { landlordId: { $in: validLandlordObjectIds } } : { landlordId: new mongoose.Types.ObjectId() });

  const properties = await Property.find(propQueryFilter);
  const propertyIds = properties.map((p) => p._id);
  const validPropObjectIds = isAll ? [] : filterValidObjectIds([...propertyIds, ...properties.map((p) => p.id)]);

  const unitQueryFilter = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });
  const tenancyQueryFilter = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });

  const units = await Unit.find(unitQueryFilter);
  const unitIds = units.map((u) => u._id);

  const tenancies = await Tenancy.find(tenancyQueryFilter)
    .populate('customerId')
    .populate('unitId')
    .populate('agentId');

  // Payments & Expenses
  const pQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });
  if (fromDate && toDate) {
    pQuery.dueDate = { $gte: fromDate, $lte: toDate };
  }
  const payments = await Payment.find(pQuery);

  const eQuery = { propertyId: { $in: propertyIds } };
  if (fromDate && toDate) {
    eQuery.date = { $gte: fromDate, $lte: toDate };
  }
  const propertyExpenses = await Expense.find(eQuery);
  const agentExpenses = await AgentExpense.find({ ...eQuery, status: 'Approved' });

  const totalRentDue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalPropertyExp = propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAgentExp = agentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = totalPropertyExp + totalAgentExp;
  const netIncome = totalPayments - totalExpenses;
  const totalOutstanding = totalRentDue - totalPayments;

  // Breakdown per property
  const propertyBreakdown = properties.map((p) => {
    const pUnits = units.filter((u) => safeIdEquals(u.propertyId, p._id));
    const pTenancies = tenancies.filter((t) => safeIdEquals(t.propertyId, p._id));
    const pPayments = payments.filter((pay) => safeIdEquals(pay.propertyId, p._id));
    const pPropExp = propertyExpenses.filter((e) => safeIdEquals(e.propertyId, p._id));
    const pAgentExp = agentExpenses.filter((e) => safeIdEquals(e.propertyId, p._id));

    const due = pPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const paid = pPayments.reduce((sum, pay) => sum + (pay.paidAmount || 0), 0);
    const exp = pPropExp.reduce((sum, e) => sum + (e.amount || 0), 0) + pAgentExp.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      propertyId: p._id,
      propertyName: p.title || p.name,
      propertyType: p.type || 'Residential',
      name: p.title || p.name,
      address: p.address,
      totalUnits: pUnits.length,
      occupiedUnits: pUnits.filter((u) => u.status === 'Occupied').length,
      availableUnits: pUnits.filter((u) => u.status === 'Available').length,
      activeTenantsCount: pTenancies.length,
      rentDueFormatted: formatReportCurrency(due),
      paymentsFormatted: formatReportCurrency(paid),
      expensesFormatted: formatReportCurrency(exp),
      netIncomeFormatted: formatReportCurrency(paid - exp),
      totalRentDue: due,
      totalPaid: paid,
      totalExpenses: exp,
      netIncome: paid - exp,
      outstanding: due - paid,
    };
  });

  // 3-Month Collection Tracker Matrix for Rent Income Report
  const trackingMonths = getRecent3Months(toDate);
  const periodPayments = await Payment.find({
    propertyId: { $in: propertyIds },
  });

  let rowCounter = 1;
  const unitMatrixRows = [];

  for (const p of properties) {
    const pUnits = units.filter((u) => safeIdEquals(u.propertyId, p._id));
    const unitsToProcess = pUnits.length > 0 ? pUnits : [{ _id: p._id, name: p.title || p.name, price: p.price || 0, isSynthetic: true }];

    for (const u of unitsToProcess) {
      const uTenancy =
        tenancies.find((t) => safeIdEquals(t.unitId, u._id)) ||
        tenancies.find((t) => safeIdEquals(t.propertyId, p._id));

      const samplePay = periodPayments.find((pay) => {
        return u.isSynthetic ? safeIdEquals(pay.propertyId, p._id) : safeIdEquals(pay.unitId, u._id);
      });

      let rent = Number(uTenancy?.monthlyRent || u.monthlyRent || u.price || p.price || samplePay?.amount) || 0;
      if (rent === 0 && payments && payments.length > 0) {
        const propPay = payments.find((pay) => safeIdEquals(pay.propertyId, p._id) && pay.amount > 0);
        if (propPay) rent = propPay.amount;
      }

      const rawMFee = Number(uTenancy?.companyMonthlyAmount || u.companyMonthlyAmount) || (rent > 0 ? 50 : 0);
      const mFee = rent > 0 ? -Math.abs(rawMFee) : 0;
      const dueDateStr = getOrdinalDay(uTenancy?.paymentDueDay || 1);
      const netRentReceivable = rent + mFee;

      const fullAddress = `${p.address || p.title || p.name}${u.name && !u.isSynthetic ? ', ' + u.name : ''}`;

      const collections = trackingMonths.map((mInfo) => {
        const mPay = periodPayments.find((pay) => {
          const matchUnit = u.isSynthetic
            ? safeIdEquals(pay.propertyId, p._id)
            : safeIdEquals(pay.unitId, u._id);
          return matchUnit && isPaymentInMonth(pay, mInfo);
        });

        if (mPay && (mPay.paidAmount > 0 || mPay.status === 'Paid' || mPay.amount > 0)) {
          const paidD = mPay.paidDate || mPay.dueDate;
          const dateFmt = typeof paidD === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(paidD)
            ? paidD
            : formatUKDate(paidD);

          const paidAmt = mPay.paidAmount > 0 ? mPay.paidAmount : (mPay.amount || netRentReceivable);
          return {
            monthLabel: mInfo.label,
            date: dateFmt,
            amount: paidAmt,
            status: paidAmt >= (mPay.amount || rent) ? 'Paid' : 'Partial',
          };
        } else {
          return {
            monthLabel: mInfo.label,
            date: '',
            amount: 0,
            status: 'Unpaid',
          };
        }
      });

      unitMatrixRows.push({
        no: rowCounter++,
        propertyId: p._id,
        unitId: u._id,
        propertyName: p.title || p.name,
        unitName: u.isSynthetic ? '' : u.name,
        propertyAddress: fullAddress,
        rent,
        mFee,
        dueDate: dueDateStr,
        netRentReceivable,
        collections,
      });
    }
  }

  return {
    reportType: 'Landlord Report',
    reportDate: new Date().toISOString().split('T')[0],
    fromDate: fromDate || '',
    toDate: toDate || '',
    landlord: {
      id: landlord._id,
      name: landlord.fullName,
      email: landlord.email,
      phone: landlord.phone,
      address: landlord.address,
      country: landlord.country,
      region: landlord.region,
      logoUrl: landlord.logo?.url || '',
    },
    summary: {
      totalProperties: properties.length,
      totalUnits: units.length,
      occupiedUnits: units.filter((u) => u.status === 'Occupied').length,
      availableUnits: units.filter((u) => u.status === 'Available').length,
      activeTenantsCount: tenancies.length,
      totalRentDue,
      totalRentDueFormatted: formatReportCurrency(totalRentDue),
      totalPayments,
      totalPaymentsFormatted: formatReportCurrency(totalPayments),
      totalExpenses,
      totalExpensesFormatted: formatReportCurrency(totalExpenses),
      netIncome,
      netIncomeFormatted: formatReportCurrency(netIncome),
      totalOutstanding,
      totalOutstandingFormatted: formatReportCurrency(totalOutstanding),
    },
    propertiesBreakdown: propertyBreakdown,
    properties: propertyBreakdown,
    unitMatrixRows,
    trackingMonths: trackingMonths.map((m) => m.label),
  };
}

/**
 * 3. AGENT REPORT DATA GENERATOR
 */
async function generateAgentReportData(agentId, fromDate, toDate) {
  const isAll = !agentId || agentId === 'All' || agentId === 'all';
  let agent = await findEntitySafely(Agent, agentId);

  if (!agent) {
    agent = {
      _id: isAll ? 'all_agents' : agentId,
      name: isAll ? 'All Field Agents' : (typeof agentId === 'string' ? agentId : 'Agent'),
      fullName: isAll ? 'All Field Agents' : (typeof agentId === 'string' ? agentId : 'Agent'),
      phone: '-',
      email: 'agents@pixxtechnologies.com',
      region: 'All Regions',
      profileImage: '',
    };
  }

  const settlementsQuery = isAll ? {} : { agentId: agent._id };
  if (fromDate && toDate) {
    const fromMonth = new Date(fromDate).getMonth() + 1;
    const fromYear = new Date(fromDate).getFullYear();
    const toMonth = new Date(toDate).getMonth() + 1;
    const toYear = new Date(toDate).getFullYear();

    settlementsQuery.$or = [
      { billingYear: { $gt: fromYear, $lt: toYear } },
      { billingYear: fromYear, billingMonth: { $gte: fromMonth } },
      { billingYear: toYear, billingMonth: { $lte: toMonth } },
    ];
  }

  const settlements = await AgentPayment.find(settlementsQuery)
    .populate('propertyId')
    .populate('unitId')
    .populate('tenantId')
    .sort({ billingYear: -1, billingMonth: -1 });

  const assignedTenancyQuery = isAll ? { status: 'Active' } : { agentId: agent._id, status: 'Active' };
  const assignedTenancies = await Tenancy.find(assignedTenancyQuery)
    .populate('propertyId')
    .populate('unitId')
    .populate('customerId');

  const expectedAmount = settlements.reduce((sum, s) => sum + (s.expectedAmount || 0), 0);
  const expenseAmount = settlements.reduce((sum, s) => sum + (s.expenseAmount || 0), 0);
  const netAmount = settlements.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const paidAmount = settlements.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const remainingAmount = settlements.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

  return {
    reportType: 'Agent Report',
    reportDate: new Date().toISOString().split('T')[0],
    fromDate: fromDate || '',
    toDate: toDate || '',
    agent: {
      id: agent._id,
      name: agent.fullName || agent.name,
      phone: agent.phone || '-',
      email: agent.email || '-',
      region: agent.region || '-',
      profileImage: agent.profileImage || '',
    },
    summary: {
      assignedUnitsCount: assignedTenancies.length,
      expectedAmount,
      expectedAmountFormatted: formatReportCurrency(expectedAmount),
      expenseAmount,
      expenseAmountFormatted: formatReportCurrency(expenseAmount),
      netAmount,
      netAmountFormatted: formatReportCurrency(netAmount),
      paidAmount,
      paidAmountFormatted: formatReportCurrency(paidAmount),
      remainingAmount,
      remainingAmountFormatted: formatReportCurrency(remainingAmount),
    },
    settlements: settlements.map((s) => ({
      id: s._id,
      monthYear: `${s.billingMonth}/${s.billingYear}`,
      dueDate: s.dueDate,
      property: s.propertyId?.title || s.propertyId?.name || 'N/A',
      unit: s.unitId?.name || 'N/A',
      tenant: s.tenantId?.fullName || s.tenantId?.name || 'N/A',
      expectedAmount: s.expectedAmount,
      expenseAmount: s.expenseAmount,
      netAmount: s.netAmount,
      paidAmount: s.paidAmount,
      remainingAmount: s.remainingAmount,
      status: s.status,
    })),
  };
}

/**
 * 4. PROPERTY REPORT DATA GENERATOR
 */
async function generatePropertyReportData(propertyId, fromDate, toDate) {
  const isAll = !propertyId || propertyId === 'All' || propertyId === 'all';
  let property;
  let properties = [];

  if (isAll) {
    properties = await Property.find().populate('landlordId');
    if (properties.length === 0) {
      property = { _id: 'all_props', name: 'All Properties Portfolio', title: 'All Properties Portfolio', landlordName: 'Portfolio Manager' };
      properties = [property];
    } else {
      property = {
        _id: 'all_props',
        name: 'All Properties Portfolio',
        title: 'All Properties Portfolio',
        landlordName: properties[0]?.landlordId?.fullName || properties[0]?.landlordId?.name || 'Portfolio Manager',
      };
    }
  } else {
    property = await findEntitySafely(Property, propertyId);
    if (!property) {
      property = {
        _id: propertyId,
        name: typeof propertyId === 'string' ? propertyId : 'Selected Property',
        title: typeof propertyId === 'string' ? propertyId : 'Selected Property',
        landlordName: 'Property Manager',
      };
    }
    properties = [property];
  }

  const validPropObjectIds = isAll
    ? []
    : filterValidObjectIds([property._id, property.id, propertyId]);

  const unitQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });
  const tenancyQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });
  const pQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });
  const eQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });

  if (fromDate && toDate) {
    pQuery.dueDate = { $gte: fromDate, $lte: toDate };
    eQuery.date = { $gte: fromDate, $lte: toDate };
  }

  const periodPaymentQuery = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });

  const units = await Unit.find(unitQuery);
  const tenancies = await Tenancy.find(tenancyQuery)
    .populate('customerId')
    .populate('unitId')
    .populate('agentId');

  const payments = await Payment.find(pQuery);
  const propertyExpenses = await Expense.find(eQuery);
  const agentExpenses = await AgentExpense.find({ ...eQuery, status: 'Approved' });

  const totalRent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalExpenses =
    propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) +
    agentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3-Month Collection Tracker Matrix for Rent Income Report
  const trackingMonths = getRecent3Months(toDate);
  const periodPayments = await Payment.find(periodPaymentQuery);

  let rowCounter = 1;
  const unitMatrixRows = [];
  const unitsToProcess = units.length > 0 ? units : properties.map(p => ({ _id: p._id, name: p.title || p.name, price: p.price || 0, isSynthetic: true }));

  for (const u of unitsToProcess) {
    const uTenancy =
      tenancies.find((t) => safeIdEquals(t.unitId, u._id)) ||
      tenancies.find((t) => isAll || validPropObjectIds.some((idVal) => safeIdEquals(idVal, t.propertyId)));

    const samplePay = periodPayments.find((pay) => {
      return u.isSynthetic
        ? (isAll || validPropObjectIds.some((idVal) => safeIdEquals(idVal, pay.propertyId)))
        : safeIdEquals(pay.unitId, u._id);
    });

    let rent = Number(uTenancy?.monthlyRent || u.monthlyRent || u.price || property.price || samplePay?.amount) || 0;
    if (rent === 0 && payments && payments.length > 0) {
      const propPay = payments.find((pay) => pay.amount > 0);
      if (propPay) rent = propPay.amount;
    }

    const rawMFee = Number(uTenancy?.companyMonthlyAmount || u.companyMonthlyAmount) || (rent > 0 ? 50 : 0);
    const mFee = rent > 0 ? -Math.abs(rawMFee) : 0;
    const dueDateStr = getOrdinalDay(uTenancy?.paymentDueDay || 1);
    const netRentReceivable = rent + mFee;

    const fullAddress = `${property.address || property.title || property.name}${u.name && !u.isSynthetic ? ', ' + u.name : ''}`;

    const collections = trackingMonths.map((mInfo) => {
      const mPay = periodPayments.find((pay) => {
        const matchUnit = u.isSynthetic
          ? (propIdList.length === 0 || propIdList.some((idVal) => safeIdEquals(idVal, pay.propertyId)))
          : safeIdEquals(pay.unitId, u._id);

        return matchUnit && isPaymentInMonth(pay, mInfo);
      });

      if (mPay && (mPay.paidAmount > 0 || mPay.status === 'Paid' || mPay.amount > 0)) {
        const paidD = mPay.paidDate || mPay.dueDate;
        const dateFmt = typeof paidD === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(paidD)
          ? paidD
          : formatUKDate(paidD);

        const paidAmt = mPay.paidAmount > 0 ? mPay.paidAmount : (mPay.amount || netRentReceivable);
        return {
          monthLabel: mInfo.label,
          date: dateFmt,
          amount: paidAmt,
          status: paidAmt >= (mPay.amount || rent) ? 'Paid' : 'Partial',
        };
      } else {
        return {
          monthLabel: mInfo.label,
          date: '',
          amount: 0,
          status: 'Unpaid',
        };
      }
    });

    unitMatrixRows.push({
      no: rowCounter++,
      propertyId: property._id,
      unitId: u._id,
      propertyName: property.title || property.name,
      unitName: u.isSynthetic ? '' : u.name,
      propertyAddress: fullAddress,
      rent,
      mFee,
      dueDate: dueDateStr,
      netRentReceivable,
      collections,
    });
  }

  return {
    reportType: 'Property Report',
    reportDate: new Date().toISOString().split('T')[0],
    fromDate: fromDate || '',
    toDate: toDate || '',
    property: {
      id: property._id,
      name: property.title || property.name,
      address: property.address,
      type: property.type,
      landlordName: property.landlordName || property.landlordId?.fullName || 'Portfolio Manager',
      landlordLogo: property.landlordId?.logo?.url || '',
    },
    summary: {
      totalUnits: units.length,
      occupiedUnits: units.filter((u) => u.status === 'Occupied').length,
      availableUnits: units.filter((u) => u.status === 'Available').length,
      totalRent,
      totalRentFormatted: formatReportCurrency(totalRent),
      totalPaid,
      totalPaidFormatted: formatReportCurrency(totalPaid),
      totalExpenses,
      totalExpensesFormatted: formatReportCurrency(totalExpenses),
      netPosition: totalPaid - totalExpenses,
      netPositionFormatted: formatReportCurrency(totalPaid - totalExpenses),
      outstanding: totalRent - totalPaid,
      outstandingFormatted: formatReportCurrency(totalRent - totalPaid),
    },
    unitsBreakdown: units.map((u) => {
      const activeTenancy = tenancies.find(
        (t) => t.unitId?._id?.toString() === u._id?.toString() && t.status === 'Active'
      );
      return {
        unitId: u._id,
        name: u.name,
        type: u.type,
        status: u.status,
        tenantName: activeTenancy?.customerId?.fullName || activeTenancy?.customerId?.name || 'N/A',
        agentName: activeTenancy?.agentId?.fullName || 'Direct / None',
        monthlyRent: activeTenancy?.monthlyRent || u.price || 0,
        companyMonthlyAmount: activeTenancy?.companyMonthlyAmount || 0,
      };
    }),
    units: units.map((u) => {
      const activeTenancy = tenancies.find(
        (t) => t.unitId?._id?.toString() === u._id?.toString() && t.status === 'Active'
      );
      return {
        unitId: u._id,
        name: u.name,
        type: u.type,
        status: u.status,
        tenantName: activeTenancy?.customerId?.fullName || activeTenancy?.customerId?.name || 'N/A',
        agentName: activeTenancy?.agentId?.fullName || 'Direct / None',
        monthlyRent: activeTenancy?.monthlyRent || u.price || 0,
        companyMonthlyAmount: activeTenancy?.companyMonthlyAmount || 0,
      };
    }),
    unitMatrixRows,
    trackingMonths: trackingMonths.map((m) => m.label),
  };
}

/**
 * 5. UNIT REPORT DATA GENERATOR
 */
async function generateUnitReportData(unitId, fromDate, toDate) {
  const isAll = !unitId || unitId === 'All' || unitId === 'all';
  let unit = await findEntitySafely(Unit, unitId);

  if (!unit) {
    unit = {
      _id: isAll ? 'all_units' : unitId,
      name: isAll ? 'All Units Portfolio' : (typeof unitId === 'string' ? unitId : 'Unit'),
      type: 'Multi-Unit',
      status: 'Active',
      floor: '-',
      size: '-',
      price: 0,
    };
  }

  const property = unit.propertyId
    ? (typeof unit.propertyId === 'object'
        ? unit.propertyId
        : (mongoose.Types.ObjectId.isValid(unit.propertyId)
            ? await Property.findById(unit.propertyId).populate('landlordId')
            : await findEntitySafely(Property, unit.propertyId)))
    : null;

  const validUnitIds = isAll ? [] : filterValidObjectIds([unit._id, unit.id, unitId]);
  const tenancyQuery = isAll
    ? { status: 'Active' }
    : (validUnitIds.length > 0 ? { unitId: { $in: validUnitIds }, status: 'Active' } : { unitId: new mongoose.Types.ObjectId(), status: 'Active' });
  const tenancy = await Tenancy.findOne(tenancyQuery)
    .populate('customerId')
    .populate('agentId');

  const pQuery = isAll ? {} : (validUnitIds.length > 0 ? { unitId: { $in: validUnitIds } } : { unitId: new mongoose.Types.ObjectId() });
  if (fromDate && toDate) pQuery.dueDate = { $gte: fromDate, $lte: toDate };
  const payments = await Payment.find(pQuery).sort({ dueDate: -1 });

  const totalRent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  return {
    reportType: 'Unit Report',
    reportDate: new Date().toISOString().split('T')[0],
    unit: {
      id: unit._id,
      name: unit.name,
      type: unit.type,
      status: unit.status,
      floor: unit.floor,
      size: unit.size,
      price: unit.price,
    },
    property: {
      name: property?.title || property?.name || 'N/A',
      address: property?.address || '',
      landlordName: property?.landlordId?.fullName || property?.landlordId?.name || 'N/A',
    },
    tenant: tenancy?.customerId
      ? {
          name: tenancy.customerId.fullName || tenancy.customerId.name,
          phone: tenancy.customerId.phone,
          email: tenancy.customerId.email,
        }
      : null,
    agent: tenancy?.agentId ? { name: tenancy.agentId.fullName || tenancy.agentId.name, phone: tenancy.agentId.phone } : null,
    summary: {
      totalRent,
      totalPaid,
      outstanding: totalRent - totalPaid,
    },
    payments,
  };
}

/**
 * 6. PAYMENT REPORT DATA GENERATOR
 */
async function generatePaymentReportData(filters = {}) {
  const { fromDate, toDate, tenantId, propertyId, status, paymentMethod } = filters;
  const query = {};

  if (tenantId && tenantId !== 'All' && tenantId !== 'all') {
    const tDoc = await findEntitySafely(Customer, tenantId);
    const validT = filterValidObjectIds([tDoc?._id, tDoc?.id, tenantId]);
    if (validT.length > 0) query.customerId = { $in: validT };
    else query.customerId = new mongoose.Types.ObjectId();
  }
  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const pDoc = await findEntitySafely(Property, propertyId);
    const validP = filterValidObjectIds([pDoc?._id, pDoc?.id, propertyId]);
    if (validP.length > 0) query.propertyId = { $in: validP };
    else query.propertyId = new mongoose.Types.ObjectId();
  }
  if (status && status !== 'All') query.status = status;
  if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;
  if (fromDate && toDate) query.dueDate = { $gte: fromDate, $lte: toDate };

  const payments = await Payment.find(query)
    .populate('customerId')
    .populate('propertyId')
    .populate('unitId')
    .sort({ dueDate: -1 });

  const totalExpected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  return {
    reportType: 'Payment Report',
    reportDate: new Date().toISOString().split('T')[0],
    summary: {
      totalRecords: payments.length,
      totalExpected,
      totalPaid,
      totalRemaining: totalExpected - totalPaid,
    },
    payments: payments.map((p) => ({
      id: p._id,
      dueDate: p.dueDate,
      paidDate: p.paidDate || '',
      tenantName: p.customerId?.fullName || p.customerId?.name || 'N/A',
      propertyName: p.propertyId?.title || p.propertyId?.name || 'N/A',
      unitName: p.unitId?.name || 'N/A',
      amount: p.amount,
      paidAmount: p.paidAmount,
      remainingAmount: p.remainingAmount,
      status: p.status,
      paymentMethod: p.paymentMethod || 'Cash',
      reference: p.reference || '',
    })),
  };
}

/**
 * 7. EXPENSE REPORT DATA GENERATOR
 */
async function generateExpenseReportData(filters = {}) {
  const { fromDate, toDate, propertyId, category, expenseType } = filters;

  const propQuery = {};
  const agentQuery = {};

  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const pDoc = await findEntitySafely(Property, propertyId);
    const validP = filterValidObjectIds([pDoc?._id, pDoc?.id, propertyId]);
    if (validP.length > 0) {
      propQuery.propertyId = { $in: validP };
      agentQuery.propertyId = { $in: validP };
    } else {
      propQuery.propertyId = new mongoose.Types.ObjectId();
      agentQuery.propertyId = new mongoose.Types.ObjectId();
    }
  }
  if (category && category !== 'All') agentQuery.expenseCategory = category;
  if (fromDate && toDate) agentQuery.date = { $gte: fromDate, $lte: toDate };

  let propertyExpenses = [];
  let agentExpenses = [];

  if (expenseType !== 'Agent') {
    propertyExpenses = await Expense.find(propQuery).populate('propertyId').sort({ date: -1 });
  }
  if (expenseType !== 'Property') {
    agentExpenses = await AgentExpense.find(agentQuery)
      .populate('propertyId')
      .populate('agentId')
      .sort({ date: -1 });
  }

  const totalPropExp = propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAgentExp = agentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    reportType: 'Expense Report',
    reportDate: new Date().toISOString().split('T')[0],
    summary: {
      totalPropertyExpenses: totalPropExp,
      totalAgentExpenses: totalAgentExp,
      grandTotalExpenses: totalPropExp + totalAgentExp,
    },
    propertyExpenses: propertyExpenses.map((e) => ({
      id: e._id,
      date: e.date,
      propertyName: e.propertyId?.title || e.propertyId?.name || 'N/A',
      category: e.category,
      description: e.description,
      amount: e.amount,
      status: e.status,
    })),
    agentExpenses: agentExpenses.map((e) => ({
      id: e._id,
      date: e.date,
      propertyName: e.propertyId?.title || e.propertyId?.name || 'N/A',
      agentName: e.agentId?.fullName || 'N/A',
      category: e.expenseCategory,
      description: e.description,
      amount: e.amount,
      status: e.status,
    })),
  };
}

/**
 * 8. INCOME REPORT DATA GENERATOR
 */
async function generateIncomeReportData(filters = {}) {
  return await generatePaymentReportData(filters);
}

/**
 * 9. INVOICE REPORT DATA GENERATOR
 */
async function generateInvoiceReportData(filters = {}) {
  return await generatePaymentReportData(filters);
}

/**
 * 10. FINANCIAL SUMMARY DATA GENERATOR
 */
async function generateFinancialSummaryData(fromDate, toDate) {
  const pQuery = {};
  if (fromDate && toDate) pQuery.dueDate = { $gte: fromDate, $lte: toDate };
  const payments = await Payment.find(pQuery);

  const eQuery = {};
  if (fromDate && toDate) eQuery.date = { $gte: fromDate, $lte: toDate };
  const propertyExpenses = await Expense.find(eQuery);
  const agentExpenses = await AgentExpense.find({ ...eQuery, status: 'Approved' });

  const agentPayments = await AgentPayment.find();

  const totalRentDue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalOutstandingRent = totalRentDue - totalPaymentsReceived;

  const totalPropExp = propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAgentExp = agentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = totalPropExp + totalAgentExp;

  const totalAgentExpected = agentPayments.reduce((sum, a) => sum + (a.expectedAmount || 0), 0);
  const totalAgentReceived = agentPayments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
  const totalAgentOutstanding = agentPayments.reduce((sum, a) => sum + (a.remainingAmount || 0), 0);

  const netFinancialPosition = totalPaymentsReceived - totalExpenses;

  return {
    reportType: 'Financial Summary',
    reportDate: new Date().toISOString().split('T')[0],
    fromDate: fromDate || '',
    toDate: toDate || '',
    summary: {
      totalRentDue,
      totalRentDueFormatted: formatReportCurrency(totalRentDue),
      totalPaymentsReceived,
      totalPaymentsReceivedFormatted: formatReportCurrency(totalPaymentsReceived),
      totalOutstandingRent,
      totalOutstandingRentFormatted: formatReportCurrency(totalOutstandingRent),
      totalPropertyExpenses: totalPropExp,
      totalPropertyExpensesFormatted: formatReportCurrency(totalPropExp),
      totalAgentExpenses: totalAgentExp,
      totalAgentExpensesFormatted: formatReportCurrency(totalAgentExp),
      totalExpenses,
      totalExpensesFormatted: formatReportCurrency(totalExpenses),
      totalAgentExpected,
      totalAgentExpectedFormatted: formatReportCurrency(totalAgentExpected),
      totalAgentReceived,
      totalAgentReceivedFormatted: formatReportCurrency(totalAgentReceived),
      totalAgentOutstanding,
      totalAgentOutstandingFormatted: formatReportCurrency(totalAgentOutstanding),
      netFinancialPosition,
      netFinancialPositionFormatted: formatReportCurrency(netFinancialPosition),
    },
  };
}

async function generateMortgageReportData(filters = {}) {
  const { propertyId, landlordId, lenderName, status, fromDate, toDate } = filters;

  let query = {};
  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const pDoc = await findEntitySafely(Property, propertyId);
    const validP = filterValidObjectIds([pDoc?._id, pDoc?.id, propertyId]);
    if (validP.length > 0) query.propertyId = { $in: validP };
    else query.propertyId = new mongoose.Types.ObjectId();
  }
  if (landlordId && landlordId !== 'All' && landlordId !== 'all') {
    const lDoc = await findEntitySafely(Landlord, landlordId);
    const validL = filterValidObjectIds([lDoc?._id, lDoc?.id, landlordId]);
    if (validL.length > 0) query.landlordId = { $in: validL };
    else query.landlordId = new mongoose.Types.ObjectId();
  }
  if (status && status !== 'All') query.status = status;
  if (lenderName) query.lenderName = new RegExp(lenderName.trim(), 'i');

  if (fromDate || toDate) {
    query.startDate = {};
    if (fromDate) query.startDate.$gte = new Date(fromDate);
    if (toDate) query.startDate.$lte = new Date(toDate);
  }

  const mortgages = await Mortgage.find(query)
    .populate('propertyId', 'name address type city')
    .populate('landlordId', 'fullName email phone')
    .sort({ createdAt: -1 });

  const rows = [];
  let totalOriginalLoan = 0;
  let totalOutstanding = 0;
  let totalMonthlyPayments = 0;

  for (const m of mortgages) {
    const payments = await MortgagePayment.find({ mortgageId: m._id });
    const totalPaid = payments.reduce((sum, p) => sum + (p.totalPayment || 0), 0);

    totalOriginalLoan += m.originalLoanAmount || 0;
    totalOutstanding += m.currentOutstandingBalance || 0;
    if (m.status === 'Active') {
      totalMonthlyPayments += m.monthlyPayment || 0;
    }

    rows.push({
      mortgageId: m._id,
      propertyName: m.propertyId?.name || 'Unassigned Property',
      propertyAddress: m.propertyId?.address || '',
      landlordName: m.landlordId?.fullName || 'Unassigned Landlord',
      lenderName: m.lenderName,
      mortgageAccountNumber: m.mortgageAccountNumber || '-',
      originalLoanAmount: m.originalLoanAmount,
      originalLoanAmountFormatted: formatReportCurrency(m.originalLoanAmount),
      totalPaid,
      totalPaidFormatted: formatReportCurrency(totalPaid),
      currentOutstandingBalance: m.currentOutstandingBalance,
      currentOutstandingBalanceFormatted: formatReportCurrency(m.currentOutstandingBalance),
      monthlyPayment: m.monthlyPayment,
      monthlyPaymentFormatted: formatReportCurrency(m.monthlyPayment),
      interestRate: m.interestRate,
      startDate: m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '-',
      nextPaymentDate: m.nextPaymentDate ? new Date(m.nextPaymentDate).toISOString().split('T')[0] : '-',
      status: m.status,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    filterCount: rows.length,
    rows,
    summary: {
      totalOriginalLoan,
      totalOriginalLoanFormatted: formatReportCurrency(totalOriginalLoan),
      totalOutstanding,
      totalOutstandingFormatted: formatReportCurrency(totalOutstanding),
      totalMonthlyPayments,
      totalMonthlyPaymentsFormatted: formatReportCurrency(totalMonthlyPayments),
    },
  };
}

module.exports = {
  formatReportCurrency,
  formatUKDate,
  generateTenantStatementData,
  generateLandlordReportData,
  generateAgentReportData,
  generatePropertyReportData,
  generateUnitReportData,
  generatePaymentReportData,
  generateExpenseReportData,
  generateIncomeReportData,
  generateInvoiceReportData,
  generateFinancialSummaryData,
  generateMortgageReportData,
};
