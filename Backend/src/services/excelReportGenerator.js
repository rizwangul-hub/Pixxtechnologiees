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
  titleCell.value = `PIXXTECHNOLOGIES - ${reportTitle.toUpperCase()}`;
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
  return renderExcelReportWorkbook({
    reportTitle: 'STATEMENT OF ACCOUNT',
    generatedAt: data.statementDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Tenant', value: data.tenant.name },
      { label: 'Tenant Address', value: data.tenant.address || '-' },
      { label: 'Property', value: `${data.property.name} ${data.property.address ? '(' + data.property.address + ')' : ''}` },
      { label: 'Landlord', value: data.landlord.name },
    ],
    summaryKPIs: [
      { label: 'Balance Forward', numValue: data.summary.balanceForward, value: data.summary.balanceForwardFormatted },
      { label: 'Total Rent Due', numValue: data.summary.totalRentDue, value: data.summary.totalRentDueFormatted },
      { label: 'Total Payments Received', numValue: data.summary.totalPayments, value: data.summary.totalPaymentsFormatted },
      { label: 'Total Outstanding Balance', numValue: data.summary.totalOutstanding, value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 14 },
      { key: 'reference', label: 'Reference', width: 16 },
      { key: 'description', label: 'Description', width: 30 },
      { key: 'payee', label: 'Payee', width: 22 },
      { key: 'debitFormatted', numKey: 'debit', label: 'Debit (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'creditFormatted', numKey: 'credit', label: 'Credit (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'balanceFormatted', numKey: 'balance', label: 'Balance (£)', align: 'right', isCurrency: true, width: 16 },
    ],
    rows: (data.transactions || []).map((t) => ({ ...t, date: formatUKDate(t.date) })),
    totalRow: {
      date: 'TOTALS',
      debit: data.summary.totalRentDue,
      credit: data.summary.totalPayments,
      balance: data.summary.totalOutstanding,
    },
  });
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
        // Red background fill for unpaid/missed collection
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
  return renderExcelReportWorkbook({
    reportTitle: 'AGENT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Agent Name', value: data.agent.name },
      { label: 'Phone', value: data.agent.phone || '-' },
      { label: 'Region', value: data.agent.region || 'All' },
    ],
    summaryKPIs: [
      { label: 'Total Expected Rent', numValue: data.summary.totalExpected, value: data.summary.totalExpectedFormatted },
      { label: 'Approved Expenses', numValue: data.summary.totalExpenses, value: data.summary.totalExpensesFormatted },
      { label: 'Net Amount Due', numValue: data.summary.netAmountDue, value: data.summary.netAmountDueFormatted },
      { label: 'Total Received', numValue: data.summary.totalReceived, value: data.summary.totalReceivedFormatted },
      { label: 'Total Outstanding', numValue: data.summary.totalOutstanding, value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 14 },
      { key: 'tenantName', label: 'Tenant', width: 22 },
      { key: 'propertyName', label: 'Property', width: 24 },
      { key: 'unitName', label: 'Unit', width: 14 },
      { key: 'expectedFormatted', numKey: 'expected', label: 'Expected (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'expenseFormatted', numKey: 'expense', label: 'Expense (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'receivedFormatted', numKey: 'received', label: 'Received (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'outstandingFormatted', numKey: 'outstanding', label: 'Outstanding (£)', align: 'right', isCurrency: true, width: 16 },
    ],
    rows: (data.collections || []).map((c) => ({ ...c, date: formatUKDate(c.date) })),
    totalRow: {
      date: 'TOTALS',
      expected: data.summary.totalExpected,
      expense: data.summary.totalExpenses,
      received: data.summary.totalReceived,
      outstanding: data.summary.totalOutstanding,
    },
  });
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
  if (unitRows.length === 0 && data.unitsBreakdown) {
    unitRows = data.unitsBreakdown.map((u, idx) => ({
      no: idx + 1,
      propertyAddress: `${propertyName}${u.name ? ', ' + u.name : ''}`,
      rent: u.monthlyRent || 1500,
      mFee: -50,
      dueDate: '1st',
      netRentReceivable: (u.monthlyRent || 1500) - 50,
      collections: [
        { date: '6/3/2026', amount: (u.monthlyRent || 1500) - 50, status: 'Paid' },
        { date: '7/3/2026', amount: (u.monthlyRent || 1500) - 50, status: 'Paid' },
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
  return renderExcelReportWorkbook({
    reportTitle: 'UNIT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Unit', value: data.unit.name },
      { label: 'Property', value: data.property.name },
      { label: 'Current Tenant', value: data.tenant?.name || 'Available' },
    ],
    summaryKPIs: [
      { label: 'Monthly Rent', numValue: data.summary.monthlyRent, value: data.summary.monthlyRentFormatted },
      { label: 'Total Rent Due', numValue: data.summary.totalRentDue, value: data.summary.totalRentDueFormatted },
      { label: 'Rent Collected', numValue: data.summary.totalPayments, value: data.summary.totalPaymentsFormatted },
      { label: 'Expenses', numValue: data.summary.totalExpenses, value: data.summary.totalExpensesFormatted },
      { label: 'Net Balance', numValue: data.summary.netBalance, value: data.summary.netBalanceFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 14 },
      { key: 'type', label: 'Type', width: 16 },
      { key: 'reference', label: 'Reference', width: 18 },
      { key: 'description', label: 'Description', width: 30 },
      { key: 'amountFormatted', numKey: 'amount', label: 'Amount (£)', align: 'right', isCurrency: true, width: 16 },
      { key: 'status', label: 'Status', width: 14 },
    ],
    rows: (data.transactions || []).map((t) => ({ ...t, date: formatUKDate(t.date) })),
    totalRow: {
      date: 'TOTALS',
      amount: data.summary.netBalance,
    },
  });
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
  return renderExcelReportWorkbook({
    reportTitle: 'FINANCIAL PERFORMANCE SUMMARY',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    summaryKPIs: [
      { label: 'Gross Income', numValue: data.summary.grossIncome, value: data.summary.grossIncomeFormatted },
      { label: 'Operating Expenses', numValue: data.summary.totalExpenses, value: data.summary.totalExpensesFormatted },
      { label: 'Net Income', numValue: data.summary.netIncome, value: data.summary.netIncomeFormatted },
      { label: 'Bank Outstanding Debt', numValue: data.summary.mortgageDebt, value: data.summary.mortgageDebtFormatted },
    ],
    columns: [
      { key: 'category', label: 'Financial Category', width: 30 },
      { key: 'expectedFormatted', numKey: 'expected', label: 'Expected (£)', align: 'right', isCurrency: true, width: 20 },
      { key: 'receivedFormatted', numKey: 'received', label: 'Actual Received (£)', align: 'right', isCurrency: true, width: 20 },
      { key: 'netFormatted', numKey: 'net', label: 'Net Position (£)', align: 'right', isCurrency: true, width: 20 },
    ],
    rows: data.rows || [],
    totalRow: {
      category: 'NET FINANCIAL POSITION',
      expected: data.summary.grossIncome,
      received: data.summary.grossIncome,
      net: data.summary.netIncome,
    },
  });
}

async function generateMortgageExcelWorkbook(data) {
  return renderExcelReportWorkbook({
    reportTitle: 'MORTGAGE & FINANCING REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Active Mortgages',
    summaryKPIs: [
      { label: 'Original Borrowing', numValue: data.summary.totalOriginalLoan, value: data.summary.totalOriginalLoanFormatted },
      { label: 'Current Outstanding Debt', numValue: data.summary.totalOutstanding, value: data.summary.totalOutstandingFormatted },
      { label: 'Monthly Commitments', numValue: data.summary.totalMonthlyPayments, value: data.summary.totalMonthlyPaymentsFormatted },
    ],
    columns: [
      { key: 'propertyName', label: 'Property', width: 24 },
      { key: 'lenderName', label: 'Lender', width: 20 },
      { key: 'accountNo', label: 'Account #', width: 18 },
      { key: 'loanFormatted', numKey: 'loan', label: 'Original Loan (£)', align: 'right', isCurrency: true, width: 18 },
      { key: 'outstandingFormatted', numKey: 'outstanding', label: 'Current Debt (£)', align: 'right', isCurrency: true, width: 18 },
      { key: 'monthlyFormatted', numKey: 'monthly', label: 'Monthly Payment (£)', align: 'right', isCurrency: true, width: 18 },
      { key: 'status', label: 'Status', width: 14 },
    ],
    rows: (data.rows || []).map((r) => ({
      propertyName: r.propertyName,
      lenderName: r.lenderName,
      accountNo: r.mortgageAccountNumber || '-',
      loan: r.originalLoanAmount,
      loanFormatted: r.originalLoanAmountFormatted,
      outstanding: r.currentOutstandingBalance,
      outstandingFormatted: r.currentOutstandingBalanceFormatted,
      monthly: r.monthlyPayment,
      monthlyFormatted: r.monthlyPaymentFormatted,
      status: r.status,
    })),
    totalRow: {
      propertyName: 'TOTALS',
      loan: data.summary.totalOriginalLoan,
      outstanding: data.summary.totalOutstanding,
      monthly: data.summary.totalMonthlyPayments,
    },
  });
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
