const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Tenancy = require('../models/Tenancy');
const Customer = require('../models/Customer');
const Property = require('../models/Property');
const Unit = Property; // Architecture refactor: individual property IS the unit
const Landlord = require('../models/Landlord');
const Agent = require('../models/Agent');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const Expense = require('../models/Expense');
const Mortgage = require('../models/Mortgage');
const MortgagePayment = require('../models/MortgagePayment');
const TransactionLedger = require('../models/TransactionLedger');
const { generateMonthlyAgentSettlements, recalculateAgentPayment } = require('../services/agentSettlementService');
const { runFinancialReconciliation } = require('../services/financialReconciliationService');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixx_technologies';

async function runFinancialLedgerTests() {
  console.log('\n================================================================');
  console.log('🧪 Starting Unified Financial & Ledger System Integration Tests');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedTests++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Setup Test Data
    const landlord = await Landlord.create({
      fullName: 'Financier Landlord Ltd (Test)',
      email: `fin.landlord.${Date.now()}@example.com`,
      country: 'United Kingdom',
    });

    const property = await Property.create({
      name: 'Financial Ledger Plaza (Test)',
      type: 'Commercial',
      address: '100 Bank Street',
      city: 'London',
      landlordId: landlord._id,
    });

    const unit = await Unit.create({
      propertyId: property._id,
      name: 'Suite 500',
      price: 60000,
      priceType: 'monthly_rent',
      status: 'Occupied',
    });

    const tenant = await Customer.create({
      name: 'High Value Corporate Tenant (Test)',
      phone: '+44 20 7946 0999',
      email: `corp.tenant.${Date.now()}@example.com`,
      cnicOrReg: 'REG-889900',
      city: 'London',
    });

    const agent = await Agent.create({
      fullName: 'Premier Managing Agent (Test)',
      phone: '+44 20 7946 0888',
      email: `agent.${Date.now()}@example.com`,
      country: 'United Kingdom',
      region: 'London',
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const billingYear = now.getFullYear();
    const billingMonth = now.getMonth() + 1;

    // Step 1: Create Tenancy
    // Tenant Rent = £60,000, Company Monthly Amount from Agent = £50,000
    console.log('--- Test 1: Create Tenancy (Tenant Rent: £60,000, Company Amount: £50,000) ---');
    const tenancy = await Tenancy.create({
      customerId: tenant._id,
      propertyId: property._id,
      unitId: unit._id,
      agentId: agent._id,
      monthlyRent: 60000,
      companyMonthlyAmount: 50000,
      agentPaymentDueDay: 1,
      startDate: todayStr,
      status: 'Active',
    });
    assert(tenancy._id, 'Active Tenancy created successfully');

    // Step 2: Generate Settlement & Verify Expected Amount = £50,000
    console.log('\n--- Test 2: Verify Initial Agent Settlement ---');
    await generateMonthlyAgentSettlements();
    let settlement = await AgentPayment.findOne({
      tenancyId: tenancy._id,
      billingMonth,
      billingYear,
    });
    assert(settlement !== null, 'Agent Settlement record automatically generated');
    assert(settlement.expectedAmount === 50000, 'Expected Company Amount is £50,000');
    assert(settlement.expenseAmount === 0, 'Initial Expense Amount is £0');
    assert(settlement.netAmount === 50000, 'Initial Net Amount Due is £50,000');
    assert(settlement.remainingAmount === 50000, 'Initial Remaining Outstanding is £50,000');
    assert(settlement.status === 'Pending' || settlement.status === 'Overdue', `Initial Settlement Status is ${settlement.status}`);

    // Step 3: Add PENDING Agent Expense (£5,000) -> Verify Net Amount remains £50,000
    console.log('\n--- Test 3: Create Pending Agent Expense (£5,000) ---');
    const pendingExpense = await AgentExpense.create({
      agentId: agent._id,
      tenancyId: tenancy._id,
      propertyId: property._id,
      unitId: unit._id,
      tenantId: tenant._id,
      expenseCategory: 'Maintenance',
      description: 'Pending Plumbing Repair Request',
      amount: 5000,
      date: todayStr,
      billingMonth,
      billingYear,
      status: 'Pending',
    });
    await recalculateAgentPayment(settlement._id);
    settlement = await AgentPayment.findById(settlement._id);
    assert(settlement.expenseAmount === 0, 'Pending expense is NOT deducted from settlement (Expenses = £0)');
    assert(settlement.netAmount === 50000, 'Net Amount Due remains £50,000 while expense is Pending');

    // Step 4: Approve Agent Expense (£5,000) -> Verify Net Amount becomes £45,000
    console.log('\n--- Test 4: Approve Agent Expense (£5,000) ---');
    pendingExpense.status = 'Approved';
    await pendingExpense.save();
    await TransactionLedger.create({
      transactionType: 'AgentExpenseDeduction',
      entryType: 'Debit',
      amount: 5000,
      date: todayStr,
      propertyId: property._id,
      unitId: unit._id,
      tenantId: tenant._id,
      tenancyId: tenancy._id,
      agentId: agent._id,
      relatedExpenseId: pendingExpense._id,
      description: 'Approved Plumbing Repair Expense',
      status: 'Active',
    });

    await recalculateAgentPayment(settlement._id);
    settlement = await AgentPayment.findById(settlement._id);
    assert(settlement.expenseAmount === 5000, 'Approved expense (£5,000) included in settlement');
    assert(settlement.netAmount === 45000, 'Net Amount Due automatically updated to £45,000 (£50,000 - £5,000)');
    assert(settlement.remainingAmount === 45000, 'Remaining Outstanding updated to £45,000');

    // Step 5: Partial Payment 1 (£40,000) -> Received £40,000, Remaining £5,000, Status Partially Paid
    console.log('\n--- Test 5: Partial Payment 1 (£40,000) ---');
    settlement.paidAmount = 40000;
    settlement.paidDate = todayStr;
    settlement.payments.push({
      amount: 40000,
      date: todayStr,
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-PARTIAL-001',
    });
    await settlement.save();

    await TransactionLedger.create({
      transactionType: 'AgentPayment',
      entryType: 'Credit',
      amount: 40000,
      date: todayStr,
      propertyId: property._id,
      unitId: unit._id,
      tenantId: tenant._id,
      tenancyId: tenancy._id,
      agentId: agent._id,
      relatedSettlementId: settlement._id,
      description: 'Partial Bank Transfer from Agent',
      reference: 'TXN-PARTIAL-001',
      paymentMethod: 'Bank Transfer',
      status: 'Active',
    });

    await recalculateAgentPayment(settlement._id);
    settlement = await AgentPayment.findById(settlement._id);
    assert(settlement.paidAmount === 40000, 'Total Paid Amount is £40,000');
    assert(settlement.remainingAmount === 5000, 'Remaining Outstanding is £5,000 (£45,000 - £40,000)');
    assert(settlement.status === 'Partially Paid', 'Status updated to Partially Paid');
    assert(settlement.payments.length === 1, 'Partial payments history array records 1 payment item');

    // Step 6: Partial Payment 2 (£5,000) -> Received £45,000, Remaining £0, Status Paid
    console.log('\n--- Test 6: Final Payment 2 (£5,000) ---');
    settlement.paidAmount = 45000;
    settlement.payments.push({
      amount: 5000,
      date: todayStr,
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-FINAL-002',
    });
    await settlement.save();

    await TransactionLedger.create({
      transactionType: 'AgentPayment',
      entryType: 'Credit',
      amount: 5000,
      date: todayStr,
      propertyId: property._id,
      unitId: unit._id,
      tenantId: tenant._id,
      tenancyId: tenancy._id,
      agentId: agent._id,
      relatedSettlementId: settlement._id,
      description: 'Final Settlement Payment from Agent',
      reference: 'TXN-FINAL-002',
      paymentMethod: 'Bank Transfer',
      status: 'Active',
    });

    await recalculateAgentPayment(settlement._id);
    settlement = await AgentPayment.findById(settlement._id);
    assert(settlement.paidAmount === 45000, 'Total Paid Amount is £45,000');
    assert(settlement.remainingAmount === 0, 'Remaining Outstanding is £0');
    assert(settlement.status === 'Paid', 'Status updated to Paid');
    assert(settlement.payments.length === 2, 'Partial payments history array records 2 payment items');

    // Step 7: Property Expense & Mortgage Payment Isolation Test
    console.log('\n--- Test 7: Verify Property Expense & Mortgage Payment Isolation ---');
    const propExpense = await Expense.create({
      propertyId: property._id,
      unitId: unit._id,
      category: 'Repairs',
      description: 'Building Boiler Repair (Company Paid)',
      amount: 1500,
      remainingAmount: 1500,
      date: todayStr,
    });
    assert(propExpense._id, 'Property Expense (£1,500) recorded');

    const mortgage = await Mortgage.create({
      propertyId: property._id,
      landlordId: landlord._id,
      lenderName: 'Barclays Mortgage (Test)',
      originalLoanAmount: 300000,
      currentOutstandingBalance: 300000,
      interestRate: 4.5,
      monthlyPayment: 1200,
      paymentFrequency: 'Monthly',
      startDate: todayStr,
      nextPaymentDate: todayStr,
    });
    assert(mortgage._id, 'Property Mortgage (£300,000) created');

    const mortgagePayment = await MortgagePayment.create({
      mortgageId: mortgage._id,
      propertyId: property._id,
      landlordId: landlord._id,
      paymentDate: todayStr,
      totalPayment: 1200,
      principalAmount: 800,
      interestAmount: 400,
      remainingBalance: 299200,
    });
    assert(mortgagePayment._id, 'Mortgage Payment (£1,200) recorded');

    // Verify Agent Settlement remains completely unaffected
    settlement = await AgentPayment.findById(settlement._id);
    assert(settlement.expectedAmount === 50000, 'Agent Expected Amount is still £50,000');
    assert(settlement.netAmount === 45000, 'Agent Net Amount is still £45,000');
    assert(settlement.remainingAmount === 0, 'Agent Outstanding is still £0 (Property Expense/Mortgage did not leak)');

    // Step 8: Run Reconciliation Service Audit
    console.log('\n--- Test 8: Backend Financial Reconciliation Audit ---');
    const reconciliationReport = await runFinancialReconciliation();
    assert(reconciliationReport.status === 'HEALTHY', 'Financial Reconciliation Audit status is HEALTHY');
    assert(reconciliationReport.issuesCount === 0, '0 financial discrepancies detected across the entire ledger');

    // Test Cleanup
    console.log('\n--- Test Cleanup ---');
    await TransactionLedger.deleteMany({ propertyId: property._id });
    await AgentPayment.deleteMany({ propertyId: property._id });
    await AgentExpense.deleteMany({ propertyId: property._id });
    await Expense.deleteMany({ propertyId: property._id });
    await MortgagePayment.deleteMany({ mortgageId: mortgage._id });
    await Mortgage.deleteMany({ propertyId: property._id });
    await Tenancy.deleteMany({ propertyId: property._id });
    await Unit.deleteMany({ propertyId: property._id });
    await Customer.deleteMany({ _id: tenant._id });
    await Agent.deleteMany({ _id: agent._id });
    await Property.deleteMany({ _id: property._id });
    await Landlord.deleteMany({ _id: landlord._id });
    console.log('✅ Cleaned up all test financial records.\n');

    console.log('================================================================');
    console.log(`📊 FINANCIAL TEST SUITE SUMMARY: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ CRITICAL TEST SUITE ERROR:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runFinancialLedgerTests();
