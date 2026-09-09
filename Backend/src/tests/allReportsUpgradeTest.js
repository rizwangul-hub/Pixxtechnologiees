const pdfGenerators = require('../services/pdfReportGenerator');
const wordGenerators = require('../services/wordReportGenerator');
const excelGenerators = require('../services/excelReportGenerator');

async function runAllReportsUpgradeTest() {
  console.log('================================================================');
  console.log('🧪 TESTING ALL 11 REPORT GENERATORS (PDF, WORD, EXCEL)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // Mock Report Data
  const mockTenantStatement = {
    reportType: 'Tenant Statement',
    statementDate: '09/09/2026',
    fromDate: '01/09/2025',
    toDate: '09/09/2026',
    landlord: { name: 'Old Street Holdings Ltd', logoUrl: '' },
    tenant: { name: 'PENNS INC. LTD', address: '15 Manor Close, Dagenham, RM10 8BH' },
    property: { name: '127 Southend Road', address: 'Rochford, Essex, SS4 1HX' },
    summary: {
      balanceForward: 2849.16,
      balanceForwardFormatted: '£2,849.16',
      totalRentDue: 21666.71,
      totalRentDueFormatted: '£21,666.71',
      totalPayments: 19676.68,
      totalPaymentsFormatted: '£19,676.68',
      totalOutstanding: 4839.19,
      totalOutstandingFormatted: '£4,839.19',
    },
    transactions: [
      { date: '01/09/2025', reference: 'INV-001', description: 'Rent Charge', payee: 'PENNS INC.', debitFormatted: '£1,800.00', creditFormatted: '', balanceFormatted: '£4,649.16' },
      { date: '05/09/2025', reference: 'BANK-TRF', description: 'Rent Payment', payee: 'PENNS INC.', debitFormatted: '', creditFormatted: '£1,800.00', balanceFormatted: '£2,849.16' },
    ],
  };

  const mockLandlordReport = {
    reportDate: '09/09/2026',
    fromDate: '01/09/2025',
    toDate: '09/09/2026',
    landlord: { name: 'Old Street Holdings Ltd', phone: '02071234567', email: 'info@oldstreet.co.uk' },
    summary: {
      totalProperties: 5,
      totalUnits: 20,
      occupiedUnits: 18,
      totalRentDue: 120000,
      totalRentDueFormatted: '£120,000.00',
      totalPayments: 110000,
      totalPaymentsFormatted: '£110,000.00',
      totalExpenses: 8000,
      totalExpensesFormatted: '£8,000.00',
      netIncome: 102000,
      netIncomeFormatted: '£102,000.00',
    },
    propertiesBreakdown: [
      { propertyName: '127 Southend Road', propertyType: 'Residential', totalUnits: 10, occupiedUnits: 9, rentDueFormatted: '£60,000.00', paymentsFormatted: '£55,000.00', expensesFormatted: '£4,000.00', netIncomeFormatted: '£51,000.00' },
    ],
  };

  const mockAgentReport = {
    reportDate: '09/09/2026',
    fromDate: '01/09/2025',
    toDate: '09/09/2026',
    agent: { name: 'ABC Lettings Ltd', phone: '02089998877', email: 'agent@abclettings.com', region: 'London' },
    summary: {
      totalExpected: 50000,
      totalExpectedFormatted: '£50,000.00',
      totalExpenses: 5000,
      totalExpensesFormatted: '£5,000.00',
      netAmountDue: 45000,
      netAmountDueFormatted: '£45,000.00',
      totalReceived: 40000,
      totalReceivedFormatted: '£40,000.00',
      totalOutstanding: 5000,
      totalOutstandingFormatted: '£5,000.00',
    },
    collections: [
      { date: '01/09/2026', tenantName: 'John Smith', propertyName: 'Victoria Court', unitName: 'Flat 4', expectedFormatted: '£1,200.00', expenseFormatted: '£100.00', receivedFormatted: '£1,100.00', outstandingFormatted: '£0.00' },
    ],
  };

  const reportsToTest = [
    { name: 'Tenant Statement', data: mockTenantStatement, pdf: pdfGenerators.generateTenantStatementPDF, word: wordGenerators.generateTenantStatementWord, excel: excelGenerators.generateTenantStatementExcel },
    { name: 'Landlord Report', data: mockLandlordReport, pdf: pdfGenerators.generateLandlordReportPDF, word: wordGenerators.generateLandlordReportWord, excel: excelGenerators.generateLandlordExcelWorkbook },
    { name: 'Agent Report', data: mockAgentReport, pdf: pdfGenerators.generateAgentReportPDF, word: wordGenerators.generateAgentReportWord, excel: excelGenerators.generateAgentExcelWorkbook },
  ];

  for (const rep of reportsToTest) {
    try {
      console.log(`--- Testing ${rep.name} Generators ---`);

      const pdfBuf = await rep.pdf(rep.data);
      if (Buffer.isBuffer(pdfBuf) && pdfBuf.length > 500) {
        console.log(`  ✅ PASS: ${rep.name} PDF Generated (${pdfBuf.length} bytes)`);
        passed++;
      } else {
        throw new Error('PDF output buffer empty or invalid');
      }

      const wordBuf = await rep.word(rep.data);
      if (Buffer.isBuffer(wordBuf) && wordBuf.length > 500) {
        console.log(`  ✅ PASS: ${rep.name} Word (.docx) Generated (${wordBuf.length} bytes)`);
        passed++;
      } else {
        throw new Error('Word output buffer empty or invalid');
      }

      const excelBuf = await rep.excel(rep.data);
      if (Buffer.isBuffer(excelBuf) && excelBuf.length > 500) {
        console.log(`  ✅ PASS: ${rep.name} Excel (.xlsx) Generated (${excelBuf.length} bytes)`);
        passed++;
      } else {
        throw new Error('Excel output buffer empty or invalid');
      }
    } catch (err) {
      console.error(`  ❌ FAIL: ${rep.name}:`, err.message);
      failed++;
    }
  }

  console.log('\n================================================================');
  console.log(`📊 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAllReportsUpgradeTest();
