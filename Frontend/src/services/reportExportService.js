import * as XLSX from 'xlsx';
import {
  getPropertyReportData,
  getUnitReportData,
  getCustomerReportData,
  getPaymentReportData,
  getOutstandingPaymentReportData,
  getRentalIncomeReportData,
} from './metricsService';

/**
 * Clean & Automated Corporate Export System for Pixx Technologies Reports
 * Supports Excel (.xlsx) and CSV (.csv) export formats with UK (£) formatting.
 */

function createProfessionalSheet(rows, reportTitle) {
  if (!rows || rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([[`PIXXTECHNOLOGIES - ${reportTitle.toUpperCase()}`], ['No records available']]);
  }

  const headers = Object.keys(rows[0]);
  const dateStr = new Date().toLocaleDateString('en-GB');

  const aoa = [
    [`PIXXTECHNOLOGIES - ${reportTitle.toUpperCase()}`],
    [`Report Generated: ${dateStr}`, '', '', `Total Records: ${rows.length}`],
    [],
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? '-')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  return ws;
}

function downloadWorkbook(workbook, filenamePrefix, format) {
  const fileExt = format === 'csv' ? 'csv' : 'xlsx';
  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.${fileExt}`;

  // Apply auto column widths to all worksheets
  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    if (ws && ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      const cols = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 14;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            const len = String(cell.v).length;
            if (len > maxLen) maxLen = len;
          }
        }
        cols.push({ wch: Math.min(maxLen + 4, 55) });
      }
      ws['!cols'] = cols;
    }
  });

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

// 1. Property Report Export
export function exportPropertyReport(filters = {}, format = 'xlsx') {
  const data = getPropertyReportData(filters);
  const rows = data.map((p) => ({
    'Property Name': p.name,
    'Property Type': p.type,
    'Address': p.address || '—',
    'Total Units': p.totalUnits || 0,
    'Occupied Units': p.occupiedUnits || 0,
    'Available Units': p.availableUnits || 0,
  }));

  const worksheet = createProfessionalSheet(rows, 'Property Portfolio Report');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

  downloadWorkbook(workbook, 'Pixx_Property_Report', format);
}

// 2. Unit Report Export
export function exportUnitReport(filters = {}, format = 'xlsx') {
  const data = getUnitReportData(filters);
  const rows = data.map((u) => ({
    'Property': u.propertyName,
    'Unit': u.name,
    'Type': u.type,
    'Floor': u.floor || '—',
    'Size': u.size || '—',
    'Monthly Rent (£)': u.price || 0,
    'Status': u.status,
    'Tenant': u.customerName || '—',
  }));

  const worksheet = createProfessionalSheet(rows, 'Unit Inventory Report');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Units');

  downloadWorkbook(workbook, 'Pixx_Unit_Report', format);
}

// 3. Customer / Tenant Report Export
export function exportCustomerReport(filters = {}, format = 'xlsx') {
  const data = getCustomerReportData(filters);
  const rows = data.map((c) => ({
    'Tenant Name': c.name || '—',
    'Phone': c.phone || '—',
    'Email': c.email || '—',
    'Property': c.propertyName || '—',
    'Unit / Flat': c.unitName || '—',
    'Agreement Type': c.agreementType || 'Standard',
    'Tenancy Start': c.startDate || '—',
    'Tenancy End': c.endDate || 'Ongoing',
    'Monthly Rent (£)': c.monthlyRent || 0,
    'Total Paid (£)': c.totalPaid || 0,
    'Pending Balance (£)': c.totalPending || 0,
    'Status': c.status || 'Active',
  }));

  const worksheet = createProfessionalSheet(rows, 'Tenant Register & Lease Summary Report');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenants');

  downloadWorkbook(workbook, 'Pixx_Tenant_Report', format);
}

// 4. Payment Report Export
export function exportPaymentReport(filters = {}, format = 'xlsx') {
  const data = getPaymentReportData(filters);
  const rows = data.map((p) => ({
    'Tenant': p.customerName || '—',
    'Property': p.propertyName || '—',
    'Unit': p.unitName || '—',
    'Payment Type': 'Receipt',
    'Paid Amount (£)': p.amountPaid || 0,
    'Paid Date': p.paymentDate || '—',
    'Payment Method': p.paymentMethod || 'Bank Transfer',
    'Reference': p.referenceNo || '—',
    'Recorded By': p.recordedBy || 'Manager',
  }));

  const worksheet = createProfessionalSheet(rows, 'Rent Collection Report');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  downloadWorkbook(workbook, 'Pixx_Payment_Report', format);
}

// 5. Outstanding Payment Report Export
export function exportOutstandingPaymentReport(filters = {}, format = 'xlsx') {
  const data = getOutstandingPaymentReportData(filters);
  const rows = data.map((s) => ({
    'Tenant': s.customerName || '—',
    'Property': s.propertyName || '—',
    'Unit': s.unitName || '—',
    'Due Date': s.dueDate || '—',
    'Expected Amount (£)': s.expectedAmount || 0,
    'Paid Amount (£)': s.paidAmount || 0,
    'Remaining Amount (£)': s.remainingAmount || 0,
    'Days Overdue': s.daysOverdue > 0 ? `${s.daysOverdue} days` : '0 days',
    'Status': s.status || 'Pending',
  }));

  const worksheet = createProfessionalSheet(rows, 'Arrears & Outstanding Dues Report');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OutstandingPayments');

  downloadWorkbook(workbook, 'Pixx_Outstanding_Payments_Report', format);
}

// 6. Rental Income Report Export
export function exportRentalIncomeReport(filters = {}, format = 'xlsx') {
  const incomeData = getRentalIncomeReportData(filters);
  const summaryRow = [
    {
      'Metric': 'Total Expected Rent (£)',
      'Value': incomeData.totalExpectedRent || 0,
    },
    {
      'Metric': 'Total Received (£)',
      'Value': incomeData.totalReceived || 0,
    },
    {
      'Metric': 'Total Pending (£)',
      'Value': incomeData.totalPending || 0,
    },
    {
      'Metric': 'Total Overdue (£)',
      'Value': incomeData.totalOverdue || 0,
    },
  ];

  const detailRows = incomeData.detailedSchedules.map((s) => ({
    'Tenant': s.customerName || '—',
    'Property': s.propertyName || '—',
    'Unit': s.unitName || '—',
    'Obligation': s.periodName || '—',
    'Due Date': s.dueDate || '—',
    'Expected (£)': s.expectedAmount || 0,
    'Paid (£)': s.paidAmount || 0,
    'Remaining (£)': s.remainingAmount || 0,
    'Status': s.status || 'Pending',
  }));

  const workbook = XLSX.utils.book_new();
  const summarySheet = createProfessionalSheet(summaryRow, 'Rental Income Summary');
  const detailSheet = createProfessionalSheet(detailRows, 'Rental Income Detailed Schedules');

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Income_Summary');
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed_Schedules');

  downloadWorkbook(workbook, 'Pixx_Rental_Income_Report', format);
}
