const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Property = require('../models/Property');
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

  const strId = String(idVal).trim();

  if (mongoose.Types.ObjectId.isValid(strId)) {
    try {
      const found = await Model.findById(strId);
      if (found) return found;
    } catch (e) {}
  }

  try {
    const found = await Model.findOne({
      $or: [{ name: strId }, { title: strId }, { fullName: strId }, { propertyName: strId }, { unitName: strId }],
    });
    if (found) return found;
  } catch (e) {}

  try {
    if (Model && Model.collection) {
      const rawFound = await Model.collection.findOne({
        $or: [{ id: strId }, { name: strId }, { title: strId }],
      });
      if (rawFound) return Model.hydrate(rawFound);
    }
  } catch (e) {}

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
    .populate('agentId');

  const primaryTenancy = tenancies[0] || null;
  let property = primaryTenancy?.propertyId || null;
  let unit = property;
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

  const tenancyQueryFilter = isAll ? {} : (validPropObjectIds.length > 0 ? { propertyId: { $in: validPropObjectIds } } : { propertyId: new mongoose.Types.ObjectId() });

  const tenancies = await Tenancy.find(tenancyQueryFilter)
    .populate('customerId')
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

  // Breakdown per individual property
  const propertyBreakdown = properties.map((p) => {
    const pTenancies = tenancies.filter((t) => safeIdEquals(t.propertyId, p._id));
    const pPayments = payments.filter((pay) => safeIdEquals(pay.propertyId, p._id));
    const pPropExp = propertyExpenses.filter((e) => safeIdEquals(e.propertyId, p._id));
    const pAgentExp = agentExpenses.filter((e) => safeIdEquals(e.propertyId, p._id));

    const due = pPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const paid = pPayments.reduce((sum, pay) => sum + (pay.paidAmount || 0), 0);
    const exp = pPropExp.reduce((sum, e) => sum + (e.amount || 0), 0) + pAgentExp.reduce((sum, e) => sum + (e.amount || 0), 0);
    const isOccupied = p.status === 'Occupied' || pTenancies.length > 0;

    return {
      propertyId: p._id,
      propertyName: p.name || p.propertyName || p.title,
      propertyType: p.assetType || p.propertyType || p.type || 'Shop',
      name: p.name || p.propertyName || p.title,
      address: p.address || p.name,
      totalUnits: 1,
      occupiedUnits: isOccupied ? 1 : 0,
      availableUnits: !isOccupied ? 1 : 0,
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
      status: p.status,
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
    const pTenancy = tenancies.find((t) => safeIdEquals(t.propertyId, p._id));
    const samplePay = periodPayments.find((pay) => safeIdEquals(pay.propertyId, p._id));

    let rent = Number(pTenancy?.monthlyRent || p.monthlyRent || p.price || samplePay?.amount) || 0;
    if (rent === 0 && payments && payments.length > 0) {
      const propPay = payments.find((pay) => safeIdEquals(pay.propertyId, p._id) && pay.amount > 0);
      if (propPay) rent = propPay.amount;
    }

    const rawMFee = Number(pTenancy?.companyMonthlyAmount) || (rent > 0 ? 50 : 0);
    const mFee = rent > 0 ? -Math.abs(rawMFee) : 0;
    const dueDateStr = getOrdinalDay(pTenancy?.paymentDueDay || 1);
    const netRentReceivable = rent + mFee;

    const fullAddress = p.address ? `${p.name}, ${p.address}` : p.name;

    const collections = trackingMonths.map((mInfo) => {
      const mPay = periodPayments.find((pay) => safeIdEquals(pay.propertyId, p._id) && isPaymentInMonth(pay, mInfo));

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
      unitId: p._id,
      propertyName: p.name || p.propertyName || p.title,
      unitName: p.name || p.propertyName || '',
      propertyAddress: fullAddress,
      rent,
      mFee,
      dueDate: dueDateStr,
      netRentReceivable,
      collections,
    });
  }

  // Landlord Mortgage Facilities (counting each facility strictly ONCE)
  const mortgageQueryFilter = isAll
    ? {}
    : (validLandlordObjectIds.length > 0 ? { landlordId: { $in: validLandlordObjectIds } } : { landlordId: new mongoose.Types.ObjectId() });

  const landlordMortgages = await Mortgage.find(mortgageQueryFilter)
    .populate('properties.propertyId', 'name address')
    .populate('propertyId', 'name address')
    .sort({ createdAt: -1 });

  const activeLandlordMortgages = landlordMortgages.filter((m) => m.status === 'Active');
  const individualMortgagesCount = activeLandlordMortgages.filter(
    (m) => (m.mortgageType || 'Individual Property') === 'Individual Property'
  ).length;
  const collectiveMortgagesCount = activeLandlordMortgages.filter(
    (m) => m.mortgageType === 'Collective / Group'
  ).length;
  const totalMortgageLiability = activeLandlordMortgages.reduce((sum, m) => sum + (m.currentOutstandingBalance || 0), 0);
  const totalMortgageOriginal = activeLandlordMortgages.reduce((sum, m) => sum + (m.originalLoanAmount || 0), 0);

  const formattedLandlordMortgages = landlordMortgages.map((m) => {
    const secList = (m.properties && m.properties.length > 0)
      ? m.properties.map((p) => p.propertyId?.name || 'Property')
      : [m.propertyId?.name || 'Property'];

    return {
      mortgageId: m._id,
      mortgageReference: m.mortgageReference || m.mortgageAccountNumber || '-',
      mortgageType: m.mortgageType || 'Individual Property',
      lenderName: m.lenderName,
      securedPropertiesCount: secList.length,
      securedProperties: secList.join(', '),
      originalLoanAmount: m.originalLoanAmount,
      originalLoanAmountFormatted: formatReportCurrency(m.originalLoanAmount),
      currentOutstandingBalance: m.currentOutstandingBalance,
      currentOutstandingBalanceFormatted: formatReportCurrency(m.currentOutstandingBalance),
      monthlyPayment: m.monthlyPayment,
      monthlyPaymentFormatted: formatReportCurrency(m.monthlyPayment),
      nextPaymentDate: m.nextPaymentDate ? formatUKDate(m.nextPaymentDate) : '-',
      status: m.status,
    };
  });

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
      totalUnits: properties.length,
      occupiedUnits: properties.filter((p) => p.status === 'Occupied').length,
      availableUnits: properties.filter((p) => p.status === 'Available').length,
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
      totalMortgageFacilities: activeLandlordMortgages.length,
      individualMortgagesCount,
      collectiveMortgagesCount,
      totalMortgageLiability,
      totalMortgageLiabilityFormatted: formatReportCurrency(totalMortgageLiability),
      totalMortgageOriginal,
      totalMortgageOriginalFormatted: formatReportCurrency(totalMortgageOriginal),
    },
    propertiesBreakdown: propertyBreakdown,
    properties: propertyBreakdown,
    mortgages: formattedLandlordMortgages,
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
    .populate('tenantId')
    .sort({ billingYear: -1, billingMonth: -1 });

  const assignedTenancyQuery = isAll ? { status: 'Active' } : { agentId: agent._id, status: 'Active' };
  const assignedTenancies = await Tenancy.find(assignedTenancyQuery)
    .populate('propertyId')
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
      assignedPropertiesCount: assignedTenancies.length,
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
      unit: s.propertyId?.name || 'N/A',
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
    properties = await Property.find({ isArchived: { $ne: true } }).populate('landlordId');
    property = {
      _id: 'all_props',
      name: 'All Properties Portfolio',
      title: 'All Properties Portfolio',
      landlordName: properties[0]?.landlordId?.fullName || 'Portfolio Manager',
    };
  } else {
    property = await findEntitySafely(Property, propertyId);
    if (!property) {
      property = {
        _id: propertyId,
        name: typeof propertyId === 'string' ? propertyId : 'Selected Property',
        title: typeof propertyId === 'string' ? propertyId : 'Selected Property',
        landlordName: 'Property Manager',
      };
    } else if (property.landlordId && mongoose.Types.ObjectId.isValid(property.landlordId)) {
      const l = await Landlord.findById(property.landlordId);
      property.landlordName = l?.fullName || 'Landlord';
      property.landlordLogo = l?.logo?.url || '';
    }
    properties = [property];
  }

  const propIds = properties.map((p) => p._id).filter(Boolean);

  let pQuery = { propertyId: { $in: propIds } };
  let eQuery = { propertyId: { $in: propIds } };
  if (fromDate && toDate) {
    pQuery.dueDate = { $gte: fromDate, $lte: toDate };
    eQuery.date = { $gte: fromDate, $lte: toDate };
  }

  const payments = await Payment.find(pQuery).populate('customerId').sort({ dueDate: -1 });
  const propertyExpenses = await Expense.find(eQuery);
  const agentExpenses = await AgentExpense.find({ ...eQuery, status: 'Approved' });

  const tenancies = await Tenancy.find({ propertyId: { $in: propIds } })
    .populate('customerId')
    .populate('agentId');

  const totalRent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalExpenses =
    propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) +
    agentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3-Month Collection Tracker Matrix
  const trackingMonths = getRecent3Months(toDate);
  const periodPayments = payments;

  let rowCounter = 1;
  const unitMatrixRows = [];

  for (const p of properties) {
    const pTenancy = tenancies.find((t) => safeIdEquals(t.propertyId, p._id));
    const samplePay = periodPayments.find((pay) => safeIdEquals(pay.propertyId, p._id));

    let rent = Number(pTenancy?.monthlyRent || p.monthlyRent || p.price || samplePay?.amount) || 0;
    const rawMFee = Number(pTenancy?.companyMonthlyAmount) || (rent > 0 ? 50 : 0);
    const mFee = rent > 0 ? -Math.abs(rawMFee) : 0;
    const dueDateStr = getOrdinalDay(pTenancy?.paymentDueDay || 1);
    const netRentReceivable = rent + mFee;

    const fullAddress = p.address ? `${p.name}, ${p.address}` : (p.name || 'Property');

    const collections = trackingMonths.map((mInfo) => {
      const mPay = periodPayments.find((pay) => safeIdEquals(pay.propertyId, p._id) && isPaymentInMonth(pay, mInfo));

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
      unitId: p._id,
      propertyName: p.name || p.propertyName || p.title,
      unitName: p.name || p.propertyName || '',
      propertyAddress: fullAddress,
      rent,
      mFee,
      dueDate: dueDateStr,
      netRentReceivable,
      collections,
    });
  }

  // Fetch mortgages securing any of these properties
  const propMortgages = await Mortgage.find({
    $or: [{ propertyId: { $in: propIds } }, { 'properties.propertyId': { $in: propIds } }],
    status: { $ne: 'Closed' },
  }).populate('properties.propertyId', 'name');

  const individualBreakdown = properties.map((p) => {
    const activeTenancy = tenancies.find(
      (t) => safeIdEquals(t.propertyId, p._id) && t.status === 'Active'
    );
    const isOccupied = p.status === 'Occupied' || Boolean(activeTenancy);

    const m = propMortgages.find(
      (mtg) => safeIdEquals(mtg.propertyId, p._id) || (mtg.properties || []).some((item) => safeIdEquals(item.propertyId, p._id))
    );

    let mortgageInfo = null;
    if (m) {
      const isCollective = m.mortgageType === 'Collective / Group';
      const allocItem = (m.properties || []).find((item) => safeIdEquals(item.propertyId, p._id));
      const otherSecured = (m.properties || [])
        .filter((item) => !safeIdEquals(item.propertyId, p._id))
        .map((item) => item.propertyId?.name || 'Property')
        .filter(Boolean);

      mortgageInfo = {
        mortgageId: m._id,
        mortgageReference: m.mortgageReference || m.mortgageAccountNumber || '-',
        mortgageType: m.mortgageType || 'Individual Property',
        isCollective,
        lenderName: m.lenderName,
        facilityOriginalAmount: m.originalLoanAmount,
        facilityOriginalAmountFormatted: formatReportCurrency(m.originalLoanAmount),
        facilityOutstandingBalance: m.currentOutstandingBalance,
        facilityOutstandingBalanceFormatted: formatReportCurrency(m.currentOutstandingBalance),
        allocatedAmount: allocItem?.allocatedAmount || 0,
        allocatedAmountFormatted: allocItem?.allocatedAmount ? formatReportCurrency(allocItem.allocatedAmount) : null,
        securedWith: otherSecured,
        monthlyPayment: m.monthlyPayment,
        monthlyPaymentFormatted: formatReportCurrency(m.monthlyPayment),
        status: m.status,
      };
    }

    return {
      unitId: p._id,
      propertyId: p._id,
      name: p.name || p.propertyName,
      propertyName: p.name || p.propertyName,
      type: p.assetType || p.propertyType || p.type || 'Shop',
      status: p.isArchived ? 'Archived' : (isOccupied ? 'Occupied' : p.status),
      tenantName: activeTenancy?.customerId?.fullName || activeTenancy?.customerId?.name || p.customerName || 'Vacant',
      agentName: activeTenancy?.agentId?.fullName || activeTenancy?.agentId?.name || 'Direct / None',
      monthlyRent: activeTenancy?.monthlyRent || p.monthlyRent || p.price || 0,
      companyMonthlyAmount: activeTenancy?.companyMonthlyAmount || 0,
      mortgageInfo,
    };
  });

  const singlePropMortgageInfo = individualBreakdown.length === 1 ? individualBreakdown[0].mortgageInfo : null;

  return {
    reportType: 'Property Report',
    reportDate: new Date().toISOString().split('T')[0],
    fromDate: fromDate || '',
    toDate: toDate || '',
    property: {
      id: property._id,
      name: property.name || property.propertyName || property.title,
      address: property.address || '',
      type: property.assetType || property.propertyType || property.type || 'Shop',
      landlordName: property.landlordName || property.landlordId?.fullName || 'Portfolio Manager',
      landlordLogo: property.landlordLogo || property.landlordId?.logo?.url || '',
      mortgageInfo: singlePropMortgageInfo,
    },
    summary: {
      totalProperties: properties.length,
      totalUnits: properties.length,
      occupiedUnits: properties.filter((p) => p.status === 'Occupied').length,
      availableUnits: properties.filter((p) => p.status === 'Available').length,
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
    unitsBreakdown: individualBreakdown,
    units: individualBreakdown,
    propertiesBreakdown: individualBreakdown,
    unitMatrixRows,
    trackingMonths: trackingMonths.map((m) => m.label),
  };
}

/**
 * 5. UNIT REPORT DATA GENERATOR (Converted to Property Report)
 */
async function generateUnitReportData(propertyOrUnitId, fromDate, toDate) {
  return generatePropertyReportData(propertyOrUnitId, fromDate, toDate);
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
      propertyName: p.propertyId?.name || p.propertyId?.propertyName || p.propertyId?.title || 'N/A',
      unitName: p.propertyId?.name || p.propertyId?.propertyName || 'N/A',
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
  const { propertyId, landlordId, lenderName, status, mortgageType, fromDate, toDate } = filters;

  let query = {};
  if (propertyId && propertyId !== 'All' && propertyId !== 'all') {
    const pDoc = await findEntitySafely(Property, propertyId);
    const validP = filterValidObjectIds([pDoc?._id, pDoc?.id, propertyId]);
    if (validP.length > 0) {
      query.$or = [{ propertyId: { $in: validP } }, { 'properties.propertyId': { $in: validP } }];
    } else {
      query.propertyId = new mongoose.Types.ObjectId();
    }
  }
  if (landlordId && landlordId !== 'All' && landlordId !== 'all') {
    const lDoc = await findEntitySafely(Landlord, landlordId);
    const validL = filterValidObjectIds([lDoc?._id, lDoc?.id, landlordId]);
    if (validL.length > 0) query.landlordId = { $in: validL };
    else query.landlordId = new mongoose.Types.ObjectId();
  }
  if (status && status !== 'All') query.status = status;
  if (mortgageType && mortgageType !== 'All') query.mortgageType = mortgageType;
  if (lenderName) query.lenderName = new RegExp(lenderName.trim(), 'i');

  if (fromDate || toDate) {
    query.startDate = {};
    if (fromDate) query.startDate.$gte = new Date(fromDate);
    if (toDate) query.startDate.$lte = new Date(toDate);
  }

  const mortgages = await Mortgage.find(query)
    .populate('propertyId', 'name address type city')
    .populate('properties.propertyId', 'name address type city')
    .populate('landlordId', 'fullName email phone')
    .sort({ createdAt: -1 });

  const rows = [];
  let totalOriginalLoan = 0;
  let totalOutstanding = 0;
  let totalMonthlyPayments = 0;

  for (const m of mortgages) {
    const payments = await MortgagePayment.find({ mortgageId: m._id });
    const totalPaid = payments.reduce((sum, p) => sum + (p.totalPayment || 0), 0);

    // Each mortgage facility is counted strictly once
    totalOriginalLoan += m.originalLoanAmount || 0;
    totalOutstanding += m.currentOutstandingBalance || 0;
    if (m.status === 'Active') {
      totalMonthlyPayments += m.monthlyPayment || 0;
    }

    const securedPropsList = (m.properties && m.properties.length > 0)
      ? m.properties.map((p) => ({
          propertyId: p.propertyId?._id || p.propertyId,
          name: p.propertyId?.name || 'Property',
          address: p.propertyId?.address || '',
          allocatedAmount: p.allocatedAmount || 0,
          allocatedAmountFormatted: p.allocatedAmount ? formatReportCurrency(p.allocatedAmount) : '-',
          status: p.status || 'Active',
        }))
      : [
          {
            propertyId: m.propertyId?._id || m.propertyId,
            name: m.propertyId?.name || 'Unassigned Property',
            address: m.propertyId?.address || '',
            allocatedAmount: m.originalLoanAmount || 0,
            allocatedAmountFormatted: formatReportCurrency(m.originalLoanAmount),
            status: 'Active',
          },
        ];

    const propNameDisplay = securedPropsList.map((p) => p.name).join(', ');

    rows.push({
      mortgageId: m._id,
      mortgageReference: m.mortgageReference || m.mortgageAccountNumber || '-',
      mortgageType: m.mortgageType || 'Individual Property',
      propertyName: propNameDisplay,
      propertyAddress: securedPropsList[0]?.address || '',
      securedPropertiesCount: securedPropsList.length,
      securedProperties: securedPropsList,
      landlordName: m.landlordId?.fullName || 'Unassigned Landlord',
      lenderName: m.lenderName,
      mortgageAccountNumber: m.mortgageAccountNumber || m.mortgageReference || '-',
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
