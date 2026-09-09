const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// All report routes require authenticated manager token
router.use(protect);

// 1. Tenant Statement
router.get('/tenant-statement/:tenantId', reportController.getTenantStatement);
router.get('/tenant-statement/:tenantId/pdf', reportController.downloadTenantStatementPDF);
router.post('/tenant-statement/:tenantId/pdf', reportController.downloadTenantStatementPDF);
router.get('/tenant-statement/:tenantId/word', reportController.downloadTenantStatementWord);
router.post('/tenant-statement/:tenantId/word', reportController.downloadTenantStatementWord);
router.get('/tenant-statement/:tenantId/excel', reportController.downloadTenantStatementExcel);
router.post('/tenant-statement/:tenantId/excel', reportController.downloadTenantStatementExcel);

// 2. Landlord Report
router.get('/landlord/:landlordId', reportController.getLandlordReport);
router.get('/landlord/:landlordId/pdf', reportController.downloadLandlordReportPDF);
router.post('/landlord/:landlordId/pdf', reportController.downloadLandlordReportPDF);
router.get('/landlord/:landlordId/word', reportController.downloadLandlordReportWord);
router.post('/landlord/:landlordId/word', reportController.downloadLandlordReportWord);
router.get('/landlord/:landlordId/excel', reportController.downloadLandlordReportExcel);
router.post('/landlord/:landlordId/excel', reportController.downloadLandlordReportExcel);

// 3. Agent Report
router.get('/agent/:agentId', reportController.getAgentReport);
router.get('/agent/:agentId/pdf', reportController.downloadAgentReportPDF);
router.post('/agent/:agentId/pdf', reportController.downloadAgentReportPDF);
router.get('/agent/:agentId/word', reportController.downloadAgentReportWord);
router.post('/agent/:agentId/word', reportController.downloadAgentReportWord);
router.get('/agent/:agentId/excel', reportController.downloadAgentReportExcel);
router.post('/agent/:agentId/excel', reportController.downloadAgentReportExcel);

// 4. Property Report
router.get('/property/:propertyId', reportController.getPropertyReport);
router.get('/property/:propertyId/pdf', reportController.downloadPropertyReportPDF);
router.post('/property/:propertyId/pdf', reportController.downloadPropertyReportPDF);
router.get('/property/:propertyId/word', reportController.downloadPropertyReportWord);
router.post('/property/:propertyId/word', reportController.downloadPropertyReportWord);
router.get('/property/:propertyId/excel', reportController.downloadPropertyReportExcel);
router.post('/property/:propertyId/excel', reportController.downloadPropertyReportExcel);

// 5. Unit Report
router.get('/unit/:unitId', reportController.getUnitReport);
router.get('/unit/:unitId/pdf', reportController.downloadUnitReportPDF);
router.post('/unit/:unitId/pdf', reportController.downloadUnitReportPDF);
router.get('/unit/:unitId/word', reportController.downloadUnitReportWord);
router.post('/unit/:unitId/word', reportController.downloadUnitReportWord);
router.get('/unit/:unitId/excel', reportController.downloadUnitReportExcel);
router.post('/unit/:unitId/excel', reportController.downloadUnitReportExcel);

// 6. Payment Report
router.get('/payments', reportController.getPaymentReport);
router.get('/payments/pdf', reportController.downloadPaymentReportPDF);
router.post('/payments/pdf', reportController.downloadPaymentReportPDF);
router.get('/payments/word', reportController.downloadPaymentReportWord);
router.post('/payments/word', reportController.downloadPaymentReportWord);
router.get('/payments/excel', reportController.downloadPaymentReportExcel);
router.post('/payments/excel', reportController.downloadPaymentReportExcel);

// 7. Expense Report
router.get('/expenses', reportController.getExpenseReport);
router.get('/expenses/pdf', reportController.downloadExpenseReportPDF);
router.post('/expenses/pdf', reportController.downloadExpenseReportPDF);
router.get('/expenses/word', reportController.downloadExpenseReportWord);
router.post('/expenses/word', reportController.downloadExpenseReportWord);
router.get('/expenses/excel', reportController.downloadExpenseReportExcel);
router.post('/expenses/excel', reportController.downloadExpenseReportExcel);

// 8. Income Report
router.get('/income', reportController.getIncomeReport);
router.get('/income/pdf', reportController.downloadIncomeReportPDF);
router.post('/income/pdf', reportController.downloadIncomeReportPDF);
router.get('/income/word', reportController.downloadIncomeReportWord);
router.post('/income/word', reportController.downloadIncomeReportWord);
router.get('/income/excel', reportController.downloadIncomeReportExcel);
router.post('/income/excel', reportController.downloadIncomeReportExcel);

// 9. Invoice Report
router.get('/invoices', reportController.getInvoiceReport);
router.get('/invoices/pdf', reportController.downloadInvoiceReportPDF);
router.post('/invoices/pdf', reportController.downloadInvoiceReportPDF);
router.get('/invoices/word', reportController.downloadInvoiceReportWord);
router.post('/invoices/word', reportController.downloadInvoiceReportWord);
router.get('/invoices/excel', reportController.downloadInvoiceReportExcel);
router.post('/invoices/excel', reportController.downloadInvoiceReportExcel);

// 10. Financial Summary Report
router.get('/financial-summary', reportController.getFinancialSummary);
router.get('/financial-summary/pdf', reportController.downloadFinancialSummaryPDF);
router.post('/financial-summary/pdf', reportController.downloadFinancialSummaryPDF);
router.get('/financial-summary/word', reportController.downloadFinancialSummaryWord);
router.post('/financial-summary/word', reportController.downloadFinancialSummaryWord);
router.get('/financial-summary/excel', reportController.downloadFinancialSummaryExcel);
router.post('/financial-summary/excel', reportController.downloadFinancialSummaryExcel);

// 11. Mortgage Report
router.get('/mortgages', reportController.getMortgageReport);
router.get('/mortgages/pdf', reportController.downloadMortgageReportPDF);
router.post('/mortgages/pdf', reportController.downloadMortgageReportPDF);
router.get('/mortgages/word', reportController.downloadMortgageReportWord);
router.post('/mortgages/word', reportController.downloadMortgageReportWord);
router.get('/mortgages/excel', reportController.downloadMortgageReportExcel);
router.post('/mortgages/excel', reportController.downloadMortgageReportExcel);

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
