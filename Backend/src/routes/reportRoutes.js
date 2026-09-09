const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// All report routes require authenticated manager token
router.use(protect);

// 1. Tenant Statement
router.get('/tenant-statement/:tenantId', reportController.getTenantStatement);
router.get('/tenant-statement/:tenantId/pdf', reportController.downloadTenantStatementPDF);
router.get('/tenant-statement/:tenantId/word', reportController.downloadTenantStatementWord);
router.get('/tenant-statement/:tenantId/excel', reportController.downloadTenantStatementExcel);

// 2. Landlord Report
router.get('/landlord/:landlordId', reportController.getLandlordReport);
router.get('/landlord/:landlordId/pdf', reportController.downloadLandlordReportPDF);
router.get('/landlord/:landlordId/word', reportController.downloadLandlordReportWord);
router.get('/landlord/:landlordId/excel', reportController.downloadLandlordReportExcel);

// 3. Agent Report
router.get('/agent/:agentId', reportController.getAgentReport);
router.get('/agent/:agentId/pdf', reportController.downloadAgentReportPDF);
router.get('/agent/:agentId/word', reportController.downloadAgentReportWord);
router.get('/agent/:agentId/excel', reportController.downloadAgentReportExcel);

// 4. Property Report
router.get('/property/:propertyId', reportController.getPropertyReport);
router.get('/property/:propertyId/pdf', reportController.downloadPropertyReportPDF);
router.get('/property/:propertyId/word', reportController.downloadPropertyReportWord);
router.get('/property/:propertyId/excel', reportController.downloadPropertyReportExcel);

// 5. Unit Report
router.get('/unit/:unitId', reportController.getUnitReport);
router.get('/unit/:unitId/pdf', reportController.downloadUnitReportPDF);
router.get('/unit/:unitId/word', reportController.downloadUnitReportWord);
router.get('/unit/:unitId/excel', reportController.downloadUnitReportExcel);

// 6. Payment Report
router.get('/payments', reportController.getPaymentReport);
router.get('/payments/pdf', reportController.downloadPaymentReportPDF);
router.get('/payments/word', reportController.downloadPaymentReportWord);
router.get('/payments/excel', reportController.downloadPaymentReportExcel);

// 7. Expense Report
router.get('/expenses', reportController.getExpenseReport);
router.get('/expenses/pdf', reportController.downloadExpenseReportPDF);
router.get('/expenses/word', reportController.downloadExpenseReportWord);
router.get('/expenses/excel', reportController.downloadExpenseReportExcel);

// 8. Income Report
router.get('/income', reportController.getIncomeReport);
router.get('/income/pdf', reportController.downloadIncomeReportPDF);
router.get('/income/word', reportController.downloadIncomeReportWord);
router.get('/income/excel', reportController.downloadIncomeReportExcel);

// 9. Invoice Report
router.get('/invoices', reportController.getInvoiceReport);
router.get('/invoices/pdf', reportController.downloadInvoiceReportPDF);
router.get('/invoices/word', reportController.downloadInvoiceReportWord);
router.get('/invoices/excel', reportController.downloadInvoiceReportExcel);

// 10. Financial Summary Report
router.get('/financial-summary', reportController.getFinancialSummary);
router.get('/financial-summary/pdf', reportController.downloadFinancialSummaryPDF);
router.get('/financial-summary/word', reportController.downloadFinancialSummaryWord);
router.get('/financial-summary/excel', reportController.downloadFinancialSummaryExcel);

// 11. Mortgage Report
router.get('/mortgages', reportController.getMortgageReport);
router.get('/mortgages/pdf', reportController.downloadMortgageReportPDF);
router.get('/mortgages/word', reportController.downloadMortgageReportWord);
router.get('/mortgages/excel', reportController.downloadMortgageReportExcel);

// 12. Financial Ledger Reconciliation & Integrity Audit Endpoint
router.get('/reconciliation', async (req, res) => {
  try {
    const { runFinancialReconciliation } = require('../services/financialReconciliationService');
    const report = await runFinancialReconciliation();
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
