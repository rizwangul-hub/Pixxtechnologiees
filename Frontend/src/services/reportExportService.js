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

import { getSavedProperties, getSavedUnits } from '../data/propertiesData';
import { getSavedCustomers, getSavedAgreements, getSavedRecordedPayments } from '../data/customersData';

// 1. Property Report Export
export function exportPropertyReport(filters = {}, format = 'xlsx') {
  const properties = getSavedProperties();
  const allUnits = getSavedUnits();
  const allPayments = getSavedRecordedPayments();
  const allCustomers = getSavedCustomers();
  const allAgreements = getSavedAgreements();

  const targetPropertyId = filters.propertyId ? filters.propertyId.toString() : 'All';
  const filteredProps = properties.filter((p) => {
    if (targetPropertyId !== 'All') {
      const pid = (p.id || p._id)?.toString();
      return pid === targetPropertyId;
    }
    return true;
  });

  const workbook = XLSX.utils.book_new();

  if (targetPropertyId !== 'All' && filteredProps.length > 0) {
    const property = filteredProps[0];
    const pid = (property.id || property._id)?.toString();
    const propUnits = allUnits.filter((u) => (u.propertyId?._id || u.propertyId)?.toString() === pid);
    const propPayments = allPayments.filter((pay) => (pay.propertyId?._id || pay.propertyId)?.toString() === pid);

    // Sheet 1: Unit Inventory & Rent Matrix
    const unitRows = propUnits.map((u, idx) => {
      const activeAgr = allAgreements.find((a) => (a.unitId?._id || a.unitId)?.toString() === (u.id || u._id)?.toString() && a.status === 'Active');
      const tenant = allCustomers.find((c) => (c.id || c._id)?.toString() === (activeAgr?.customerId || u.customerId)?.toString());

      return {
        'No': idx + 1,
        'Unit / Space Name': u.name || `Unit ${idx + 1}`,
        'Type': u.type || 'Flat',
        'Floor / Size': `${u.floor || 'G'} / ${u.size || '-'}`,
        'Monthly Rent (£)': Number(u.price) || 0,
        'Occupancy Status': u.status || 'Available',
        'Assigned Tenant': tenant ? (tenant.fullName || tenant.name) : (u.customerName || 'Unassigned'),
        'Tenant Contact': tenant ? (tenant.phone || tenant.email || '-') : '-',
      };
    });

    const unitSheet = createProfessionalSheet(unitRows.length > 0 ? unitRows : [{ 'Property': property.name, 'Status': 'No units registered' }], `${property.name} - Unit Register`);
    XLSX.utils.book_append_sheet(workbook, unitSheet, 'Unit_Inventory');

    // Sheet 2: Payments & Rent Collections
    const paymentRows = propPayments.map((pay, idx) => ({
      'No': idx + 1,
      'Date Paid': pay.paymentDate || pay.paidDate || pay.dueDate || '-',
      'Unit / Flat': pay.unitName || '-',
      'Tenant Name': pay.customerName || '-',
      'Amount Paid (£)': Number(pay.amountPaid || pay.paidAmount || pay.amount) || 0,
      'Payment Method': pay.paymentMethod || 'Bank Transfer',
      'Reference': pay.referenceNo || pay.reference || '-',
      'Status': pay.status || 'Paid',
    }));

    const paymentSheet = createProfessionalSheet(paymentRows.length > 0 ? paymentRows : [{ 'Property': property.name, 'Status': 'No payments recorded yet' }], `${property.name} - Payment Ledger`);
    XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment_Ledger');
  } else {
    // General Property Summary
    const rows = filteredProps.map((p) => {
      const pid = (p.id || p._id)?.toString();
      const propUnits = allUnits.filter((u) => (u.propertyId?._id || u.propertyId)?.toString() === pid);
      return {
        'Property Name': p.name,
        'Type': p.type,
        'Address': p.address || '—',
        'Total Units': propUnits.length,
        'Occupied Units': propUnits.filter((u) => u.status === 'Occupied').length,
        'Available Units': propUnits.filter((u) => u.status === 'Available').length,
      };
    });

    const worksheet = createProfessionalSheet(rows, 'Property Portfolio Report');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');
  }

  downloadWorkbook(workbook, `Pixx_Property_Report_${(filteredProps[0]?.name || 'Portfolio').replace(/[^a-zA-Z0-9]/g, '_')}`, format);
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
