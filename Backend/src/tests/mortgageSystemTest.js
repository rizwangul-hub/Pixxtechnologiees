const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Property = require('../models/Property');
const Landlord = require('../models/Landlord');
const Mortgage = require('../models/Mortgage');
const MortgagePayment = require('../models/MortgagePayment');
const {
  createMortgage,
  getMortgages,
  getMortgageSummary,
  getUpcomingMortgagePayments,
  getMortgageById,
  recordMortgagePayment,
  deleteMortgage,
} = require('../controllers/mortgageController');
const { generateMortgageReportData } = require('../services/reportDataService');

async function runMortgageSystemTests() {
  console.log('================================================================');
  console.log('🧪 Starting Comprehensive Mortgage Management System Tests');
  console.log('================================================================\n');

  let testPassed = 0;
  let testFailed = 0;

  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // 1. Setup Test Landlord & Property
    const testLandlord = await Landlord.create({
      fullName: 'Southend Properties Ltd (Test)',
      email: 'landlord.mortgage.test@example.com',
      phone: '+44 20 7946 0912',
    });

    const testProperty = await Property.create({
      name: '127 Southend Road (Test)',
      type: 'Residential',
      address: '127 Southend Road',
      city: 'London',
      landlordId: testLandlord._id,
    });

    console.log(`📌 Test Landlord created: ${testLandlord.fullName} (${testLandlord._id})`);
    console.log(`📌 Test Property created: ${testProperty.name} (${testProperty._id})\n`);

    // Helper mock response object
    const mockRes = () => {
      const res = {};
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };
      res.json = function (data) {
        this.responseData = data;
        return this;
      };
      return res;
    };

    // TEST 1: Create Mortgage
    console.log('--- Test 1: Create New Mortgage ---');
    const req1 = {
      body: {
        propertyId: testProperty._id.toString(),
        lenderName: 'Barclays Bank (Test)',
        mortgageAccountNumber: 'MTG-2026-99',
        originalLoanAmount: 240000,
        currentOutstandingBalance: 198500,
        interestRate: 4.5,
        monthlyPayment: 1200,
        paymentFrequency: 'Monthly',
        startDate: '2024-01-01',
        nextPaymentDate: '2026-09-15',
        status: 'Active',
        notes: 'Test mortgage record for automated suite',
      },
    };
    const res1 = mockRes();
    await createMortgage(req1, res1);

    if (res1.statusCode === 201 && res1.responseData?.success) {
      console.log('✅ PASS: Mortgage record created successfully.');
      console.log(`   ID: ${res1.responseData.data._id} | Outstanding: £${res1.responseData.data.currentOutstandingBalance}`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Failed to create mortgage:', res1.responseData);
      testFailed++;
    }
    const createdMortgageId = res1.responseData?.data?._id?.toString();

    // TEST 2: Fetch Mortgages List & Summary
    console.log('\n--- Test 2: Fetch Mortgages List & Summary ---');
    const req2 = { query: { propertyId: testProperty._id.toString() } };
    const res2 = mockRes();
    await getMortgages(req2, res2);

    const res2Summary = mockRes();
    await getMortgageSummary({}, res2Summary);

    if (res2.responseData?.success && res2.responseData.data.length > 0 && res2Summary.responseData?.success) {
      console.log(`✅ PASS: Retrieved ${res2.responseData.data.length} mortgage(s) for test property.`);
      console.log(`   Summary Total Outstanding: £${res2Summary.responseData.data.totalOutstanding}`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Failed to fetch mortgage list or summary');
      testFailed++;
    }

    // TEST 3: Record Payment with Principal Breakdown (£1,200 total, £700 principal, £500 interest)
    console.log('\n--- Test 3: Record Payment with Principal Breakdown (£700 Principal) ---');
    const req3 = {
      params: { id: createdMortgageId },
      body: {
        paymentDate: '2026-09-15',
        totalPayment: 1200,
        principalAmount: 700,
        interestAmount: 500,
        paymentMethod: 'Direct Debit',
        reference: 'REF-BARC-001',
      },
    };
    const res3 = mockRes();
    await recordMortgagePayment(req3, res3);

    if (res3.statusCode === 201 && res3.responseData?.updatedBalance === 197800) {
      console.log(`✅ PASS: Payment recorded cleanly. New Outstanding Balance: £${res3.responseData.updatedBalance} (Expected £197,800).`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Payment calculation mismatch:', res3.responseData);
      testFailed++;
    }

    // TEST 4: Record Payment without Principal Breakdown (Total Payment £800 deducted directly)
    console.log('\n--- Test 4: Record Payment without Principal Breakdown (£800 total) ---');
    const req4 = {
      params: { id: createdMortgageId },
      body: {
        paymentDate: '2026-10-15',
        totalPayment: 800,
        paymentMethod: 'Bank Transfer',
      },
    };
    const res4 = mockRes();
    await recordMortgagePayment(req4, res4);

    if (res4.statusCode === 201 && res4.responseData?.updatedBalance === 197000) {
      console.log(`✅ PASS: Total payment deducted directly. New Outstanding Balance: £${res4.responseData.updatedBalance} (Expected £197,000).`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Total payment fallback calculation mismatch:', res4.responseData);
      testFailed++;
    }

    // TEST 5: Negative Balance Protection Validation
    console.log('\n--- Test 5: Negative Balance Protection Validation ---');
    const req5 = {
      params: { id: createdMortgageId },
      body: {
        paymentDate: '2026-11-15',
        totalPayment: 500000, // Exceeds balance of £197,000
      },
    };
    const res5 = mockRes();
    await recordMortgagePayment(req5, res5);

    if (res5.statusCode === 400 && !res5.responseData?.success) {
      console.log(`✅ PASS: System correctly blocked overpayment attempt with error message: "${res5.responseData.message}".`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Negative balance validation failed to block overpayment');
      testFailed++;
    }

    // TEST 6: Pay Off Mortgage when Balance reaches £0
    console.log('\n--- Test 6: Final Pay Off to £0 ---');
    const req6 = {
      params: { id: createdMortgageId },
      body: {
        paymentDate: '2026-12-15',
        totalPayment: 197000,
        principalAmount: 197000,
      },
    };
    const res6 = mockRes();
    await recordMortgagePayment(req6, res6);

    if (res6.statusCode === 201 && res6.responseData?.updatedBalance === 0 && res6.responseData?.mortgageStatus === 'Paid Off') {
      console.log('✅ PASS: Mortgage balance reached £0 and status automatically updated to "Paid Off".');
      testPassed++;
    } else {
      console.error('❌ FAIL: Paid off state transition failed:', res6.responseData);
      testFailed++;
    }

    // TEST 7: Generate Mortgage Report Data
    console.log('\n--- Test 7: Generate Mortgage Report Data ---');
    const reportData = await generateMortgageReportData({ propertyId: testProperty._id.toString() });

    if (reportData && Array.isArray(reportData.rows) && reportData.rows.length > 0) {
      console.log(`✅ PASS: Mortgage report generated ${reportData.rows.length} row(s).`);
      console.log(`   Property: ${reportData.rows[0].propertyName} | Lender: ${reportData.rows[0].lenderName} | Total Paid: ${reportData.rows[0].totalPaidFormatted}`);
      testPassed++;
    } else {
      console.error('❌ FAIL: Failed to generate mortgage report data');
      testFailed++;
    }

    // CLEANUP
    console.log('\n--- Test Cleanup ---');
    await Mortgage.findByIdAndDelete(createdMortgageId);
    await MortgagePayment.deleteMany({ mortgageId: createdMortgageId });
    await Property.findByIdAndDelete(testProperty._id);
    await Landlord.findByIdAndDelete(testLandlord._id);
    console.log('✅ Cleaned up test mortgage, payment history, property, and landlord records.');

    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('================================================================\n');

    await mongoose.disconnect();
    process.exit(testFailed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ CRITICAL TEST SUITE ERROR:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runMortgageSystemTests();
