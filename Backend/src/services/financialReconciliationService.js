const TransactionLedger = require('../models/TransactionLedger');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const MortgagePayment = require('../models/MortgagePayment');
const Tenancy = require('../models/Tenancy');

/**
 * Helper to record an immutable transaction in the central ledger
 */
async function recordLedgerTransaction({
  transactionType,
  entryType,
  amount,
  date,
  propertyId,
  unitId,
  tenantId,
  tenancyId,
  agentId,
  landlordId,
  mortgageId,
  relatedPaymentId,
  relatedExpenseId,
  relatedSettlementId,
  description,
  reference,
  paymentMethod = 'Bank Transfer',
  createdBy,
}) {
  if (!amount || amount <= 0) return null;

  return await TransactionLedger.create({
    transactionType,
    entryType,
    amount: Math.abs(amount),
    date: date || new Date().toISOString().split('T')[0],
    propertyId,
    unitId,
    tenantId,
    tenancyId,
    agentId,
    landlordId,
    mortgageId,
    relatedPaymentId,
    relatedExpenseId,
    relatedSettlementId,
    description: description || '',
    reference: reference || '',
    paymentMethod,
    status: 'Active',
    createdBy,
  });
}

/**
 * Helper to safely void/reverse a ledger entry
 */
async function reverseLedgerTransaction(ledgerId, managerId, reason = 'Transaction reversed') {
  const record = await TransactionLedger.findById(ledgerId);
  if (!record || record.status !== 'Active') return null;

  record.status = 'Reversed';
  record.reversedBy = managerId;
  record.reversalReason = reason;
  record.reversedAt = new Date();
  await record.save();

  // Create an offsetting entry in the ledger for audit trail
  const reversalEntryType = record.entryType === 'Credit' ? 'Debit' : 'Credit';
  return await TransactionLedger.create({
    transactionType: 'Correction',
    entryType: reversalEntryType,
    amount: record.amount,
    date: new Date().toISOString().split('T')[0],
    propertyId: record.propertyId,
    unitId: record.unitId,
    tenantId: record.tenantId,
    tenancyId: record.tenancyId,
    agentId: record.agentId,
    landlordId: record.landlordId,
    mortgageId: record.mortgageId,
    relatedPaymentId: record.relatedPaymentId,
    relatedExpenseId: record.relatedExpenseId,
    relatedSettlementId: record.relatedSettlementId,
    description: `Reversal of ${record.transactionType}: ${reason}`,
    reference: record.reference ? `REV-${record.reference}` : 'REVERSAL',
    paymentMethod: record.paymentMethod,
    status: 'Active',
    createdBy: managerId,
  });
}

/**
 * Comprehensive Backend Financial Reconciliation & Integrity Health Check
 */
async function runFinancialReconciliation() {
  const issues = [];

  // 1. Audit Agent Settlements
  const settlements = await AgentPayment.find({});
  let totalAgentExpected = 0;
  let totalAgentExpenses = 0;
  let totalAgentNet = 0;
  let totalAgentReceived = 0;
  let totalAgentOutstanding = 0;

  for (const s of settlements) {
    const expected = s.expectedAmount || 0;
    const expenses = s.expenseAmount || 0;
    const expectedNet = Math.max(0, expected - expenses);
    const paid = s.paidAmount || 0;
    const expectedRemaining = Math.max(0, expectedNet - paid);

    totalAgentExpected += expected;
    totalAgentExpenses += expenses;
    totalAgentNet += s.netAmount || 0;
    totalAgentReceived += paid;
    totalAgentOutstanding += s.remainingAmount || 0;

    // Formula Checks
    if (Math.abs(s.netAmount - expectedNet) > 0.01) {
      issues.push(`Settlement ID ${s._id}: Net amount (${s.netAmount}) does not match expected - expenses (${expectedNet})`);
    }

    if (Math.abs(s.remainingAmount - expectedRemaining) > 0.01) {
      issues.push(`Settlement ID ${s._id}: Remaining amount (${s.remainingAmount}) does not match net - paid (${expectedRemaining})`);
    }

    if (s.remainingAmount < 0 || s.netAmount < 0 || s.paidAmount < 0) {
      issues.push(`Settlement ID ${s._id}: Negative balance detected (net: ${s.netAmount}, remaining: ${s.remainingAmount})`);
    }
  }

  // 2. Audit Property Expenses
  const propertyExpenses = await Expense.find({});
  const totalPropertyExpenses = propertyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3. Audit Mortgage Payments
  const mortgagePayments = await MortgagePayment.find({});
  const totalMortgagePayments = mortgagePayments.reduce((sum, mp) => sum + (mp.totalPayment || mp.amountPaid || 0), 0);

  // 4. Audit Central Ledger
  const ledgerEntries = await TransactionLedger.find({ status: 'Active' });

  return {
    success: true,
    status: issues.length === 0 ? 'HEALTHY' : 'DISCREPANCIES_DETECTED',
    issuesCount: issues.length,
    issues,
    metrics: {
      totalLedgerTransactions: ledgerEntries.length,
      totalAgentSettlements: settlements.length,
      totalAgentExpected,
      totalAgentExpenses,
      totalAgentNet,
      totalAgentReceived,
      totalAgentOutstanding,
      totalPropertyExpenses,
      totalMortgagePayments,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  recordLedgerTransaction,
  reverseLedgerTransaction,
  runFinancialReconciliation,
};
