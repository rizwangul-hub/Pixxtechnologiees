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
 * Converts array of objects to CSV string
 */
function convertToCSV(dataArray) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return '';
  }

  const headers = Object.keys(dataArray[0]);
  const rows = [headers.join(',')];

  for (const obj of dataArray) {
    const row = headers.map((header) => {
      let val = obj[header];
      if (val === null || val === undefined) val = '';
      const strVal = String(val).replace(/"/g, '""');
      if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
        return `"${strVal}"`;
      }
      return strVal;
    });
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}

/**
 * Converts array of objects to a STUNNING PROFESSIONAL EXCEL WORKBOOK Buffer
 */
async function convertToExcelBuffer(dataArray, sheetTitle = 'ExportData') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PixxTechnologies Property Management';
  workbook.created = new Date();

  const safeTitle = String(sheetTitle).replace(/[:\\/?*\[\]]/g, '').slice(0, 30) || 'ExportData';
  const sheet = workbook.addWorksheet(safeTitle);
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: true }];

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    sheet.getCell('A1').value = 'No records available';
    return await workbook.xlsx.writeBuffer();
  }

  const headers = Object.keys(dataArray[0]);

  // 1. TITLE BANNER
  sheet.mergeCells(1, 1, 1, Math.max(headers.length, 4));
  const titleCell = sheet.getCell('A1');
  titleCell.value = `PIXXTECHNOLOGIES - ${sheetTitle.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF04A26F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  // 2. METADATA ROW
  sheet.getCell('A2').value = 'Report Generated:';
  sheet.getCell('B2').value = formatUKDate(new Date());
  sheet.getCell('A2').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet.getCell('B2').font = { size: 10, color: { argb: 'FF0F172A' } };

  sheet.getCell('D2').value = 'Total Records:';
  sheet.getCell('E2').value = dataArray.length;
  sheet.getCell('D2').font = { bold: true, size: 10, color: { argb: 'FF475569' } };
  sheet.getCell('E2').font = { bold: true, size: 10, color: { argb: 'FF04A26F' } };

  // 3. KPI SUMMARY ROW (AUTO-SUM NUMERIC / CURRENCY FIELDS)
  const totals = {};
  const isNumericCol = {};

  headers.forEach((h) => {
    const isCurr = /amount|rent|paid|expense|balance|income|due|remaining|debt|price|cost|received|expected/i.test(h);
    let sum = 0;
    let hasNum = false;

    dataArray.forEach((row) => {
      const val = row[h];
      if (typeof val === 'number') {
        sum += val;
        hasNum = true;
      }
    });

    if (hasNum && isCurr) {
      totals[h] = sum;
      isNumericCol[h] = true;
    }
  });

  // Render Summary Box if totals exist
  let startRow = 4;
  if (Object.keys(totals).length > 0) {
    sheet.getCell(`A3`).value = 'EXECUTIVE SUMMARY METRICS:';
    sheet.getCell(`A3`).font = { bold: true, size: 10, color: { argb: 'FF04A26F' } };

    let summaryColIdx = 1;
    Object.entries(totals).forEach(([label, sumVal]) => {
      if (summaryColIdx <= headers.length) {
        const cell = sheet.getCell(4, summaryColIdx);
        const cleanLabel = label.replace(/\(.*\)/, '').trim();
        cell.value = `${cleanLabel}: £${sumVal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        cell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        summaryColIdx++;
      }
    });
    startRow = 5;
  }

  // 4. MAIN DATA TABLE HEADERS
  const headerRow = sheet.getRow(startRow);
  headerRow.height = 26;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: isNumericCol[h] ? 'right' : 'left', vertical: 'middle' };
  });

  // 5. DATA ROWS
  let rIdx = startRow + 1;
  dataArray.forEach((rowObj, index) => {
    const row = sheet.getRow(rIdx);
    row.height = 20;

    headers.forEach((h, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      let val = rowObj[h];

      if (val === null || val === undefined) val = '-';

      // UK Date Formatting if ISO date string
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        val = formatUKDate(val);
      }

      if (typeof val === 'number' && isNumericCol[h]) {
        cell.value = val;
        cell.numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.value = val;
        cell.alignment = { horizontal: typeof val === 'number' ? 'right' : 'left', vertical: 'middle' };
      }

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
    rIdx++;
  });

  // 6. TOTAL ROW AT BOTTOM
  if (Object.keys(totals).length > 0) {
    const totRow = sheet.getRow(rIdx);
    totRow.height = 24;

    headers.forEach((h, cIdx) => {
      const cell = totRow.getCell(cIdx + 1);

      if (cIdx === 0) {
        cell.value = 'TOTAL';
      } else if (isNumericCol[h] && totals[h] !== undefined) {
        cell.value = totals[h];
        cell.numFmt = CURRENCY_FORMAT;
      } else {
        cell.value = '';
      }

      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { horizontal: isNumericCol[h] ? 'right' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF04A26F' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });
  }

  // 7. AUTO-FIT COLUMN WIDTHS
  sheet.columns = headers.map((h) => {
    let maxLen = h.length;
    dataArray.forEach((row) => {
      const cellVal = row[h];
      if (cellVal) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { width: Math.min(Math.max(maxLen + 5, 16), 55) };
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  convertToCSV,
  convertToExcelBuffer,
};
