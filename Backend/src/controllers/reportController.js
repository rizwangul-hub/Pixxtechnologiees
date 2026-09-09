const {
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
} = require('../services/reportDataService');

const pdfGenerators = require('../services/pdfReportGenerator');
const wordGenerators = require('../services/wordReportGenerator');
const excelGenerators = require('../services/excelReportGenerator');

// Helper to set download headers & send buffer
function sendDownloadBuffer(res, buffer, mimeType, filename) {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

// ----------------------------------------------------
// 1. TENANT STATEMENT
// ----------------------------------------------------
const getTenantStatement = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { fromDate, toDate, propertyId } = req.query;
    const data = await generateTenantStatementData(tenantId, fromDate, toDate, propertyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTenantStatementPDF = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { fromDate, toDate, propertyId } = req.query;
    const data = await generateTenantStatementData(tenantId, fromDate, toDate, propertyId);
    const pdfBuffer = await pdfGenerators.generateTenantStatementPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Tenant_Statement_${data.tenant.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTenantStatementWord = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { fromDate, toDate, propertyId } = req.query;
    const data = await generateTenantStatementData(tenantId, fromDate, toDate, propertyId);
    const wordBuffer = await wordGenerators.generateTenantStatementWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Tenant_Statement_${data.tenant.name.replace(/\s+/g, '_')}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTenantStatementExcel = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { fromDate, toDate, propertyId } = req.query;
    const data = await generateTenantStatementData(tenantId, fromDate, toDate, propertyId);
    const excelBuffer = await excelGenerators.generateTenantStatementExcel(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Tenant_Statement_${data.tenant.name.replace(/\s+/g, '_')}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 2. LANDLORD REPORT
// ----------------------------------------------------
const getLandlordReport = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateLandlordReportData(landlordId, fromDate, toDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadLandlordReportPDF = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateLandlordReportData(landlordId, fromDate, toDate);
    const pdfBuffer = await pdfGenerators.generateLandlordReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Landlord_Report_${data.landlord.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadLandlordReportWord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateLandlordReportData(landlordId, fromDate, toDate);
    const wordBuffer = await wordGenerators.generateLandlordReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Landlord_Report_${data.landlord.name.replace(/\s+/g, '_')}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadLandlordReportExcel = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateLandlordReportData(landlordId, fromDate, toDate);
    const excelBuffer = await excelGenerators.generateLandlordExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Landlord_Report_${data.landlord.name.replace(/\s+/g, '_')}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 3. AGENT REPORT
// ----------------------------------------------------
const getAgentReport = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateAgentReportData(agentId, fromDate, toDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadAgentReportPDF = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateAgentReportData(agentId, fromDate, toDate);
    const pdfBuffer = await pdfGenerators.generateAgentReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Agent_Report_${data.agent.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadAgentReportWord = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateAgentReportData(agentId, fromDate, toDate);
    const wordBuffer = await wordGenerators.generateAgentReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Agent_Report_${data.agent.name.replace(/\s+/g, '_')}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadAgentReportExcel = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateAgentReportData(agentId, fromDate, toDate);
    const excelBuffer = await excelGenerators.generateAgentExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Agent_Report_${data.agent.name.replace(/\s+/g, '_')}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 4. PROPERTY REPORT
// ----------------------------------------------------
const getPropertyReport = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generatePropertyReportData(propertyId, fromDate, toDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPropertyReportPDF = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generatePropertyReportData(propertyId, fromDate, toDate);
    const pdfBuffer = await pdfGenerators.generatePropertyReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Property_Report_${data.property.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPropertyReportWord = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generatePropertyReportData(propertyId, fromDate, toDate);
    const wordBuffer = await wordGenerators.generatePropertyReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Property_Report_${data.property.name.replace(/\s+/g, '_')}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPropertyReportExcel = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generatePropertyReportData(propertyId, fromDate, toDate);
    const excelBuffer = await excelGenerators.generatePropertyExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Property_Report_${data.property.name.replace(/\s+/g, '_')}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 5. UNIT REPORT
// ----------------------------------------------------
const getUnitReport = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateUnitReportData(unitId, fromDate, toDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadUnitReportPDF = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateUnitReportData(unitId, fromDate, toDate);
    const pdfBuffer = await pdfGenerators.generateUnitReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Unit_Report_${data.unit.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadUnitReportWord = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateUnitReportData(unitId, fromDate, toDate);
    const wordBuffer = await wordGenerators.generateUnitReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Unit_Report_${data.unit.name.replace(/\s+/g, '_')}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadUnitReportExcel = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { fromDate, toDate } = req.query;
    const data = await generateUnitReportData(unitId, fromDate, toDate);
    const excelBuffer = await excelGenerators.generateUnitExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Unit_Report_${data.unit.name.replace(/\s+/g, '_')}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 6. PAYMENT REPORT
// ----------------------------------------------------
const getPaymentReport = async (req, res) => {
  try {
    const data = await generatePaymentReportData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPaymentReportPDF = async (req, res) => {
  try {
    const data = await generatePaymentReportData(req.query);
    const pdfBuffer = await pdfGenerators.generatePaymentReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Payment_Report_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPaymentReportWord = async (req, res) => {
  try {
    const data = await generatePaymentReportData(req.query);
    const wordBuffer = await wordGenerators.generatePaymentReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Payment_Report_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPaymentReportExcel = async (req, res) => {
  try {
    const data = await generatePaymentReportData(req.query);
    const excelBuffer = await excelGenerators.generatePaymentExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Payment_Report_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 7. EXPENSE REPORT
// ----------------------------------------------------
const getExpenseReport = async (req, res) => {
  try {
    const data = await generateExpenseReportData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadExpenseReportPDF = async (req, res) => {
  try {
    const data = await generateExpenseReportData(req.query);
    const pdfBuffer = await pdfGenerators.generateExpenseReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Expense_Report_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadExpenseReportWord = async (req, res) => {
  try {
    const data = await generateExpenseReportData(req.query);
    const wordBuffer = await wordGenerators.generateExpenseReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Expense_Report_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadExpenseReportExcel = async (req, res) => {
  try {
    const data = await generateExpenseReportData(req.query);
    const excelBuffer = await excelGenerators.generateExpenseExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Expense_Report_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 8. INCOME REPORT
// ----------------------------------------------------
const getIncomeReport = async (req, res) => {
  try {
    const data = await generateIncomeReportData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadIncomeReportPDF = async (req, res) => {
  try {
    const data = await generateIncomeReportData(req.query);
    const pdfBuffer = await pdfGenerators.generateIncomeReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Income_Report_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadIncomeReportWord = async (req, res) => {
  try {
    const data = await generateIncomeReportData(req.query);
    const wordBuffer = await wordGenerators.generateIncomeReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Income_Report_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadIncomeReportExcel = async (req, res) => {
  try {
    const data = await generateIncomeReportData(req.query);
    const excelBuffer = await excelGenerators.generateIncomeExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Income_Report_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 9. INVOICE REPORT
// ----------------------------------------------------
const getInvoiceReport = async (req, res) => {
  try {
    const data = await generateInvoiceReportData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadInvoiceReportPDF = async (req, res) => {
  try {
    const data = await generateInvoiceReportData(req.query);
    const pdfBuffer = await pdfGenerators.generateInvoiceReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Invoice_Report_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadInvoiceReportWord = async (req, res) => {
  try {
    const data = await generateInvoiceReportData(req.query);
    const wordBuffer = await wordGenerators.generateInvoiceReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Invoice_Report_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadInvoiceReportExcel = async (req, res) => {
  try {
    const data = await generateInvoiceReportData(req.query);
    const excelBuffer = await excelGenerators.generateInvoiceExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Invoice_Report_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 10. FINANCIAL SUMMARY
// ----------------------------------------------------
const getFinancialSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await generateFinancialSummaryData(fromDate, toDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadFinancialSummaryPDF = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await generateFinancialSummaryData(fromDate, toDate);
    const pdfBuffer = await pdfGenerators.generateFinancialSummaryPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Financial_Summary_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadFinancialSummaryWord = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await generateFinancialSummaryData(fromDate, toDate);
    const wordBuffer = await wordGenerators.generateFinancialSummaryWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Financial_Summary_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadFinancialSummaryExcel = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await generateFinancialSummaryData(fromDate, toDate);
    const excelBuffer = await excelGenerators.generateFinancialSummaryExcel(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Financial_Summary_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// 11. MORTGAGE REPORT
// ----------------------------------------------------
const getMortgageReport = async (req, res) => {
  try {
    const data = await generateMortgageReportData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadMortgageReportPDF = async (req, res) => {
  try {
    const data = await generateMortgageReportData(req.query);
    const pdfBuffer = await pdfGenerators.generateMortgageReportPDF(data);
    sendDownloadBuffer(res, pdfBuffer, 'application/pdf', `Mortgage_Report_${Date.now()}.pdf`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadMortgageReportWord = async (req, res) => {
  try {
    const data = await generateMortgageReportData(req.query);
    const wordBuffer = await wordGenerators.generateMortgageReportWord(data);
    sendDownloadBuffer(
      res,
      wordBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      `Mortgage_Report_${Date.now()}.docx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadMortgageReportExcel = async (req, res) => {
  try {
    const data = await generateMortgageReportData(req.query);
    const excelBuffer = await excelGenerators.generateMortgageExcelWorkbook(data);
    sendDownloadBuffer(
      res,
      excelBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Mortgage_Report_${Date.now()}.xlsx`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTenantStatement,
  downloadTenantStatementPDF,
  downloadTenantStatementWord,
  downloadTenantStatementExcel,
  getLandlordReport,
  downloadLandlordReportPDF,
  downloadLandlordReportWord,
  downloadLandlordReportExcel,
  getAgentReport,
  downloadAgentReportPDF,
  downloadAgentReportWord,
  downloadAgentReportExcel,
  getPropertyReport,
  downloadPropertyReportPDF,
  downloadPropertyReportWord,
  downloadPropertyReportExcel,
  getUnitReport,
  downloadUnitReportPDF,
  downloadUnitReportWord,
  downloadUnitReportExcel,
  getPaymentReport,
  downloadPaymentReportPDF,
  downloadPaymentReportWord,
  downloadPaymentReportExcel,
  getExpenseReport,
  downloadExpenseReportPDF,
  downloadExpenseReportWord,
  downloadExpenseReportExcel,
  getIncomeReport,
  downloadIncomeReportPDF,
  downloadIncomeReportWord,
  downloadIncomeReportExcel,
  getInvoiceReport,
  downloadInvoiceReportPDF,
  downloadInvoiceReportWord,
  downloadInvoiceReportExcel,
  getFinancialSummary,
  downloadFinancialSummaryPDF,
  downloadFinancialSummaryWord,
  downloadFinancialSummaryExcel,
  getMortgageReport,
  downloadMortgageReportPDF,
  downloadMortgageReportWord,
  downloadMortgageReportExcel,
};
