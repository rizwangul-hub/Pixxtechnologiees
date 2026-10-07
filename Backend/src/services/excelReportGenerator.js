const ExcelJS = require('exceljs');

const CURRENCY_FORMAT = '£#,##0.00;[Red](£#,##0.00);"-"';

/**
 * Helper to format UK dates (DD/MM/YYYY)
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

/**
 * Generic Excel Workbook Renderer for UK Property Management Business Reports
 */
async function renderExcelReportWorkbook(options) {
  const {
    reportTitle = 'BUSINESS REPORT',
    generatedAt = formatUKDate(new Date()),
    periodText = '',
    metaFields = [],
    summaryKPIs = [],
    columns = [],
    rows = [],
    totalRow = null,
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies Property Management';
  workbook.created = new Date();

  const safeTitle = String(reportTitle).replace(/[:\\/?*\[\]]/g, '').slice(0, 30) || 'Report';
  const sheet = workbook.addWorksheet(safeTitle);

  const colCount = Math.max(columns.length, 5);

  // 1. TITLE BANNER ROW
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `UK PIXXTECHNOLGIES - ${reportTitle.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  // 2. METADATA ROW 1 & 2
  let r = 3;
  sheet.getCell(`A${r}`).value = 'Report Generated:';
  sheet.getCell(`B${r}`).value = formatUKDate(generatedAt);
  sheet.getCell(`A${r}`).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet.getCell(`B${r}`).font = { size: 10, color: { argb: 'FF0F172A' } };

  sheet.getCell(`D${r}`).value = 'Report Period:';
  sheet.getCell(`E${r}`).value = periodText || 'Full History';
  sheet.getCell(`D${r}`).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet.getCell(`E${r}`).font = { size: 10, color: { argb: 'FF0F172A' } };
  r++;

  if (metaFields && metaFields.length > 0) {
    metaFields.forEach((field) => {
      sheet.getCell(`A${r}`).value = `${field.label}:`;
      sheet.getCell(`B${r}`).value = String(field.value || '-');
      sheet.getCell(`A${r}`).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
      sheet.getCell(`B${r}`).font = { size: 10, color: { argb: 'FF0F172A' } };
      r++;
    });
  }

  r++;

  // 3. EXECUTIVE SUMMARY SECTION
  if (summaryKPIs && summaryKPIs.length > 0) {
    sheet.mergeCells(`A${r}`, `${String.fromCharCode(64 + colCount)}${r}`);
    const kpiTitleCell = sheet.getCell(`A${r}`);
    kpiTitleCell.value = 'EXECUTIVE SUMMARY METRICS';
    kpiTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    kpiTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    sheet.getRow(r).height = 24;
    r++;

    summaryKPIs.forEach((kpi) => {
      const rowObj = sheet.getRow(r);
      rowObj.getCell(1).value = kpi.label;
      rowObj.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF475569' } };

      const valCell = rowObj.getCell(2);
      valCell.value = kpi.numValue !== undefined ? kpi.numValue : kpi.value;
      if (typeof kpi.numValue === 'number' || (typeof kpi.value === 'string' && kpi.value.includes('£'))) {
        if (typeof kpi.numValue === 'number') valCell.numFmt = CURRENCY_FORMAT;
        valCell.font = { bold: true, size: 10, color: { argb: 'FF04A26F' } };
      } else {
        valCell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
      }
      r++;
    });

    r++;
  }

  // Freeze panes at main table header row
  const tableHeaderRowIndex = r;
  sheet.views = [{ state: 'frozen', ySplit: tableHeaderRowIndex, showGridLines: true }];

  // 4. MAIN DATA TABLE HEADERS
  const headerRow = sheet.getRow(tableHeaderRowIndex);
  headerRow.height = 26;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: col.align === 'right' ? 'right' : 'left', vertical: 'middle' };
  });

  // 5. DATA ROWS
  let dataRowIdx = tableHeaderRowIndex + 1;
  rows.forEach((rowData, index) => {
    const rowObj = sheet.getRow(dataRowIdx);
    rowObj.height = 20;

    columns.forEach((col, cIdx) => {
      const cell = rowObj.getCell(cIdx + 1);
      const rawVal = rowData[col.numKey || col.key];

      if (col.isCurrency && typeof rawVal === 'number') {
        cell.value = rawVal;
        cell.numFmt = CURRENCY_FORMAT;
      } else {
        cell.value = rawVal !== undefined && rawVal !== null ? rawVal : '-';
      }

      cell.alignment = { horizontal: col.align === 'right' ? 'right' : 'left', vertical: 'middle' };

      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
    dataRowIdx++;
  });

  // 6. BOTTOM TOTAL ROW
  if (totalRow) {
    const totRowObj = sheet.getRow(dataRowIdx);
    totRowObj.height = 24;

    columns.forEach((col, cIdx) => {
      const cell = totRowObj.getCell(cIdx + 1);
      const rawVal = totalRow[col.numKey || col.key];

      if (cIdx === 0 && !rawVal) {
        cell.value = 'TOTAL';
      } else if (col.isCurrency && typeof rawVal === 'number') {
        cell.value = rawVal;
        cell.numFmt = CURRENCY_FORMAT;
      } else {
        cell.value = rawVal || '';
      }

      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { horizontal: col.align === 'right' ? 'right' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF04A26F' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });
  }

  // 7. AUTO-FIT COLUMN WIDTHS
  sheet.columns = columns.map((c) => {
    let maxLen = c.label.length;
    rows.forEach((r) => {
      const val = r[c.key];
      if (val) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { width: Math.min(Math.max(maxLen + 5, c.width || 16), 55) };
  });

  return await workbook.xlsx.writeBuffer();
}

// ----------------------------------------------------
// Export Handlers for ALL 11 Report Types
// ----------------------------------------------------

async function generateTenantStatementExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies Property Management';
  workbook.lastModifiedBy = 'PixxTechnologies Property Management';
  workbook.created = new Date();

  const isAll = Boolean(
    data.isAllTenants ||
    data.tenant?.id === 'all_tenants' ||
    String(data.tenant?.name).toLowerCase().includes('all tenants') ||
    String(data.reportType).includes('All Tenants')
  );

  const tenantName = data.tenant?.fullName || data.tenant?.name || 'Tenant';
  const propertyName = data.property?.name || (isAll ? 'Portfolio Wide' : 'Assigned Property');
  const propertyAddress = data.property?.address || (isAll ? 'All Managed Units' : '');
  const landlordName = data.landlord?.name || 'PixxTechnologies Property Management';
  const statementDateStr = formatUKDate(data.statementDate || new Date());
  const fromDateStr = formatUKDate(data.fromDate);
  const toDateStr = formatUKDate(data.toDate);

  const sheet = workbook.addWorksheet(isAll ? 'Tenant Statement & Payments' : 'Tenant Statement', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToWidth: 1 },
    views: [{ showGridLines: true, state: 'frozen', ySplit: 15 }],
  });

  // Set explicit column widths so no text or numbers are clipped
  sheet.columns = [
    { key: 'colA', width: 14 }, // Date
    { key: 'colB', width: 18 }, // Reference
    { key: 'colC', width: 36 }, // Description
    { key: 'colD', width: 26 }, // Payee / Tenant
    { key: 'colE', width: 18 }, // Debit (£)
    { key: 'colF', width: 18 }, // Credit (£)
    { key: 'colG', width: 20 }, // Balance (£)
  ];

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  const cardBorder = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // Row 1: Top Accent Bar
  sheet.mergeCells('A1:G1');
  const bar = sheet.getCell('A1');
  bar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  sheet.getRow(1).height = 6;

  // Row 2: Main Document Header
  sheet.mergeCells('A2:D2');
  const title = sheet.getCell('A2');
  title.value = isAll ? 'TENANT STATEMENT & PAYMENTS' : 'STATEMENT OF ACCOUNT';
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } };
  title.alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('E2:G2');
  const dateCell = sheet.getCell('E2');
  dateCell.value = `Statement Date: ${statementDateStr}`;
  dateCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(2).height = 28;

  // Row 3: Subtitle & Period
  sheet.mergeCells('A3:D3');
  const subtitle = sheet.getCell('A3');
  subtitle.value = isAll
    ? 'Consolidated Portfolio Rent Charges, Payments & Balance Ledger'
    : 'Official Rental Ledger & Transaction History';
  subtitle.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subtitle.alignment = { horizontal: 'left', vertical: 'top' };

  sheet.mergeCells('E3:G3');
  const period = sheet.getCell('E3');
  period.value = `Period: ${fromDateStr} – ${toDateStr}`;
  period.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF04A26F' } };
  period.alignment = { horizontal: 'right', vertical: 'top' };
  sheet.getRow(3).height = 18;

  // Row 4: Empty spacer
  sheet.getRow(4).height = 8;

  // Rows 5 to 9: Two Information Cards Side-by-Side
  // Left: Tenant Details (Cols A to C)
  // Right: Property & Landlord Details (Cols D to G)

  // Card Headers (Row 5)
  sheet.mergeCells('A5:C5');
  const tHeader = sheet.getCell('A5');
  tHeader.value = isAll ? 'PORTFOLIO TENANCY SCOPE' : 'TENANT INFORMATION';
  tHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  tHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  tHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  sheet.mergeCells('D5:G5');
  const pHeader = sheet.getCell('D5');
  pHeader.value = 'PROPERTY & MANAGEMENT INFORMATION';
  pHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  pHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  pHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getRow(5).height = 20;

  // Card Content Rows 6-9
  const leftDetails = isAll
    ? [
        { label: 'Report Scope:', val: 'All Portfolio Tenants (Combined)', isBold: true },
        { label: 'Total Records:', val: `${data.summary?.totalRecords || (data.transactions?.length ? data.transactions.length - 1 : 0)} transactions` },
        { label: 'Coverage:', val: 'All active & historic rent ledgers' },
        { label: 'Status:', val: 'Active Portfolio View' },
      ]
    : [
        { label: 'Tenant Name:', val: tenantName, isBold: true },
        { label: 'Address:', val: data.tenant?.address || propertyAddress || 'N/A' },
        { label: 'Phone / Email:', val: `${data.tenant?.phone || '-'} ${data.tenant?.email ? '• ' + data.tenant.email : ''}` },
        { label: 'Status:', val: 'Active Tenancy Account' },
      ];

  const rightDetails = isAll
    ? [
        { label: 'Property Scope:', val: 'Portfolio Wide (All Properties)', isBold: true },
        { label: 'Address:', val: 'United Kingdom Properties' },
        { label: 'Management:', val: landlordName },
        { label: 'Statement Ref:', val: 'STMT-ALL-TENANTS' },
      ]
    : [
        { label: 'Property:', val: propertyName, isBold: true },
        { label: 'Address:', val: propertyAddress || '-' },
        { label: 'Landlord / Client:', val: landlordName },
        { label: 'Statement Ref:', val: `STMT-${data.tenant?.id ? String(data.tenant.id).slice(-6).toUpperCase() : 'ACC'}` },
      ];

  for (let i = 0; i < 4; i++) {
    const rIdx = 6 + i;
    sheet.getRow(rIdx).height = 18;

    // Left
    sheet.getCell(`A${rIdx}`).value = leftDetails[i].label;
    sheet.getCell(`A${rIdx}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF64748B' } };
    sheet.getCell(`A${rIdx}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells(`B${rIdx}:C${rIdx}`);
    const leftValCell = sheet.getCell(`B${rIdx}`);
    leftValCell.value = leftDetails[i].val;
    leftValCell.font = { name: 'Calibri', size: 9.5, bold: !!leftDetails[i].isBold, color: { argb: 'FF0F172A' } };
    leftValCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Right
    sheet.getCell(`D${rIdx}`).value = rightDetails[i].label;
    sheet.getCell(`D${rIdx}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF64748B' } };
    sheet.getCell(`D${rIdx}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells(`E${rIdx}:G${rIdx}`);
    const rightValCell = sheet.getCell(`E${rIdx}`);
    rightValCell.value = rightDetails[i].val;
    rightValCell.font = { name: 'Calibri', size: 9.5, bold: !!rightDetails[i].isBold, color: { argb: 'FF0F172A' } };
    rightValCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  // Border boxes around both cards (Rows 5-9)
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
    for (let rowNum = 5; rowNum <= 9; rowNum++) {
      const c = sheet.getCell(`${col}${rowNum}`);
      c.border = cardBorder;
    }
  });

  // Row 10: Spacer
  sheet.getRow(10).height = 10;

  // Rows 11-13: 4 Executive KPI Cards horizontally
  // Card 1: Balance Forward (Cols A-B)
  sheet.mergeCells('A11:B11');
  sheet.getCell('A11').value = 'BALANCE FORWARD';
  sheet.getCell('A11').font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
  sheet.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

  sheet.mergeCells('A12:B12');
  const kpi1Val = sheet.getCell('A12');
  kpi1Val.value = Number(data.summary?.balanceForward || 0);
  kpi1Val.numFmt = CURRENCY_FORMAT;
  kpi1Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  kpi1Val.alignment = { horizontal: 'center', vertical: 'middle' };
  kpi1Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

  sheet.mergeCells('A13:B13');
  sheet.getCell('A13').value = `As of ${fromDateStr}`;
  sheet.getCell('A13').font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF94A3B8' } };
  sheet.getCell('A13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

  // Card 2: Total Rent Due / Invoiced (Cols C-D)
  sheet.mergeCells('C11:D11');
  sheet.getCell('C11').value = 'TOTAL RENT DUE';
  sheet.getCell('C11').font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB45309' } };
  sheet.getCell('C11').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };

  sheet.mergeCells('C12:D12');
  const kpi2Val = sheet.getCell('C12');
  kpi2Val.value = Number(data.summary?.totalRentDue || 0);
  kpi2Val.numFmt = CURRENCY_FORMAT;
  kpi2Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF92400E' } };
  kpi2Val.alignment = { horizontal: 'center', vertical: 'middle' };
  kpi2Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };

  sheet.mergeCells('C13:D13');
  sheet.getCell('C13').value = 'Total charged in period';
  sheet.getCell('C13').font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FFB45309' } };
  sheet.getCell('C13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };

  // Card 3: Total Payments Received (Cols E-F)
  sheet.mergeCells('E11:F11');
  sheet.getCell('E11').value = 'TOTAL PAYMENTS RECEIVED';
  sheet.getCell('E11').font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF047857' } };
  sheet.getCell('E11').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

  sheet.mergeCells('E12:F12');
  const kpi3Val = sheet.getCell('E12');
  kpi3Val.value = Number(data.summary?.totalPayments || 0);
  kpi3Val.numFmt = CURRENCY_FORMAT;
  kpi3Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF065F46' } };
  kpi3Val.alignment = { horizontal: 'center', vertical: 'middle' };
  kpi3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

  sheet.mergeCells('E13:F13');
  sheet.getCell('E13').value = 'Total credits applied';
  sheet.getCell('E13').font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF047857' } };
  sheet.getCell('E13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

  // Card 4: Net Outstanding (Col G)
  const isOverdue = Number(data.summary?.totalOutstanding || 0) > 0;
  const kpi4Bg = isOverdue ? 'FFFFE4E6' : 'FFD1FAE5';
  const kpi4Fg = isOverdue ? 'FF9F1239' : 'FF065F46';

  sheet.getCell('G11').value = 'NET OUTSTANDING';
  sheet.getCell('G11').font = { name: 'Calibri', size: 9, bold: true, color: { argb: isOverdue ? 'FFBE123C' : 'FF047857' } };
  sheet.getCell('G11').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('G11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi4Bg } };

  const kpi4Val = sheet.getCell('G12');
  kpi4Val.value = Number(data.summary?.totalOutstanding || 0);
  kpi4Val.numFmt = CURRENCY_FORMAT;
  kpi4Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: kpi4Fg } };
  kpi4Val.alignment = { horizontal: 'center', vertical: 'middle' };
  kpi4Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi4Bg } };

  sheet.getCell('G13').value = isOverdue ? 'Payment required' : 'Paid in full';
  sheet.getCell('G13').font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: isOverdue ? 'FFBE123C' : 'FF047857' } };
  sheet.getCell('G13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('G13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi4Bg } };

  sheet.getRow(11).height = 18;
  sheet.getRow(12).height = 24;
  sheet.getRow(13).height = 16;

  // Add borders to KPI cards
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
    for (let r = 11; r <= 13; r++) {
      sheet.getCell(`${col}${r}`).border = cardBorder;
    }
  });

  // Row 14: Spacer
  sheet.getRow(14).height = 10;

  // Row 15: Table Header
  sheet.getRow(15).height = 26;
  const colHeaders = [
    { col: 'A', label: 'Date', align: 'center' },
    { col: 'B', label: 'Reference', align: 'center' },
    { col: 'C', label: 'Description', align: 'left' },
    { col: 'D', label: isAll ? 'Tenant / Payee' : 'Payee / Account', align: 'left' },
    { col: 'E', label: 'Debit (£)', align: 'right' },
    { col: 'F', label: 'Credit (£)', align: 'right' },
    { col: 'G', label: 'Balance (£)', align: 'right' },
  ];

  colHeaders.forEach((h) => {
    const c = sheet.getCell(`${h.col}15`);
    c.value = h.label;
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    c.alignment = { horizontal: h.align, vertical: 'middle', indent: h.align === 'left' ? 1 : 0 };
    c.border = thinBorder;
  });

  // Rows 16+: Statement Transactions
  let currentRow = 16;
  const txns = data.transactions || [];

  txns.forEach((txn, idx) => {
    sheet.getRow(currentRow).height = 21;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    // Date
    const cDate = sheet.getCell(`A${currentRow}`);
    cDate.value = formatUKDate(txn.date);
    cDate.alignment = { horizontal: 'center', vertical: 'middle' };

    // Reference
    const cRef = sheet.getCell(`B${currentRow}`);
    cRef.value = txn.reference || '—';
    cRef.alignment = { horizontal: 'center', vertical: 'middle' };
    cRef.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };

    // Description
    const cDesc = sheet.getCell(`C${currentRow}`);
    cDesc.value = txn.description || '—';
    cDesc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cDesc.font = { name: 'Calibri', size: 9.5, bold: txn.description === 'Starting Balance', color: { argb: 'FF0F172A' } };

    // Payee
    const cPayee = sheet.getCell(`D${currentRow}`);
    cPayee.value = txn.payee || '—';
    cPayee.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cPayee.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };

    // Debit
    const cDebit = sheet.getCell(`E${currentRow}`);
    const debitVal = Number(txn.debit || 0);
    if (debitVal > 0) {
      cDebit.value = debitVal;
      cDebit.numFmt = CURRENCY_FORMAT;
      cDebit.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    } else {
      cDebit.value = '-';
      cDebit.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF94A3B8' } };
    }
    cDebit.alignment = { horizontal: 'right', vertical: 'middle' };

    // Credit
    const cCredit = sheet.getCell(`F${currentRow}`);
    const creditVal = Number(txn.credit || 0);
    if (creditVal > 0) {
      cCredit.value = creditVal;
      cCredit.numFmt = CURRENCY_FORMAT;
      cCredit.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF047857' } };
    } else {
      cCredit.value = '-';
      cCredit.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF94A3B8' } };
    }
    cCredit.alignment = { horizontal: 'right', vertical: 'middle' };

    // Balance
    const cBal = sheet.getCell(`G${currentRow}`);
    const balVal = Number(txn.balance !== undefined ? txn.balance : 0);
    cBal.value = balVal;
    cBal.numFmt = CURRENCY_FORMAT;
    cBal.font = {
      name: 'Calibri',
      size: 9.5,
      bold: true,
      color: { argb: balVal > 0 ? 'FF9F1239' : balVal < 0 ? 'FF047857' : 'FF0F172A' },
    };
    cBal.alignment = { horizontal: 'right', vertical: 'middle' };

    // Row styling & borders
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
      const cell = sheet.getCell(`${col}${currentRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = thinBorder;
      if (!cell.font) cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } };
    });

    currentRow++;
  });

  // Accounting Summary Totals Row
  sheet.getRow(currentRow).height = 24;

  sheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const totLabel = sheet.getCell(`A${currentRow}`);
  totLabel.value = 'TOTALS FOR STATEMENT PERIOD:';
  totLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  totLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

  const totDebit = sheet.getCell(`E${currentRow}`);
  totDebit.value = Number(data.summary?.totalRentDue || 0);
  totDebit.numFmt = CURRENCY_FORMAT;
  totDebit.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
  totDebit.alignment = { horizontal: 'right', vertical: 'middle' };

  const totCredit = sheet.getCell(`F${currentRow}`);
  totCredit.value = Number(data.summary?.totalPayments || 0);
  totCredit.numFmt = CURRENCY_FORMAT;
  totCredit.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF047857' } };
  totCredit.alignment = { horizontal: 'right', vertical: 'middle' };

  const totBal = sheet.getCell(`G${currentRow}`);
  totBal.value = Number(data.summary?.totalOutstanding || 0);
  totBal.numFmt = CURRENCY_FORMAT;
  totBal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: isOverdue ? 'FF9F1239' : 'FF047857' } };
  totBal.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalsBorder = {
    top: { style: 'thin', color: { argb: 'FF0F172A' } },
    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
    const cell = sheet.getCell(`${col}${currentRow}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = totalsBorder;
  });

  currentRow += 2;

  // Closing Balance Callout Box
  sheet.mergeCells(`D${currentRow}:G${currentRow}`);
  const callout = sheet.getCell(`D${currentRow}`);
  callout.value = `CLOSING BALANCE AT ${toDateStr}:  ${data.summary?.totalOutstandingFormatted || (Number(data.summary?.totalOutstanding || 0)).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}`;
  callout.font = { name: 'Calibri', size: 11, bold: true, color: { argb: isOverdue ? 'FF9F1239' : 'FF065F46' } };
  callout.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOverdue ? 'FFFFE4E6' : 'FFD1FAE5' } };
  callout.alignment = { horizontal: 'center', vertical: 'middle' };
  callout.border = {
    top: { style: 'medium', color: { argb: isOverdue ? 'FFE11D48' : 'FF059669' } },
    bottom: { style: 'medium', color: { argb: isOverdue ? 'FFE11D48' : 'FF059669' } },
    left: { style: 'medium', color: { argb: isOverdue ? 'FFE11D48' : 'FF059669' } },
    right: { style: 'medium', color: { argb: isOverdue ? 'FFE11D48' : 'FF059669' } },
  };
  sheet.getRow(currentRow).height = 26;

  currentRow += 2;

  // Statement Footer Note
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const footerNote = sheet.getCell(`A${currentRow}`);
  footerNote.value = 'Please check this statement carefully. All payments should be remitted using your tenant reference number. Contact management for any discrepancies.';
  footerNote.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  footerNote.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(currentRow).height = 18;

  currentRow += 1;
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const footerSys = sheet.getCell(`A${currentRow}`);
  footerSys.value = `Generated on ${statementDateStr} by UK Pixxtechnolgies UK Property Management System`;
  footerSys.font = { name: 'Calibri', size: 8.5, color: { argb: 'FF94A3B8' } };
  footerSys.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(currentRow).height = 16;

  return await workbook.xlsx.writeBuffer();
}

async function generateLandlordExcelWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies';
  workbook.lastModifiedBy = 'PixxTechnologies';
  workbook.created = new Date();

  const landlordName = data.landlord?.name || 'Landlord';
  const trackingMonths = data.trackingMonths && data.trackingMonths.length === 3 ? data.trackingMonths : ['Jun-26', 'Jul-26', 'Aug-26'];
  
  // Construct default unit rows if unitMatrixRows is empty
  let unitRows = data.unitMatrixRows || [];
  if (unitRows.length === 0 && data.propertiesBreakdown) {
    unitRows = data.propertiesBreakdown.map((p, idx) => ({
      no: idx + 1,
      propertyAddress: p.propertyName || p.name || `Property ${idx + 1}`,
      rent: p.totalRentDue || 1500,
      mFee: -50,
      dueDate: '1st',
      netRentReceivable: (p.totalRentDue || 1500) - 50,
      collections: [
        { date: '6/3/2026', amount: (p.totalRentDue || 1500) - 50, status: 'Paid' },
        { date: '7/3/2026', amount: (p.totalRentDue || 1500) - 50, status: 'Paid' },
        { date: '', amount: 0, status: 'Unpaid' },
      ],
    }));
  }

  // =========================================================================
  // SHEET 1: RENT INCOME REPORT (Rent Roll & Multi-Month Tracker Matrix)
  // =========================================================================
  const sheet1 = workbook.addWorksheet('Rent Income Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToWidth: 1 },
    views: [{ showGridLines: true, state: 'frozen', ySplit: 6 }],
  });

  // 1. Title Headers
  sheet1.mergeCells('A1:L1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = landlordName;
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 26;

  sheet1.mergeCells('A2:L2');
  const subTitleCell = sheet1.getCell('A2');
  subTitleCell.value = 'RENT INCOME REPORT';
  subTitleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(2).height = 20;

  const monthPeriodText = trackingMonths[2] || 'Aug-26';
  sheet1.mergeCells('A3:L3');
  const periodCell = sheet1.getCell('A3');
  periodCell.value = monthPeriodText;
  periodCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF475569' } };
  periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(3).height = 18;

  // 2. Table Headers (Row 5 & Row 6)
  sheet1.getRow(5).height = 22;
  sheet1.getRow(6).height = 20;

  // Left headers merged across Row 5 & 6
  sheet1.mergeCells('A5:A6');
  sheet1.getCell('A5').value = 'No';

  sheet1.mergeCells('B5:B6');
  sheet1.getCell('B5').value = 'Property Address';

  sheet1.mergeCells('C5:C6');
  sheet1.getCell('C5').value = 'Rent';

  sheet1.mergeCells('D5:D6');
  sheet1.getCell('D5').value = 'M. Fee';

  sheet1.mergeCells('E5:E6');
  const dueHeader = sheet1.getCell('E5');
  dueHeader.value = 'Due Date';

  sheet1.mergeCells('F5:F6');
  sheet1.getCell('F5').value = 'Net Rent\nReceivable';
  sheet1.getCell('F5').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

  // Month 1 Header (Cols G & H)
  sheet1.mergeCells('G5:H5');
  sheet1.getCell('G5').value = trackingMonths[0];
  sheet1.getCell('G6').value = 'Date';
  sheet1.getCell('H6').value = 'Amount';

  // Month 2 Header (Cols I & J)
  sheet1.mergeCells('I5:J5');
  sheet1.getCell('I5').value = trackingMonths[1];
  sheet1.getCell('I6').value = 'Date';
  sheet1.getCell('J6').value = 'Amount';

  // Month 3 Header (Cols K & L)
  sheet1.mergeCells('K5:L5');
  sheet1.getCell('K5').value = trackingMonths[2];
  sheet1.getCell('K6').value = 'Date';
  sheet1.getCell('L6').value = 'Amount';

  // Style Header Cells
  const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  [5, 6].forEach((rIdx) => {
    headerCols.forEach((col) => {
      const cell = sheet1.getCell(`${col}${rIdx}`);
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = cell.alignment || { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;

      if (col === 'E') {
        // Due Date header - Yellow Fill
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
      }
    });
  });

  // 3. Data Rows (Starting Row 7)
  let currRow = 7;
  unitRows.forEach((r, idx) => {
    sheet1.getRow(currRow).height = 24;

    // No
    const cNo = sheet1.getCell(`A${currRow}`);
    cNo.value = idx + 1;
    cNo.alignment = { horizontal: 'center', vertical: 'middle' };
    cNo.font = { name: 'Calibri', size: 10, bold: true };
    cNo.border = thinBorder;

    // Property Address
    const cAddr = sheet1.getCell(`B${currRow}`);
    cAddr.value = r.propertyAddress;
    cAddr.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cAddr.font = { name: 'Calibri', size: 10, bold: true };
    cAddr.border = thinBorder;

    // Rent
    const cRent = sheet1.getCell(`C${currRow}`);
    cRent.value = r.rent;
    cRent.numFmt = '£#,##0;[Red](£#,##0);"-"';
    cRent.alignment = { horizontal: 'right', vertical: 'middle' };
    cRent.font = { name: 'Calibri', size: 10 };
    cRent.border = thinBorder;

    // M. Fee
    const cMFee = sheet1.getCell(`D${currRow}`);
    cMFee.value = r.mFee;
    cMFee.numFmt = '£#,##0;[Red]-£#,##0;"-"';
    cMFee.alignment = { horizontal: 'right', vertical: 'middle' };
    cMFee.font = { name: 'Calibri', size: 10, color: r.mFee < 0 ? { argb: 'FFDC2626' } : { argb: 'FF000000' } };
    cMFee.border = thinBorder;

    // Due Date (Yellow Fill)
    const cDue = sheet1.getCell(`E${currRow}`);
    cDue.value = r.dueDate;
    cDue.alignment = { horizontal: 'center', vertical: 'middle' };
    cDue.font = { name: 'Calibri', size: 10, bold: true };
    cDue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
    cDue.border = thinBorder;

    // Net Rent Receivable
    const cNet = sheet1.getCell(`F${currRow}`);
    cNet.value = r.netRentReceivable;
    cNet.numFmt = '£#,##0;[Red](£#,##0);"-"';
    cNet.alignment = { horizontal: 'right', vertical: 'middle' };
    cNet.font = { name: 'Calibri', size: 10, bold: true };
    cNet.border = thinBorder;

    // Collections (Cols G-H, I-J, K-L)
    const monthPairs = [
      { dateCol: 'G', amtCol: 'H', data: r.collections?.[0] },
      { dateCol: 'I', amtCol: 'J', data: r.collections?.[1] },
      { dateCol: 'K', amtCol: 'L', data: r.collections?.[2] },
    ];

    monthPairs.forEach((m) => {
      const cD = sheet1.getCell(`${m.dateCol}${currRow}`);
      const cA = sheet1.getCell(`${m.amtCol}${currRow}`);

      cD.border = thinBorder;
      cA.border = thinBorder;
      cD.alignment = { horizontal: 'center', vertical: 'middle' };
      cA.alignment = { horizontal: 'right', vertical: 'middle' };

      if (!m.data || m.data.status === 'Unpaid' || !m.data.amount) {
        // Soft red background tint for unpaid/missed collection
        const softRedFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
        cD.fill = softRedFill;
        cA.fill = softRedFill;
        cD.value = '-';
        cD.font = { name: 'Calibri', size: 9, color: { argb: '991B1B' } };
        cA.value = 0;
        cA.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
        cA.font = { name: 'Calibri', size: 10, color: { argb: '991B1B' } };
      } else {
        cD.value = m.data.date || '';
        cD.font = { name: 'Calibri', size: 9 };

        cA.value = m.data.amount;
        cA.numFmt = '#,##0.00';
        cA.font = { name: 'Calibri', size: 10 };

        if (m.data.status === 'Partial') {
          const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
          cD.fill = yellowFill;
          cA.fill = yellowFill;
        }
      }
    });

    currRow++;
  });

  // 4. Grand Total Income Row (Bottom Summary)
  sheet1.getRow(currRow).height = 28;

  sheet1.mergeCells(`A${currRow}:B${currRow}`);
  const totLabel = sheet1.getCell(`A${currRow}`);
  totLabel.value = 'Grand Total Income';
  totLabel.font = { name: 'Calibri', size: 13, bold: true };
  totLabel.alignment = { horizontal: 'left', vertical: 'middle' };

  const lastDataRow = currRow - 1;

  // Rent Total
  const tRent = sheet1.getCell(`C${currRow}`);
  tRent.value = { formula: `SUM(C7:C${lastDataRow})` };
  tRent.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tRent.font = { name: 'Calibri', size: 13, bold: true };
  tRent.alignment = { horizontal: 'right', vertical: 'middle' };

  // M. Fee Total
  const tMFee = sheet1.getCell(`D${currRow}`);
  tMFee.value = { formula: `SUM(D7:D${lastDataRow})` };
  tMFee.numFmt = '£#,##0;[Red]-£#,##0;"-"';
  tMFee.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFDC2626' } };
  tMFee.alignment = { horizontal: 'right', vertical: 'middle' };

  // Blank E
  sheet1.getCell(`E${currRow}`).value = '';

  // Net Receivable Total
  const tNet = sheet1.getCell(`F${currRow}`);
  tNet.value = { formula: `SUM(F7:F${lastDataRow})` };
  tNet.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tNet.font = { name: 'Calibri', size: 13, bold: true };
  tNet.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 1 Total Collected (H)
  sheet1.getCell(`G${currRow}`).value = '';
  const tM1 = sheet1.getCell(`H${currRow}`);
  tM1.value = { formula: `SUM(H7:H${lastDataRow})` };
  tM1.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM1.font = { name: 'Calibri', size: 13, bold: true };
  tM1.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 2 Total Collected (J)
  sheet1.getCell(`I${currRow}`).value = '';
  const tM2 = sheet1.getCell(`J${currRow}`);
  tM2.value = { formula: `SUM(J7:J${lastDataRow})` };
  tM2.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM2.font = { name: 'Calibri', size: 13, bold: true };
  tM2.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 3 Total Collected (L)
  sheet1.getCell(`K${currRow}`).value = '';
  const tM3 = sheet1.getCell(`L${currRow}`);
  tM3.value = { formula: `SUM(L7:L${lastDataRow})` };
  tM3.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM3.font = { name: 'Calibri', size: 13, bold: true };
  tM3.alignment = { horizontal: 'right', vertical: 'middle' };

  // Total Row Border
  const totalRowBorder = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'double', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  headerCols.forEach((col) => {
    sheet1.getCell(`${col}${currRow}`).border = totalRowBorder;
  });

  // Column Widths
  sheet1.getColumn('A').width = 6;
  sheet1.getColumn('B').width = 44;
  sheet1.getColumn('C').width = 14;
  sheet1.getColumn('D').width = 12;
  sheet1.getColumn('E').width = 12;
  sheet1.getColumn('F').width = 16;
  sheet1.getColumn('G').width = 12;
  sheet1.getColumn('H').width = 12;
  sheet1.getColumn('I').width = 12;
  sheet1.getColumn('J').width = 12;
  sheet1.getColumn('K').width = 12;
  sheet1.getColumn('L').width = 12;

  // =========================================================================
  // SHEET 2: PORTFOLIO SUMMARY (Property Breakdown)
  // =========================================================================
  const sheet2 = workbook.addWorksheet('Portfolio Summary');
  sheet2.views = [{ showGridLines: true }];

  // Sheet 2 Header
  sheet2.mergeCells('A1:H1');
  const s2Title = sheet2.getCell('A1');
  s2Title.value = `${landlordName} - PORTFOLIO FINANCIAL SUMMARY`;
  s2Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  s2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet2.getRow(1).height = 28;

  sheet2.getRow(3).values = ['Property Name', 'Type', 'Total Units', 'Occupied', 'Rent Due (£)', 'Received (£)', 'Expenses (£)', 'Net Income (£)'];
  sheet2.getRow(3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3'].forEach((cellRef) => {
    sheet2.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    sheet2.getCell(cellRef).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const pRows = data.propertiesBreakdown || data.properties || [];
  let s2RowIdx = 4;
  pRows.forEach((p) => {
    sheet2.getRow(s2RowIdx).values = [
      p.propertyName || p.name,
      p.propertyType || 'Residential',
      p.totalUnits || 1,
      p.occupiedUnits || 1,
      p.totalRentDue || 0,
      p.totalPaid || 0,
      p.totalExpenses || 0,
      p.netIncome || 0,
    ];

    ['E', 'F', 'G', 'H'].forEach((c) => {
      sheet2.getCell(`${c}${s2RowIdx}`).numFmt = '£#,##0.00';
    });

    s2RowIdx++;
  });

  sheet2.getColumn('A').width = 30;
  sheet2.getColumn('B').width = 16;
  sheet2.getColumn('C').width = 14;
  sheet2.getColumn('D').width = 14;
  sheet2.getColumn('E').width = 18;
  sheet2.getColumn('F').width = 18;
  sheet2.getColumn('G').width = 18;
  sheet2.getColumn('H').width = 18;

  return await workbook.xlsx.writeBuffer();
}

async function generateAgentExcelWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies';
  workbook.lastModifiedBy = 'PixxTechnologies';
  workbook.created = new Date();

  const agentName = data.agent?.name || 'Agent';
  const assignedUnits = data.assignedUnits || [];
  const settlements = data.settlements || [];

  // ==========================================
  // SHEET 1: ASSIGNED PROPERTIES & UNITS
  // ==========================================
  const sheet1 = workbook.addWorksheet('Assigned Operating Units', {
    views: [{ showGridLines: true }],
  });

  // Emerald brand accent bar
  sheet1.mergeCells('A1:I1');
  const bar = sheet1.getCell('A1');
  bar.value = '';
  bar.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  sheet1.getRow(1).height = 6;

  // Title Row
  sheet1.mergeCells('A2:I2');
  const title = sheet1.getCell('A2');
  title.value = `AGENT OPERATING UNITS & PROPERTIES REPORT`;
  title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  title.alignment = { vertical: 'middle' };
  sheet1.getRow(2).height = 30;

  // Subtitle / Metadata
  sheet1.mergeCells('A3:I3');
  const sub = sheet1.getCell('A3');
  sub.value = `Agent: ${agentName}  |  Phone: ${data.agent?.phone || '-'}  |  Region: ${data.agent?.region || 'All'}  |  Date: ${formatUKDate(data.reportDate)}`;
  sub.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
  sub.alignment = { vertical: 'middle' };
  sheet1.getRow(3).height = 20;

  // KPI Summary Cards on Row 5
  sheet1.getRow(5).height = 36;
  const kpis = [
    { cell: 'A5:B5', label: 'TOTAL ASSIGNED UNITS', val: assignedUnits.length, color: 'FF0F172A', bg: 'FFF1F5F9' },
    { cell: 'C5:D5', label: 'OCCUPIED UNITS', val: assignedUnits.filter((u) => u.status === 'Occupied').length, color: 'FF059669', bg: 'FFECFDF5' },
    { cell: 'E5:F5', label: 'VACANT UNITS', val: assignedUnits.filter((u) => u.status !== 'Occupied').length, color: 'FFD97706', bg: 'FFFFFBEB' },
    { cell: 'G5:I5', label: 'TOTAL MONTHLY RENT', val: assignedUnits.reduce((sum, u) => sum + (Number(u.monthlyRent) || 0), 0), isCurrency: true, color: 'FF2563EB', bg: 'FFEFF6FF' },
  ];

  kpis.forEach((k) => {
    sheet1.mergeCells(k.cell);
    const startCell = sheet1.getCell(k.cell.split(':')[0]);
    startCell.value = `${k.label}: ${k.isCurrency ? `£${k.val.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : k.val}`;
    startCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: k.color } };
    startCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } };
    startCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startCell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  // Table Headers
  sheet1.getRow(7).height = 26;
  const unitHeaders = [
    { col: 'A', title: '#', width: 6, align: 'center' },
    { col: 'B', title: 'Property / Unit Name', width: 30, align: 'left' },
    { col: 'C', title: 'Asset Type', width: 16, align: 'left' },
    { col: 'D', title: 'Status', width: 14, align: 'center' },
    { col: 'E', title: 'Current Tenant', width: 24, align: 'left' },
    { col: 'F', title: 'Monthly Rent (£)', width: 18, align: 'right' },
    { col: 'G', title: 'Agent Fee (£)', width: 16, align: 'right' },
    { col: 'H', title: 'Tenancy Start', width: 16, align: 'center' },
    { col: 'I', title: 'Landlord', width: 22, align: 'left' },
  ];

  unitHeaders.forEach((h) => {
    const c = sheet1.getCell(`${h.col}7`);
    c.value = h.title;
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    c.alignment = { horizontal: h.align, vertical: 'middle' };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'thin', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
    sheet1.getColumn(h.col).width = h.width;
  });

  // Data Rows
  let uRow = 8;
  assignedUnits.forEach((u, idx) => {
    sheet1.getRow(uRow).height = 22;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const cellA = sheet1.getCell(`A${uRow}`);
    cellA.value = idx + 1;
    cellA.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellB = sheet1.getCell(`B${uRow}`);
    cellB.value = u.propertyName;
    cellB.font = { name: 'Calibri', size: 10, bold: true };
    cellB.alignment = { horizontal: 'left', vertical: 'middle' };

    const cellC = sheet1.getCell(`C${uRow}`);
    cellC.value = u.type || 'Commercial';
    cellC.alignment = { horizontal: 'left', vertical: 'middle' };

    const cellD = sheet1.getCell(`D${uRow}`);
    cellD.value = u.status;
    cellD.font = { name: 'Calibri', size: 10, bold: true, color: { argb: u.status === 'Occupied' ? 'FF059669' : 'FFD97706' } };
    cellD.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellE = sheet1.getCell(`E${uRow}`);
    cellE.value = u.tenantName || 'Vacant';
    cellE.font = { name: 'Calibri', size: 10, italic: u.tenantName === 'Vacant' };
    cellE.alignment = { horizontal: 'left', vertical: 'middle' };

    const cellF = sheet1.getCell(`F${uRow}`);
    cellF.value = Number(u.monthlyRent) || 0;
    cellF.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cellF.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellG = sheet1.getCell(`G${uRow}`);
    cellG.value = Number(u.agentFee) || 0;
    cellG.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cellG.alignment = { horizontal: 'right', vertical: 'middle' };

    const cellH = sheet1.getCell(`H${uRow}`);
    cellH.value = u.startDate || '-';
    cellH.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellI = sheet1.getCell(`I${uRow}`);
    cellI.value = u.landlordName || '-';
    cellI.alignment = { horizontal: 'left', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
      const c = sheet1.getCell(`${col}${uRow}`);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    uRow++;
  });

  // Totals Row
  sheet1.getRow(uRow).height = 26;
  sheet1.mergeCells(`A${uRow}:E${uRow}`);
  const totLabel = sheet1.getCell(`A${uRow}`);
  totLabel.value = `TOTALS (${assignedUnits.length} UNITS)`;
  totLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  totLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const totRent = sheet1.getCell(`F${uRow}`);
  totRent.value = { formula: assignedUnits.length > 0 ? `SUM(F8:F${uRow - 1})` : '0' };
  totRent.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  totRent.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  totRent.alignment = { horizontal: 'right', vertical: 'middle' };

  const totFee = sheet1.getCell(`G${uRow}`);
  totFee.value = { formula: assignedUnits.length > 0 ? `SUM(G8:G${uRow - 1})` : '0' };
  totFee.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  totFee.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF059669' } };
  totFee.alignment = { horizontal: 'right', vertical: 'middle' };

  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
    const c = sheet1.getCell(`${col}${uRow}`);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  // ==========================================
  // SHEET 2: MONTHLY SETTLEMENTS & COLLECTIONS
  // ==========================================
  const sheet2 = workbook.addWorksheet('Settlements & Ledger', {
    views: [{ showGridLines: true }],
  });

  // Accent bar
  sheet2.mergeCells('A1:H1');
  const bar2 = sheet2.getCell('A1');
  bar2.value = '';
  bar2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  sheet2.getRow(1).height = 6;

  sheet2.mergeCells('A2:H2');
  const title2 = sheet2.getCell('A2');
  title2.value = `AGENT MONTHLY SETTLEMENTS & FINANCIAL LEDGER`;
  title2.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { vertical: 'middle' };
  sheet2.getRow(2).height = 30;

  sheet2.mergeCells('A3:H3');
  const sub2 = sheet2.getCell('A3');
  sub2.value = `Agent: ${agentName}  |  Period: ${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`;
  sub2.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
  sub2.alignment = { vertical: 'middle' };
  sheet2.getRow(3).height = 20;

  // Headers for Sheet 2
  sheet2.getRow(5).height = 26;
  const s2Headers = [
    { col: 'A', title: 'Month/Year', width: 14, align: 'center' },
    { col: 'B', title: 'Property', width: 28, align: 'left' },
    { col: 'C', title: 'Tenant', width: 22, align: 'left' },
    { col: 'D', title: 'Expected (£)', width: 18, align: 'right' },
    { col: 'E', title: 'Expense (£)', width: 18, align: 'right' },
    { col: 'F', title: 'Net (£)', width: 18, align: 'right' },
    { col: 'G', title: 'Received (£)', width: 18, align: 'right' },
    { col: 'H', title: 'Status', width: 16, align: 'center' },
  ];

  s2Headers.forEach((h) => {
    const c = sheet2.getCell(`${h.col}5`);
    c.value = h.title;
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    c.alignment = { horizontal: h.align, vertical: 'middle' };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'thin', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
    sheet2.getColumn(h.col).width = h.width;
  });

  let sRow = 6;
  settlements.forEach((s, idx) => {
    sheet2.getRow(sRow).height = 22;
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    sheet2.getCell(`A${sRow}`).value = s.monthYear;
    sheet2.getCell(`A${sRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet2.getCell(`B${sRow}`).value = s.property;
    sheet2.getCell(`B${sRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

    sheet2.getCell(`C${sRow}`).value = s.tenant;
    sheet2.getCell(`C${sRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

    const cExp = sheet2.getCell(`D${sRow}`);
    cExp.value = Number(s.expectedAmount) || 0;
    cExp.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cExp.alignment = { horizontal: 'right', vertical: 'middle' };

    const cDed = sheet2.getCell(`E${sRow}`);
    cDed.value = Number(s.expenseAmount) || 0;
    cDed.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cDed.alignment = { horizontal: 'right', vertical: 'middle' };

    const cNet = sheet2.getCell(`F${sRow}`);
    cNet.value = Number(s.netAmount) || 0;
    cNet.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cNet.font = { name: 'Calibri', size: 10, bold: true };
    cNet.alignment = { horizontal: 'right', vertical: 'middle' };

    const cRec = sheet2.getCell(`G${sRow}`);
    cRec.value = Number(s.paidAmount) || 0;
    cRec.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
    cRec.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };
    cRec.alignment = { horizontal: 'right', vertical: 'middle' };

    const cSt = sheet2.getCell(`H${sRow}`);
    cSt.value = s.status || 'Pending';
    cSt.alignment = { horizontal: 'center', vertical: 'middle' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
      const c = sheet2.getCell(`${col}${sRow}`);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    sRow++;
  });

  // Totals Row for Sheet 2
  sheet2.getRow(sRow).height = 26;
  sheet2.mergeCells(`A${sRow}:C${sRow}`);
  const s2TotLabel = sheet2.getCell(`A${sRow}`);
  s2TotLabel.value = 'TOTALS';
  s2TotLabel.font = { name: 'Calibri', size: 11, bold: true };
  s2TotLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const s2ExpTot = sheet2.getCell(`D${sRow}`);
  s2ExpTot.value = { formula: settlements.length > 0 ? `SUM(D6:D${sRow - 1})` : '0' };
  s2ExpTot.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  s2ExpTot.font = { name: 'Calibri', size: 11, bold: true };
  s2ExpTot.alignment = { horizontal: 'right', vertical: 'middle' };

  const s2DedTot = sheet2.getCell(`E${sRow}`);
  s2DedTot.value = { formula: settlements.length > 0 ? `SUM(E6:E${sRow - 1})` : '0' };
  s2DedTot.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  s2DedTot.font = { name: 'Calibri', size: 11, bold: true };
  s2DedTot.alignment = { horizontal: 'right', vertical: 'middle' };

  const s2NetTot = sheet2.getCell(`F${sRow}`);
  s2NetTot.value = { formula: settlements.length > 0 ? `SUM(F6:F${sRow - 1})` : '0' };
  s2NetTot.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  s2NetTot.font = { name: 'Calibri', size: 11, bold: true };
  s2NetTot.alignment = { horizontal: 'right', vertical: 'middle' };

  const s2RecTot = sheet2.getCell(`G${sRow}`);
  s2RecTot.value = { formula: settlements.length > 0 ? `SUM(G6:G${sRow - 1})` : '0' };
  s2RecTot.numFmt = '£#,##0.00;[Red](£#,##0.00);"-"';
  s2RecTot.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF059669' } };
  s2RecTot.alignment = { horizontal: 'right', vertical: 'middle' };

  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    const c = sheet2.getCell(`${col}${sRow}`);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  return await workbook.xlsx.writeBuffer();
}

async function generatePropertyExcelWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies';
  workbook.lastModifiedBy = 'PixxTechnologies';
  workbook.created = new Date();

  const propertyName = data.property?.name || 'Property';
  const landlordName = data.property?.landlordName || propertyName;
  const trackingMonths = data.trackingMonths && data.trackingMonths.length === 3 ? data.trackingMonths : ['Jun-26', 'Jul-26', 'Aug-26'];

  let unitRows = data.unitMatrixRows || [];
  if (unitRows.length === 0 && (data.unitsBreakdown || data.units)) {
    const unitsList = data.unitsBreakdown || data.units || [];
    unitRows = unitsList.map((u, idx) => {
      const rent = Number(u.monthlyRent || u.price) || 0;
      const mFee = rent > 0 ? -50 : 0;
      const netRentReceivable = rent + mFee;
      return {
        no: idx + 1,
        propertyAddress: `${propertyName}${u.name ? ', ' + u.name : ''}`,
        rent,
        mFee,
        dueDate: '1st',
        netRentReceivable,
        collections: [
          { date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
          { date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
          { date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
        ],
      };
    });
  }

  // =========================================================================
  // SHEET 1: RENT INCOME REPORT (Rent Roll & Multi-Month Tracker Matrix)
  // =========================================================================
  const sheet1 = workbook.addWorksheet('Rent Income Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToWidth: 1 },
    views: [{ showGridLines: true, state: 'frozen', ySplit: 6 }],
  });

  // 1. Title Headers
  sheet1.mergeCells('A1:L1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = landlordName.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 26;

  sheet1.mergeCells('A2:L2');
  const subTitleCell = sheet1.getCell('A2');
  subTitleCell.value = 'RENT SUMMARY';
  subTitleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(2).height = 20;

  const monthPeriodText = trackingMonths[2] || 'Aug-26';
  sheet1.mergeCells('A3:L3');
  const periodCell = sheet1.getCell('A3');
  periodCell.value = monthPeriodText;
  periodCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF475569' } };
  periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(3).height = 18;

  // 2. Table Headers (Row 5 & Row 6)
  sheet1.getRow(5).height = 22;
  sheet1.getRow(6).height = 20;

  // Left headers merged across Row 5 & 6
  sheet1.mergeCells('A5:A6');
  sheet1.getCell('A5').value = 'No';

  sheet1.mergeCells('B5:B6');
  sheet1.getCell('B5').value = 'Property Address';

  sheet1.mergeCells('C5:C6');
  sheet1.getCell('C5').value = 'Rent';

  sheet1.mergeCells('D5:D6');
  sheet1.getCell('D5').value = 'M. Fee';

  sheet1.mergeCells('E5:E6');
  const dueHeader = sheet1.getCell('E5');
  dueHeader.value = 'Due Date';

  sheet1.mergeCells('F5:F6');
  sheet1.getCell('F5').value = 'Net Rent\nReceivable';
  sheet1.getCell('F5').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

  // Month 1 Header (Cols G & H)
  sheet1.mergeCells('G5:H5');
  sheet1.getCell('G5').value = trackingMonths[0];
  sheet1.getCell('G6').value = 'Date';
  sheet1.getCell('H6').value = 'Amount';

  // Month 2 Header (Cols I & J)
  sheet1.mergeCells('I5:J5');
  sheet1.getCell('I5').value = trackingMonths[1];
  sheet1.getCell('I6').value = 'Date';
  sheet1.getCell('J6').value = 'Amount';

  // Month 3 Header (Cols K & L)
  sheet1.mergeCells('K5:L5');
  sheet1.getCell('K5').value = trackingMonths[2];
  sheet1.getCell('K6').value = 'Date';
  sheet1.getCell('L6').value = 'Amount';

  // Style Header Cells
  const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  [5, 6].forEach((rIdx) => {
    headerCols.forEach((col) => {
      const cell = sheet1.getCell(`${col}${rIdx}`);
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = cell.alignment || { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;

      if (col === 'E') {
        // Due Date header - Yellow Fill
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
      }
    });
  });

  // 3. Data Rows (Starting Row 7)
  let currRow = 7;
  unitRows.forEach((r, idx) => {
    sheet1.getRow(currRow).height = 24;

    // No
    const cNo = sheet1.getCell(`A${currRow}`);
    cNo.value = idx + 1;
    cNo.alignment = { horizontal: 'center', vertical: 'middle' };
    cNo.font = { name: 'Calibri', size: 10, bold: true };
    cNo.border = thinBorder;

    // Property Address
    const cAddr = sheet1.getCell(`B${currRow}`);
    cAddr.value = r.propertyAddress;
    cAddr.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cAddr.font = { name: 'Calibri', size: 10, bold: true };
    cAddr.border = thinBorder;

    // Rent
    const cRent = sheet1.getCell(`C${currRow}`);
    cRent.value = r.rent;
    cRent.numFmt = '£#,##0;[Red](£#,##0);"-"';
    cRent.alignment = { horizontal: 'right', vertical: 'middle' };
    cRent.font = { name: 'Calibri', size: 10 };
    cRent.border = thinBorder;

    // M. Fee
    const cMFee = sheet1.getCell(`D${currRow}`);
    cMFee.value = r.mFee;
    cMFee.numFmt = '£#,##0;[Red]-£#,##0;"-"';
    cMFee.alignment = { horizontal: 'right', vertical: 'middle' };
    cMFee.font = { name: 'Calibri', size: 10, color: r.mFee < 0 ? { argb: 'FFDC2626' } : { argb: 'FF000000' } };
    cMFee.border = thinBorder;

    // Due Date (Yellow Fill)
    const cDue = sheet1.getCell(`E${currRow}`);
    cDue.value = r.dueDate;
    cDue.alignment = { horizontal: 'center', vertical: 'middle' };
    cDue.font = { name: 'Calibri', size: 10, bold: true };
    cDue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
    cDue.border = thinBorder;

    // Net Rent Receivable
    const cNet = sheet1.getCell(`F${currRow}`);
    cNet.value = r.netRentReceivable;
    cNet.numFmt = '£#,##0;[Red](£#,##0);"-"';
    cNet.alignment = { horizontal: 'right', vertical: 'middle' };
    cNet.font = { name: 'Calibri', size: 10, bold: true };
    cNet.border = thinBorder;

    // Collections (Cols G-H, I-J, K-L)
    const monthPairs = [
      { dateCol: 'G', amtCol: 'H', data: r.collections?.[0] },
      { dateCol: 'I', amtCol: 'J', data: r.collections?.[1] },
      { dateCol: 'K', amtCol: 'L', data: r.collections?.[2] },
    ];

    monthPairs.forEach((m) => {
      const cD = sheet1.getCell(`${m.dateCol}${currRow}`);
      const cA = sheet1.getCell(`${m.amtCol}${currRow}`);

      cD.border = thinBorder;
      cA.border = thinBorder;
      cD.alignment = { horizontal: 'center', vertical: 'middle' };
      cA.alignment = { horizontal: 'right', vertical: 'middle' };

      if (!m.data || m.data.status === 'Unpaid' || !m.data.amount) {
        const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
        cD.fill = redFill;
        cA.fill = redFill;
        cD.value = '';
        cA.value = '';
      } else {
        cD.value = m.data.date || '';
        cD.font = { name: 'Calibri', size: 9 };

        cA.value = m.data.amount;
        cA.numFmt = '#,##0.00';
        cA.font = { name: 'Calibri', size: 10 };

        if (m.data.status === 'Partial') {
          const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A' } };
          cD.fill = yellowFill;
          cA.fill = yellowFill;
        }
      }
    });

    currRow++;
  });

  // 4. Grand Total Income Row (Bottom Summary)
  sheet1.getRow(currRow).height = 28;

  sheet1.mergeCells(`A${currRow}:B${currRow}`);
  const totLabel = sheet1.getCell(`A${currRow}`);
  totLabel.value = 'Grand Total Income';
  totLabel.font = { name: 'Calibri', size: 13, bold: true };
  totLabel.alignment = { horizontal: 'left', vertical: 'middle' };

  const lastDataRow = currRow - 1;

  // Rent Total
  const tRent = sheet1.getCell(`C${currRow}`);
  tRent.value = { formula: `SUM(C7:C${lastDataRow})` };
  tRent.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tRent.font = { name: 'Calibri', size: 13, bold: true };
  tRent.alignment = { horizontal: 'right', vertical: 'middle' };

  // M. Fee Total
  const tMFee = sheet1.getCell(`D${currRow}`);
  tMFee.value = { formula: `SUM(D7:D${lastDataRow})` };
  tMFee.numFmt = '£#,##0;[Red]-£#,##0;"-"';
  tMFee.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFDC2626' } };
  tMFee.alignment = { horizontal: 'right', vertical: 'middle' };

  sheet1.getCell(`E${currRow}`).value = '';

  // Net Receivable Total
  const tNet = sheet1.getCell(`F${currRow}`);
  tNet.value = { formula: `SUM(F7:F${lastDataRow})` };
  tNet.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tNet.font = { name: 'Calibri', size: 13, bold: true };
  tNet.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 1 Total Collected (H)
  sheet1.getCell(`G${currRow}`).value = '';
  const tM1 = sheet1.getCell(`H${currRow}`);
  tM1.value = { formula: `SUM(H7:H${lastDataRow})` };
  tM1.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM1.font = { name: 'Calibri', size: 13, bold: true };
  tM1.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 2 Total Collected (J)
  sheet1.getCell(`I${currRow}`).value = '';
  const tM2 = sheet1.getCell(`J${currRow}`);
  tM2.value = { formula: `SUM(J7:J${lastDataRow})` };
  tM2.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM2.font = { name: 'Calibri', size: 13, bold: true };
  tM2.alignment = { horizontal: 'right', vertical: 'middle' };

  // Month 3 Total Collected (L)
  sheet1.getCell(`K${currRow}`).value = '';
  const tM3 = sheet1.getCell(`L${currRow}`);
  tM3.value = { formula: `SUM(L7:L${lastDataRow})` };
  tM3.numFmt = '£#,##0;[Red](£#,##0);"-"';
  tM3.font = { name: 'Calibri', size: 13, bold: true };
  tM3.alignment = { horizontal: 'right', vertical: 'middle' };

  // Total Row Border
  const totalRowBorder = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'double', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  headerCols.forEach((col) => {
    sheet1.getCell(`${col}${currRow}`).border = totalRowBorder;
  });

  sheet1.getColumn('A').width = 6;
  sheet1.getColumn('B').width = 44;
  sheet1.getColumn('C').width = 14;
  sheet1.getColumn('D').width = 12;
  sheet1.getColumn('E').width = 12;
  sheet1.getColumn('F').width = 16;
  sheet1.getColumn('G').width = 12;
  sheet1.getColumn('H').width = 12;
  sheet1.getColumn('I').width = 12;
  sheet1.getColumn('J').width = 12;
  sheet1.getColumn('K').width = 12;
  sheet1.getColumn('L').width = 12;

  // Sheet 2: Units Breakdown
  const sheet2 = workbook.addWorksheet('Units Summary');
  sheet2.views = [{ showGridLines: true }];

  sheet2.mergeCells('A1:G1');
  const s2Title = sheet2.getCell('A1');
  s2Title.value = `${propertyName} - UNITS SUMMARY`;
  s2Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  s2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet2.getRow(1).height = 28;

  sheet2.getRow(3).values = ['Unit Name', 'Type', 'Status', 'Tenant', 'Agent', 'Monthly Rent (£)', 'Management Fee (£)'];
  sheet2.getRow(3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'].forEach((cellRef) => {
    sheet2.getCell(cellRef).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    sheet2.getCell(cellRef).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const uRows = data.unitsBreakdown || data.units || [];
  let s2RowIdx = 4;
  uRows.forEach((u) => {
    sheet2.getRow(s2RowIdx).values = [
      u.name || 'Unit',
      u.type || 'Shop',
      u.status || 'Occupied',
      u.tenantName || 'N/A',
      u.agentName || 'None',
      u.monthlyRent || 0,
      u.companyMonthlyAmount || 0,
    ];

    ['F', 'G'].forEach((c) => {
      sheet2.getCell(`${c}${s2RowIdx}`).numFmt = '£#,##0.00';
    });

    s2RowIdx++;
  });

  sheet2.getColumn('A').width = 20;
  sheet2.getColumn('B').width = 16;
  sheet2.getColumn('C').width = 14;
  sheet2.getColumn('D').width = 24;
  sheet2.getColumn('E').width = 20;
  sheet2.getColumn('F').width = 18;
  sheet2.getColumn('G').width = 18;

  return await workbook.xlsx.writeBuffer();
}

async function generateUnitExcelWorkbook(data) {
  return generatePropertyExcelWorkbook(data);
}

async function generatePaymentExcelWorkbook(data) {
  return renderExcelReportWorkbook({
    reportTitle: 'TENANT PAYMENT REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryKPIs: [
      { label: 'Total Payments', value: data.summary.totalPaymentsCount },
      { label: 'Total Rent Due', numValue: data.summary.totalRentDue, value: data.summary.totalRentDueFormatted },
      { label: 'Total Paid', numValue: data.summary.totalPaid, value: data.summary.totalPaidFormatted },
      { label: 'Total Remaining', numValue: data.summary.totalRemaining, value: data.summary.totalRemainingFormatted },
    ],
    columns: [
      { key: 'dueDate', label: 'Due Date', width: 14 },
      { key: 'customerName', label: 'Tenant', width: 24 },
      { key: 'propertyName', label: 'Property', width: 22 },
      { key: 'unitName', label: 'Unit', width: 14 },
      { key: 'paymentMethod', label: 'Method', width: 16 },
      { key: 'amountFormatted', numKey: 'amount', label: 'Due (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'paidAmountFormatted', numKey: 'paidAmount', label: 'Received (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'status', label: 'Status', width: 14 },
    ],
    rows: (data.rows || []).map((r) => ({ ...r, dueDate: formatUKDate(r.dueDate) })),
    totalRow: {
      dueDate: 'TOTALS',
      amount: data.summary.totalRentDue,
      paidAmount: data.summary.totalPaid,
    },
  });
}

async function generateExpenseExcelWorkbook(data) {
  return renderExcelReportWorkbook({
    reportTitle: 'EXPENSE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryKPIs: [
      { label: 'Total Expenses', value: data.summary.totalExpensesCount },
      { label: 'Total Amount', numValue: data.summary.totalAmount, value: data.summary.totalAmountFormatted },
      { label: 'Property Expenses', numValue: data.summary.totalPropertyExpenses, value: data.summary.totalPropertyExpensesFormatted },
      { label: 'Agent Expenses', numValue: data.summary.totalAgentExpenses, value: data.summary.totalAgentExpensesFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 14 },
      { key: 'type', label: 'Type', width: 16 },
      { key: 'propertyName', label: 'Property / Agent', width: 24 },
      { key: 'category', label: 'Category', width: 20 },
      { key: 'supplier', label: 'Supplier', width: 20 },
      { key: 'amountFormatted', numKey: 'amount', label: 'Amount (£)', align: 'right', isCurrency: true, width: 16 },
    ],
    rows: (data.rows || []).map((r) => ({
      ...r,
      date: formatUKDate(r.date),
      propertyName: r.propertyName || r.agentName || '-',
    })),
    totalRow: {
      date: 'TOTALS',
      amount: data.summary.totalAmount,
    },
  });
}

async function generateIncomeExcelWorkbook(data) {
  return renderExcelReportWorkbook({
    reportTitle: 'RENTAL INCOME PERFORMANCE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `Billing Year ${data.year || new Date().getFullYear()}`,
    summaryKPIs: [
      { label: 'Expected Income', numValue: data.summary.totalExpected, value: data.summary.totalExpectedFormatted },
      { label: 'Received Income', numValue: data.summary.totalReceived, value: data.summary.totalReceivedFormatted },
      { label: 'Outstanding Balance', numValue: data.summary.totalOutstanding, value: data.summary.totalOutstandingFormatted },
      { label: 'Collection Rate', value: `${data.summary.collectionRate}%` },
    ],
    columns: [
      { key: 'monthName', label: 'Month', width: 16 },
      { key: 'year', label: 'Year', width: 12 },
      { key: 'expectedFormatted', numKey: 'expected', label: 'Expected (£)', align: 'right', isCurrency: true, width: 18 },
      { key: 'receivedFormatted', numKey: 'received', label: 'Received (£)', align: 'right', isCurrency: true, width: 18 },
      { key: 'outstandingFormatted', numKey: 'outstanding', label: 'Outstanding (£)', align: 'right', isCurrency: true, width: 18 },
    ],
    rows: data.rows || [],
    totalRow: {
      monthName: 'ANNUAL TOTALS',
      expected: data.summary.totalExpected,
      received: data.summary.totalReceived,
      outstanding: data.summary.totalOutstanding,
    },
  });
}

async function generateInvoiceExcelWorkbook(data) {
  return renderExcelReportWorkbook({
    reportTitle: 'RENT INVOICE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryKPIs: [
      { label: 'Total Invoices', value: data.summary.totalInvoices },
      { label: 'Invoiced Amount', numValue: data.summary.totalInvoiced, value: data.summary.totalInvoicedFormatted },
      { label: 'Total Paid', numValue: data.summary.totalPaid, value: data.summary.totalPaidFormatted },
      { label: 'Outstanding Balance', numValue: data.summary.totalOutstanding, value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #', width: 16 },
      { key: 'issueDate', label: 'Issue Date', width: 14 },
      { key: 'tenantName', label: 'Tenant', width: 22 },
      { key: 'propertyName', label: 'Property', width: 22 },
      { key: 'amountFormatted', numKey: 'amount', label: 'Invoiced (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'paidAmountFormatted', numKey: 'paidAmount', label: 'Paid (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'status', label: 'Status', width: 14 },
    ],
    rows: (data.rows || []).map((r) => ({ ...r, issueDate: formatUKDate(r.issueDate) })),
    totalRow: {
      invoiceNumber: 'TOTALS',
      amount: data.summary.totalInvoiced,
      paidAmount: data.summary.totalPaid,
    },
  });
}

async function generateFinancialSummaryExcel(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies Property Management';
  workbook.created = new Date();

  const generatedDateStr = formatUKDate(data.generatedAt || data.reportDate || new Date());
  const periodText = data.fromDate && data.toDate ? `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}` : 'Full Portfolio History';
  const summary = data.summary || {};

  // =========================================================================
  // SHEET 1: EXECUTIVE FINANCIAL SUMMARY
  // =========================================================================
  const sheet1 = workbook.addWorksheet('Financial Summary');
  sheet1.views = [{ showGridLines: true }];

  // Title Banner
  sheet1.mergeCells('A1:E1');
  const tCell = sheet1.getCell('A1');
  tCell.value = 'UK PIXXTECHNOLGIES - FINANCIAL PERFORMANCE SUMMARY';
  tCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  tCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 36;

  // Metadata
  sheet1.getCell('A3').value = 'Report Generated:';
  sheet1.getCell('B3').value = generatedDateStr;
  sheet1.getCell('A3').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet1.getCell('B3').font = { size: 10, color: { argb: 'FF0F172A' } };

  sheet1.getCell('D3').value = 'Report Period:';
  sheet1.getCell('E3').value = periodText;
  sheet1.getCell('D3').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet1.getCell('E3').font = { size: 10, color: { argb: 'FF0F172A' } };

  // Executive KPI Section
  sheet1.mergeCells('A5:E5');
  const kpiHeader = sheet1.getCell('A5');
  kpiHeader.value = 'PORTFOLIO EXECUTIVE FINANCIAL METRICS';
  kpiHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  sheet1.getRow(5).height = 24;

  const kpis = [
    { label: 'Gross Expected Rental Income', val: Number(summary.grossIncome || summary.totalRentDue) || 0, isCur: true },
    { label: 'Total Rental Receipts Cleared', val: Number(summary.totalReceived || summary.totalPaymentsReceived) || 0, isCur: true },
    { label: 'Total Operating Expenses & Deductions', val: Number(summary.totalExpenses) || 0, isCur: true },
    { label: 'Net Operating Financial Position', val: Number(summary.netIncome || summary.netFinancialPosition) || 0, isCur: true },
    { label: 'Outstanding Rent Arrears', val: Number(summary.totalOutstandingRent) || 0, isCur: true },
    { label: 'Portfolio Collection Efficiency', val: `${summary.collectionRate || 0}%`, isCur: false },
    { label: 'Total Bank Mortgage Financing Debt', val: Number(summary.mortgageDebt) || 0, isCur: true },
  ];

  let r = 6;
  kpis.forEach((k) => {
    sheet1.getCell(`A${r}`).value = k.label;
    sheet1.getCell(`A${r}`).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    const valCell = sheet1.getCell(`B${r}`);
    valCell.value = k.val;
    valCell.font = { bold: true, size: 10, color: { argb: 'FF04A26F' } };
    if (k.isCur) valCell.numFmt = CURRENCY_FORMAT;
    sheet1.getRow(r).height = 20;
    r++;
  });

  r += 2; // gap before table

  // Main Category Table Headers
  const catHeaderRow = sheet1.getRow(r);
  catHeaderRow.height = 26;
  const catCols = [
    { label: 'Financial Category', width: 38 },
    { label: 'Expected (£)', width: 20, align: 'right' },
    { label: 'Actual Received / Paid (£)', width: 22, align: 'right' },
    { label: 'Net Position (£)', width: 20, align: 'right' },
    { label: 'Ledger Notes / Audit Details', width: 44, align: 'left' },
  ];

  catCols.forEach((col, idx) => {
    const cell = catHeaderRow.getCell(idx + 1);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
  });
  r++;

  // Data Rows
  const rows = data.rows || [];
  rows.forEach((row, idx) => {
    const rowObj = sheet1.getRow(r);
    rowObj.height = 22;

    const c1 = rowObj.getCell(1);
    c1.value = row.category;
    c1.alignment = { horizontal: 'left', vertical: 'middle' };

    const c2 = rowObj.getCell(2);
    c2.value = Number(row.expected) || 0;
    c2.numFmt = CURRENCY_FORMAT;
    c2.alignment = { horizontal: 'right', vertical: 'middle' };

    const c3 = rowObj.getCell(3);
    c3.value = Number(row.received) || 0;
    c3.numFmt = CURRENCY_FORMAT;
    c3.alignment = { horizontal: 'right', vertical: 'middle' };

    const c4 = rowObj.getCell(4);
    c4.value = Number(row.net) || 0;
    c4.numFmt = CURRENCY_FORMAT;
    c4.alignment = { horizontal: 'right', vertical: 'middle' };

    const c5 = rowObj.getCell(5);
    c5.value = row.notes || '-';
    c5.alignment = { horizontal: 'left', vertical: 'middle' };

    if (idx % 2 === 1) {
      [c1, c2, c3, c4, c5].forEach((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }

    [c1, c2, c3, c4, c5].forEach((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
    r++;
  });

  // Totals Row
  const totRow = sheet1.getRow(r);
  totRow.height = 26;
  const tc1 = totRow.getCell(1);
  tc1.value = 'NET FINANCIAL POSITION';
  tc1.font = { bold: true, color: { argb: 'FF0F172A' } };

  const tc2 = totRow.getCell(2);
  tc2.value = Number(summary.grossIncome || summary.totalRentDue) || 0;
  tc2.numFmt = CURRENCY_FORMAT;
  tc2.font = { bold: true, color: { argb: 'FF0F172A' } };

  const tc3 = totRow.getCell(3);
  tc3.value = Number(summary.totalReceived || summary.totalPaymentsReceived) || 0;
  tc3.numFmt = CURRENCY_FORMAT;
  tc3.font = { bold: true, color: { argb: 'FF04A26F' } };

  const tc4 = totRow.getCell(4);
  tc4.value = Number(summary.netIncome || summary.netFinancialPosition) || 0;
  tc4.numFmt = CURRENCY_FORMAT;
  tc4.font = { bold: true, color: { argb: 'FF04A26F' } };

  const tc5 = totRow.getCell(5);
  tc5.value = `${summary.collectionRate || 0}% Cleared Collection Efficiency`;
  tc5.font = { bold: true, color: { argb: 'FF475569' } };

  [tc1, tc2, tc3, tc4, tc5].forEach((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF04A26F' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
  });

  sheet1.columns = catCols.map((c) => ({ width: c.width }));

  // =========================================================================
  // SHEET 2: RENT COLLECTIONS LEDGER (Itemized Rent Payments)
  // =========================================================================
  const rentList = data.rentTransactions || data.payments || [];
  if (rentList.length > 0) {
    const sheet2 = workbook.addWorksheet('Rent Collections Ledger');
    sheet2.views = [{ showGridLines: true }];

    sheet2.mergeCells('A1:I1');
    const s2Title = sheet2.getCell('A1');
    s2Title.value = `UK PIXXTECHNOLGIES - ITEMIZED RENT COLLECTIONS LEDGER (${rentList.length} TRANSACTIONS)`;
    s2Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    s2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
    s2Title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet2.getRow(1).height = 32;

    const rCols = [
      { label: 'Due Date', width: 14, align: 'center' },
      { label: 'Tenant Name', width: 24 },
      { label: 'Property Name', width: 28 },
      { label: 'Rent Due (£)', width: 16, align: 'right' },
      { label: 'Amount Paid (£)', width: 16, align: 'right' },
      { label: 'Arrears / Balance (£)', width: 18, align: 'right' },
      { label: 'Payment Method', width: 18, align: 'center' },
      { label: 'Status', width: 14, align: 'center' },
      { label: 'Reference / Notes', width: 26 },
    ];

    sheet2.getRow(3).values = rCols.map((c) => c.label);
    sheet2.getRow(3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    rCols.forEach((col, idx) => {
      const cell = sheet2.getRow(3).getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
    });
    sheet2.getRow(3).height = 24;

    let rowIdx = 4;
    rentList.forEach((pm, idx) => {
      const rObj = sheet2.getRow(rowIdx);
      rObj.height = 20;

      rObj.values = [
        pm.dateFormatted || pm.date || '-',
        pm.tenantName || 'Tenant',
        pm.propertyName || 'Property',
        Number(pm.amount) || 0,
        Number(pm.paidAmount) || 0,
        Number(pm.remainingAmount) || 0,
        pm.paymentMethod || 'Bank Transfer',
        pm.status || 'Received',
        pm.reference || pm.notes || '-',
      ];

      ['D', 'E', 'F'].forEach((colLetter) => {
        sheet2.getCell(`${colLetter}${rowIdx}`).numFmt = CURRENCY_FORMAT;
      });

      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((cl) => {
          sheet2.getCell(`${cl}${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
      rowIdx++;
    });

    // Total Row
    const rTotRow = sheet2.getRow(rowIdx);
    rTotRow.height = 24;
    const rTotDue = rentList.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const rTotPaid = rentList.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
    const rTotRem = rentList.reduce((s, r) => s + (Number(r.remainingAmount) || 0), 0);

    rTotRow.values = [
      'TOTALS',
      `${rentList.length} Transactions`,
      '',
      rTotDue,
      rTotPaid,
      rTotRem,
      '',
      `${summary.collectionRate || 0}% Cleared`,
      '',
    ];
    rTotRow.font = { bold: true, color: { argb: 'FF0F172A' } };
    ['D', 'E', 'F'].forEach((colLetter) => {
      sheet2.getCell(`${colLetter}${rowIdx}`).numFmt = CURRENCY_FORMAT;
      sheet2.getCell(`${colLetter}${rowIdx}`).font = { bold: true, color: { argb: 'FF04A26F' } };
    });
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((cl) => {
      sheet2.getCell(`${cl}${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      sheet2.getCell(`${cl}${rowIdx}`).border = {
        top: { style: 'medium', color: { argb: 'FF04A26F' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });

    sheet2.columns = rCols.map((c) => ({ width: c.width }));
  }

  // =========================================================================
  // SHEET 3: OPERATING EXPENSES LEDGER (Itemized Expenses)
  // =========================================================================
  const expList = data.expenseTransactions || data.expenses || [];
  if (expList.length > 0) {
    const sheet3 = workbook.addWorksheet('Expenses Ledger');
    sheet3.views = [{ showGridLines: true }];

    sheet3.mergeCells('A1:G1');
    const s3Title = sheet3.getCell('A1');
    s3Title.value = `UK PIXXTECHNOLGIES - ITEMIZED OPERATING & MAINTENANCE EXPENSES (${expList.length} TRANSACTIONS)`;
    s3Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    s3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
    s3Title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet3.getRow(1).height = 32;

    const eCols = [
      { label: 'Date', width: 14, align: 'center' },
      { label: 'Property / Unit', width: 28 },
      { label: 'Expense Type', width: 22 },
      { label: 'Category', width: 22 },
      { label: 'Payee / Supplier', width: 24 },
      { label: 'Description', width: 36 },
      { label: 'Amount (£)', width: 18, align: 'right' },
    ];

    sheet3.getRow(3).values = eCols.map((c) => c.label);
    sheet3.getRow(3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    eCols.forEach((col, idx) => {
      const cell = sheet3.getRow(3).getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
    });
    sheet3.getRow(3).height = 24;

    let eRowIdx = 4;
    expList.forEach((exp, idx) => {
      const eObj = sheet3.getRow(eRowIdx);
      eObj.height = 20;

      eObj.values = [
        exp.dateFormatted || exp.date || '-',
        exp.propertyName || 'Property',
        exp.type || 'Operating Expense',
        exp.category || 'General',
        exp.supplier || exp.payee || '-',
        exp.description || exp.notes || '-',
        Number(exp.amount) || 0,
      ];

      sheet3.getCell(`G${eRowIdx}`).numFmt = CURRENCY_FORMAT;

      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((cl) => {
          sheet3.getCell(`${cl}${eRowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
      eRowIdx++;
    });

    // Total Row
    const eTotRow = sheet3.getRow(eRowIdx);
    eTotRow.height = 24;
    const eTotalAmt = expList.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    eTotRow.values = [
      'TOTALS',
      `${expList.length} Expenses`,
      '',
      '',
      '',
      '',
      eTotalAmt,
    ];
    eTotRow.font = { bold: true, color: { argb: 'FF0F172A' } };
    sheet3.getCell(`G${eRowIdx}`).numFmt = CURRENCY_FORMAT;
    sheet3.getCell(`G${eRowIdx}`).font = { bold: true, color: { argb: 'FF04A26F' } };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((cl) => {
      sheet3.getCell(`${cl}${eRowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      sheet3.getCell(`${cl}${eRowIdx}`).border = {
        top: { style: 'medium', color: { argb: 'FF04A26F' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });

    sheet3.columns = eCols.map((c) => ({ width: c.width }));
  }

  // =========================================================================
  // SHEET 4: PROPERTY BREAKDOWN
  // =========================================================================
  const pBreakdown = data.propertiesBreakdown || data.properties || [];
  if (pBreakdown.length > 0) {
    const sheet4 = workbook.addWorksheet('Property Breakdown');
    sheet4.views = [{ showGridLines: true }];

    sheet4.mergeCells('A1:H1');
    const s4Title = sheet4.getCell('A1');
    s4Title.value = 'PORTFOLIO PROPERTY FINANCIAL PERFORMANCE';
    s4Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    s4Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
    s4Title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet4.getRow(1).height = 32;

    const pCols = [
      { label: 'Property Name', width: 32 },
      { label: 'Type', width: 16 },
      { label: 'Units', width: 12, align: 'center' },
      { label: 'Rent Due (£)', width: 18, align: 'right' },
      { label: 'Received (£)', width: 18, align: 'right' },
      { label: 'Expenses (£)', width: 18, align: 'right' },
      { label: 'Net Cash Flow (£)', width: 20, align: 'right' },
      { label: 'Collection %', width: 16, align: 'center' },
    ];

    sheet4.getRow(3).values = pCols.map((c) => c.label);
    sheet4.getRow(3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    pCols.forEach((col, idx) => {
      const cell = sheet4.getRow(3).getCell(idx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: col.align || 'left', vertical: 'middle' };
    });
    sheet4.getRow(3).height = 24;

    let pR = 4;
    pBreakdown.forEach((p, idx) => {
      const pRowObj = sheet4.getRow(pR);
      pRowObj.height = 20;

      pRowObj.values = [
        p.name || p.propertyName,
        p.propertyType || p.type || 'Residential',
        p.totalUnits || 1,
        p.totalRentDue || 0,
        p.totalPaid || 0,
        p.totalExpenses || 0,
        p.netIncome || 0,
        `${p.collectionRate || 0}%`,
      ];

      ['D', 'E', 'F', 'G'].forEach((colLetter) => {
        sheet4.getCell(`${colLetter}${pR}`).numFmt = CURRENCY_FORMAT;
      });

      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((cl) => {
          sheet4.getCell(`${cl}${pR}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
      pR++;
    });

    sheet4.columns = pCols.map((c) => ({ width: c.width }));
  }

  return await workbook.xlsx.writeBuffer();
}

async function generateMortgageExcelWorkbook(data) {
  const MortgagePayment = require('../models/MortgagePayment');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies Property Management';
  workbook.created = new Date();

  const generatedDateStr = formatUKDate(data.generatedAt || new Date());
  const rows = data.rows || [];
  const summary = data.summary || {};

  // Helper for sheet header
  const applySheetHeader = (sheet, title, colCount) => {
    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell('A1');
    titleCell.value = `UK PIXXTECHNOLGIES - ${title.toUpperCase()}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    sheet.getCell('A3').value = 'Report Generated:';
    sheet.getCell('B3').value = generatedDateStr;
    sheet.getCell('A3').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    sheet.getCell('B3').font = { size: 10, color: { argb: 'FF0F172A' } };

    sheet.getCell('D3').value = 'Report Scope:';
    sheet.getCell('E3').value = 'Active & Portfolio Mortgages';
    sheet.getCell('D3').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    sheet.getCell('E3').font = { size: 10, color: { argb: 'FF0F172A' } };
  };

  // ----------------------------------------------------
  // SHEET 1: MORTGAGE SUMMARY
  // ----------------------------------------------------
  const sheetSummary = workbook.addWorksheet('Mortgage Summary');
  applySheetHeader(sheetSummary, 'Mortgage Portfolio Executive Summary', 5);

  sheetSummary.mergeCells('A5', 'E5');
  const kpiBanner = sheetSummary.getCell('A5');
  kpiBanner.value = 'KEY FINANCIAL PORTFOLIO METRICS';
  kpiBanner.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
  kpiBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  sheetSummary.getRow(5).height = 24;

  const kpiItems = [
    { label: 'Total Mortgage Facilities', val: rows.length, isNum: true },
    { label: 'Individual Property Mortgages', val: rows.filter((r) => r.mortgageType !== 'Collective / Group').length, isNum: true },
    { label: 'Collective / Group Mortgages', val: rows.filter((r) => r.mortgageType === 'Collective / Group').length, isNum: true },
    { label: 'Total Original Facilities Borrowing', val: summary.totalOriginalLoan || 0, isCur: true },
    { label: 'Current Total Outstanding Debt', val: summary.totalOutstanding || 0, isCur: true },
    { label: 'Total Monthly Commitments', val: summary.totalMonthlyPayments || 0, isCur: true },
  ];

  let sumRow = 6;
  kpiItems.forEach((item) => {
    sheetSummary.getCell(`A${sumRow}`).value = item.label;
    sheetSummary.getCell(`A${sumRow}`).font = { bold: true, size: 10, color: { argb: 'FF475569' } };
    const vCell = sheetSummary.getCell(`C${sumRow}`);
    vCell.value = item.val;
    if (item.isCur) {
      vCell.numFmt = CURRENCY_FORMAT;
      vCell.font = { bold: true, size: 11, color: { argb: 'FF04A26F' } };
    } else {
      vCell.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
    }
    sumRow++;
  });

  sheetSummary.columns = [
    { width: 34 },
    { width: 5 },
    { width: 25 },
    { width: 16 },
    { width: 28 },
  ];

  // ----------------------------------------------------
  // SHEET 2: MORTGAGE FACILITIES
  // ----------------------------------------------------
  const sheetFacilities = workbook.addWorksheet('Mortgage Facilities');
  applySheetHeader(sheetFacilities, 'Mortgage Facilities Master List', 11);

  const facCols = [
    { key: 'ref', label: 'Facility Ref', width: 18 },
    { key: 'type', label: 'Mortgage Type', width: 20 },
    { key: 'landlord', label: 'Landlord', width: 24 },
    { key: 'lender', label: 'Lender / Bank', width: 22 },
    { key: 'securedProps', label: 'Secured Properties', width: 34 },
    { key: 'origAmount', label: 'Facility Amount (£)', width: 20, isCur: true },
    { key: 'balance', label: 'Outstanding (£)', width: 20, isCur: true },
    { key: 'monthly', label: 'Monthly (£)', width: 18, isCur: true },
    { key: 'rate', label: 'Interest Rate (%)', width: 16 },
    { key: 'nextDue', label: 'Next Due Date', width: 16 },
    { key: 'status', label: 'Status', width: 14 },
  ];

  let facRow = 6;
  const facHeaderRow = sheetFacilities.getRow(facRow);
  facCols.forEach((col, i) => {
    const c = facHeaderRow.getCell(i + 1);
    c.value = col.label;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: col.isCur ? 'right' : 'left', vertical: 'middle' };
  });
  facHeaderRow.height = 24;
  facRow++;

  rows.forEach((r) => {
    const rowObj = sheetFacilities.getRow(facRow);
    rowObj.getCell(1).value = r.mortgageReference || r.mortgageAccountNumber || '-';
    rowObj.getCell(2).value = r.mortgageType || 'Individual Property';
    rowObj.getCell(3).value = r.landlordName || 'N/A';
    rowObj.getCell(4).value = r.lenderName || '';
    rowObj.getCell(5).value = r.propertyName || 'Property';

    const c6 = rowObj.getCell(6);
    c6.value = Number(r.originalLoanAmount) || 0;
    c6.numFmt = CURRENCY_FORMAT;

    const c7 = rowObj.getCell(7);
    c7.value = Number(r.currentOutstandingBalance) || 0;
    c7.numFmt = CURRENCY_FORMAT;

    const c8 = rowObj.getCell(8);
    c8.value = Number(r.monthlyPayment) || 0;
    c8.numFmt = CURRENCY_FORMAT;

    rowObj.getCell(9).value = r.interestRate ? `${r.interestRate}%` : '0%';
    rowObj.getCell(10).value = r.nextPaymentDate || '-';
    rowObj.getCell(11).value = r.status || 'Active';

    rowObj.height = 20;
    facRow++;
  });

  // Totals row
  const facTotalRow = sheetFacilities.getRow(facRow);
  facTotalRow.getCell(1).value = 'TOTALS';
  facTotalRow.getCell(1).font = { bold: true };
  const t6 = facTotalRow.getCell(6);
  t6.value = Number(summary.totalOriginalLoan) || 0;
  t6.numFmt = CURRENCY_FORMAT;
  t6.font = { bold: true };
  const t7 = facTotalRow.getCell(7);
  t7.value = Number(summary.totalOutstanding) || 0;
  t7.numFmt = CURRENCY_FORMAT;
  t7.font = { bold: true };
  const t8 = facTotalRow.getCell(8);
  t8.value = Number(summary.totalMonthlyPayments) || 0;
  t8.numFmt = CURRENCY_FORMAT;
  t8.font = { bold: true };
  facTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sheetFacilities.columns = facCols.map((c) => ({ width: c.width }));

  // ----------------------------------------------------
  // SHEET 3: SECURED PROPERTIES
  // ----------------------------------------------------
  const sheetProps = workbook.addWorksheet('Secured Properties');
  applySheetHeader(sheetProps, 'Secured Properties & Allocations', 8);

  const propCols = [
    { label: 'Facility Ref', width: 18 },
    { label: 'Facility Type', width: 20 },
    { label: 'Lender', width: 20 },
    { label: 'Property Name', width: 28 },
    { label: 'Property Address', width: 34 },
    { label: 'Property Allocation (£)', width: 24, isCur: true },
    { label: 'Secured Date', width: 16 },
    { label: 'Relationship Status', width: 18 },
  ];

  let pRow = 6;
  const pHeaderRow = sheetProps.getRow(pRow);
  propCols.forEach((col, i) => {
    const c = pHeaderRow.getCell(i + 1);
    c.value = col.label;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: col.isCur ? 'right' : 'left', vertical: 'middle' };
  });
  pHeaderRow.height = 24;
  pRow++;

  rows.forEach((r) => {
    const securedList = r.securedProperties && r.securedProperties.length > 0
      ? r.securedProperties
      : [{ name: r.propertyName, address: r.propertyAddress, allocatedAmount: r.originalLoanAmount, status: 'Active' }];

    securedList.forEach((sp) => {
      const rowObj = sheetProps.getRow(pRow);
      rowObj.getCell(1).value = r.mortgageReference || r.mortgageAccountNumber || '-';
      rowObj.getCell(2).value = r.mortgageType || 'Individual Property';
      rowObj.getCell(3).value = r.lenderName || '';
      rowObj.getCell(4).value = sp.name || 'Property';
      rowObj.getCell(5).value = sp.address || '-';

      const aCell = rowObj.getCell(6);
      if (sp.allocatedAmount) {
        aCell.value = Number(sp.allocatedAmount);
        aCell.numFmt = CURRENCY_FORMAT;
      } else {
        aCell.value = 'Not Allocated';
      }

      rowObj.getCell(7).value = r.startDate || '-';
      rowObj.getCell(8).value = sp.status || 'Active';
      rowObj.height = 20;
      pRow++;
    });
  });

  sheetProps.columns = propCols.map((c) => ({ width: c.width }));

  // ----------------------------------------------------
  // SHEET 4: MORTGAGE PAYMENTS
  // ----------------------------------------------------
  const sheetPayments = workbook.addWorksheet('Mortgage Payments');
  applySheetHeader(sheetPayments, 'Mortgage Facility Payment Ledger', 9);

  const payCols = [
    { label: 'Facility Ref', width: 18 },
    { label: 'Payment Date', width: 16 },
    { label: 'Lender', width: 20 },
    { label: 'Total Paid (£)', width: 18, isCur: true },
    { label: 'Principal Portion (£)', width: 20, isCur: true },
    { label: 'Interest Portion (£)', width: 20, isCur: true },
    { label: 'Remaining Balance (£)', width: 22, isCur: true },
    { label: 'Payment Method', width: 18 },
    { label: 'Reference / Notes', width: 28 },
  ];

  let pyRow = 6;
  const pyHeaderRow = sheetPayments.getRow(pyRow);
  payCols.forEach((col, i) => {
    const c = pyHeaderRow.getCell(i + 1);
    c.value = col.label;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: col.isCur ? 'right' : 'left', vertical: 'middle' };
  });
  pyHeaderRow.height = 24;
  pyRow++;

  const mIds = rows.map((r) => r.mortgageId).filter(Boolean);
  const paymentLogs = await MortgagePayment.find({ mortgageId: { $in: mIds } })
    .populate('mortgageId', 'mortgageReference mortgageAccountNumber lenderName')
    .sort({ paymentDate: -1 });

  let totalPaidSum = 0;
  let totalPrinSum = 0;
  let totalIntSum = 0;

  paymentLogs.forEach((p) => {
    const rowObj = sheetPayments.getRow(pyRow);
    const mtgRef = p.mortgageId?.mortgageReference || p.mortgageId?.mortgageAccountNumber || '-';
    const lender = p.mortgageId?.lenderName || '-';

    rowObj.getCell(1).value = mtgRef;
    rowObj.getCell(2).value = p.paymentDate ? formatUKDate(p.paymentDate) : '-';
    rowObj.getCell(3).value = lender;

    const c4 = rowObj.getCell(4);
    c4.value = Number(p.totalPayment) || 0;
    c4.numFmt = CURRENCY_FORMAT;
    totalPaidSum += c4.value;

    const c5 = rowObj.getCell(5);
    c5.value = Number(p.principalAmount) || 0;
    c5.numFmt = CURRENCY_FORMAT;
    totalPrinSum += c5.value;

    const c6 = rowObj.getCell(6);
    c6.value = Number(p.interestAmount) || 0;
    c6.numFmt = CURRENCY_FORMAT;
    totalIntSum += c6.value;

    const c7 = rowObj.getCell(7);
    c7.value = Number(p.remainingBalance) || 0;
    c7.numFmt = CURRENCY_FORMAT;

    rowObj.getCell(8).value = p.paymentMethod || 'Bank Transfer';
    rowObj.getCell(9).value = p.reference ? `${p.reference} ${p.notes || ''}`.trim() : (p.notes || '-');

    rowObj.height = 20;
    pyRow++;
  });

  // Totals for payments
  const pyTotalRow = sheetPayments.getRow(pyRow);
  pyTotalRow.getCell(1).value = 'TOTALS';
  pyTotalRow.getCell(1).font = { bold: true };
  const pt4 = pyTotalRow.getCell(4);
  pt4.value = totalPaidSum;
  pt4.numFmt = CURRENCY_FORMAT;
  pt4.font = { bold: true };
  const pt5 = pyTotalRow.getCell(5);
  pt5.value = totalPrinSum;
  pt5.numFmt = CURRENCY_FORMAT;
  pt5.font = { bold: true };
  const pt6 = pyTotalRow.getCell(6);
  pt6.value = totalIntSum;
  pt6.numFmt = CURRENCY_FORMAT;
  pt6.font = { bold: true };
  pyTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  sheetPayments.columns = payCols.map((c) => ({ width: c.width }));

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  renderExcelReportWorkbook,
  generateTenantStatementExcel,
  generateLandlordExcelWorkbook,
  generateAgentExcelWorkbook,
  generatePropertyExcelWorkbook,
  generateUnitExcelWorkbook,
  generatePaymentExcelWorkbook,
  generateExpenseExcelWorkbook,
  generateIncomeExcelWorkbook,
  generateInvoiceExcelWorkbook,
  generateFinancialSummaryExcel,
  generateMortgageExcelWorkbook,
};
