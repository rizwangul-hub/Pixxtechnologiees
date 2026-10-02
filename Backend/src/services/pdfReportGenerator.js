try {
  require('pdfkit/js/standard-fonts/Helvetica.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-Bold.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-Oblique.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-BoldOblique.cjs');
} catch (e) {}

const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Patch PDFDocument prototype to ensure font loading errors never throw 500 in serverless environments
if (PDFDocument && PDFDocument.prototype && PDFDocument.prototype.font) {
  const originalFont = PDFDocument.prototype.font;
  PDFDocument.prototype.font = function (src, family, size) {
    try {
      if (typeof src === 'string' && (src.includes('Helvetica') || src.includes('.cjs'))) {
        try {
          return originalFont.call(this, 'Helvetica', family, size);
        } catch (err) {}
      }
      return originalFont.call(this, src, family, size);
    } catch (e) {
      console.warn(`[PDFKit Font Patch] Notice loading font '${src}': ${e.message}. Using default.`);
      try {
        return originalFont.call(this, 'Helvetica');
      } catch (err) {
        return this;
      }
    }
  };
}

const systemLogoPath = path.join(__dirname, '../assets/logo.png');

/**
 * Currency Formatter Helper for Reports
 */
function formatReportCurrency(amount) {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(num).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `(£${absFormatted})` : `£${absFormatted}`;
}

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
 * Fetch image buffer from URL helper
 */
function fetchImageBuffer(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') return resolve(null);
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return resolve(null);
    }
    try {
      const parsed = new URL(trimmed);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(parsed, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.setTimeout(4000, () => {
        req.destroy();
        resolve(null);
      });
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Generic PDF Report Renderer for UK Property Management Business Reports
 */
async function renderPDFReportDoc(options) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        reportTitle = 'BUSINESS REPORT',
        generatedAt = formatUKDate(new Date()),
        periodText = '',
        metaFields = [],
        summaryCards = [],
        columns = [],
        rows = [],
        totalRow = null,
        logoUrl = null,
      } = options;

      const doc = new PDFDocument({
        size: 'A4',
        margin: { top: 36, bottom: 30, left: 36, right: 36 },
        bufferPages: true,
      });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const landlordLogoBuffer = logoUrl ? await fetchImageBuffer(logoUrl) : null;
      const systemLogoBuffer = fs.existsSync(systemLogoPath) ? fs.readFileSync(systemLogoPath) : null;

      // 1. BRANDING HEADER BAR
      doc.rect(36, 36, 523, 40).fill('#04A26F');

      if (systemLogoBuffer) {
        try {
          doc.image(systemLogoBuffer, 44, 41, { fit: [100, 30] });
        } catch (e) {
          doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text('PIXXTECHNOLOGIES', 44, 46);
        }
      } else {
        doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text('PIXXTECHNOLOGIES', 44, 46);
      }

      if (landlordLogoBuffer) {
        try {
          doc.image(landlordLogoBuffer, 154, 41, { fit: [80, 30] });
        } catch (e) {}
      }

      doc.fontSize(13).fillColor('#FFFFFF').font('Helvetica-Bold').text(reportTitle.toUpperCase(), 250, 49, { width: 309, align: 'right' });

      let y = 88;

      // 2. REPORT METADATA GRID
      doc.rect(36, y, 523, 1).fill('#E2E8F0');
      y += 8;

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B').text(`Report Generated: `, 36, y);
      doc.font('Helvetica').fillColor('#0F172A').text(formatUKDate(generatedAt), 115, y);

      if (periodText) {
        doc.font('Helvetica-Bold').fillColor('#64748B').text(`Report Period: `, 300, y);
        doc.font('Helvetica').fillColor('#0F172A').text(periodText, 365, y);
      }

      y += 14;

      if (metaFields && metaFields.length > 0) {
        metaFields.forEach((field, idx) => {
          const col = idx % 2;
          const posX = col === 0 ? 36 : 300;
          const valX = col === 0 ? 115 : 365;

          if (col === 0 && idx > 0) y += 13;

          doc.font('Helvetica-Bold').fillColor('#64748B').text(`${field.label}: `, posX, y);
          doc.font('Helvetica').fillColor('#0F172A').text(String(field.value || '-'), valX, y, { width: 175, lineBreak: false });
        });
        y += 16;
      }

      y += 6;

      // 3. EXECUTIVE SUMMARY KPI CARDS
      if (summaryCards && summaryCards.length > 0) {
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0F172A').text('EXECUTIVE PERFORMANCE SUMMARY', 36, y);
        y += 12;

        const cardWidth = Math.floor(523 / Math.min(summaryCards.length, 4)) - 6;
        let cardX = 36;
        let startY = y;

        summaryCards.forEach((card, idx) => {
          if (idx > 0 && idx % 4 === 0) {
            cardX = 36;
            startY += 40;
          }

          doc.rect(cardX, startY, cardWidth, 34).fillAndStroke('#F8FAFC', '#E2E8F0');
          doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#64748B').text(card.label.toUpperCase(), cardX + 4, startY + 5, { width: cardWidth - 8, align: 'center', lineBreak: false });
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor(card.color || '#04A26F').text(String(card.value), cardX + 4, startY + 17, { width: cardWidth - 8, align: 'center', lineBreak: false });

          cardX += cardWidth + 6;
        });

        y = startY + 44;
      }

      // 4. DETAILED TABLES (Supports multi-table reports e.g. Category + Rent Transactions + Expenses)
      const tablesList = (options.tables && options.tables.length > 0)
        ? options.tables
        : [{ title: 'DETAILED REPORT TRANSACTIONS', columns, rows, totalRow }];

      tablesList.forEach((tbl) => {
        const tblCols = tbl.columns || [];
        const tblRows = tbl.rows || [];
        const tblTotal = tbl.totalRow;
        if (tblCols.length === 0) return;

        // Ensure section fits comfortably on page
        if (y > 680) {
          doc.addPage();
          y = 40;
        }

        // Section Title Banner
        if (tbl.title) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(tbl.title, 36, y);
          y += 12;
        }

        const totalTableWidth = 523;
        const calcWidths = tblCols.map((c) => c.width || Math.floor(totalTableWidth / tblCols.length));
        let currentPositions = [];
        let currentX = 36;
        calcWidths.forEach((w) => {
          currentPositions.push(currentX);
          currentX += w;
        });

        function drawTableHeader(yPos) {
          doc.rect(36, yPos, 523, 17).fill('#1E293B');
          doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
          tblCols.forEach((col, idx) => {
            doc.text(col.label, currentPositions[idx] + 4, yPos + 4, {
              width: calcWidths[idx] - 8,
              align: col.align || 'left',
              lineBreak: false,
            });
          });
        }

        drawTableHeader(y);
        y += 18;

        doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');

        if (tblRows.length === 0) {
          doc.rect(36, y, 523, 16).fill('#F8FAFC');
          doc.fillColor('#94A3B8').font('Helvetica-Oblique').text('No recorded transactions in this period.', 44, y + 4);
          y += 18;
        } else {
          tblRows.forEach((row, rIdx) => {
            if (y > 750) {
              doc.addPage();
              y = 40;
              drawTableHeader(y);
              y += 18;
              doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');
            }

            if (rIdx % 2 === 1) {
              doc.rect(36, y - 2, 523, 15).fill('#F8FAFC');
            }

            tblCols.forEach((col, cIdx) => {
              const rawVal = row[col.key];
              const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';
              doc.fillColor('#1E293B').text(valStr, currentPositions[cIdx] + 4, y + 2, {
                width: calcWidths[cIdx] - 8,
                align: col.align || 'left',
                lineBreak: false,
                ellipsis: true,
              });
            });

            doc.moveTo(36, y + 13).lineTo(559, y + 13).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
            y += 15;
          });
        }

        // Table Bottom Total Row
        if (tblTotal) {
          if (y > 740) {
            doc.addPage();
            y = 40;
          }

          doc.rect(36, y, 523, 17).fill('#F1F5F9');
          doc.moveTo(36, y).lineTo(559, y).strokeColor('#04A26F').lineWidth(1.5).stroke();

          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A');
          tblCols.forEach((col, cIdx) => {
            const totVal = tblTotal[col.key];
            const valStr = totVal !== undefined && totVal !== null ? String(totVal) : (cIdx === 0 ? 'TOTAL' : '');
            doc.text(valStr, currentPositions[cIdx] + 4, y + 4, {
              width: calcWidths[cIdx] - 8,
              align: col.align || 'left',
              lineBreak: false,
              ellipsis: true,
            });
          });

          y += 20;
        }

        y += 12; // gap between tables
      });

      // 5. FOOTER WITH PAGE NUMBERS (Positioned safely to prevent empty phantom pages)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(36, 786).lineTo(559, 786).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
        doc.fontSize(7.5).fillColor('#64748B').font('Helvetica').text(
          `PixxTechnologies Property Management System | Generated: ${formatUKDate(generatedAt)} | Page ${i + 1} of ${range.count}`,
          36,
          790,
          { align: 'center', width: 523, lineBreak: false }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ----------------------------------------------------
// 1. TENANT STATEMENT PDF
// ----------------------------------------------------
async function generateTenantStatementPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);
  const isAll = Boolean(
    data.isAllTenants ||
    data.tenant?.id === 'all_tenants' ||
    String(data.tenant?.name).toLowerCase().includes('all tenants') ||
    String(data.reportType).includes('All Tenants')
  );

  return renderPDFReportDoc({
    reportTitle: isAll ? 'TENANT STATEMENT & PAYMENTS' : 'STATEMENT OF ACCOUNT',
    generatedAt: data.statementDate,
    periodText: `${fromStr} - ${toStr}`,
    logoUrl: data.landlord?.logoUrl,
    metaFields: isAll
      ? [
          { label: 'Report Scope', value: 'All Tenants Portfolio (Combined)' },
          { label: 'Total Records', value: `${data.summary?.totalRecords || data.transactions?.length || 0} transactions` },
          { label: 'Property Scope', value: 'Portfolio Wide' },
          { label: 'Management', value: data.landlord?.name || 'PixxTechnologies Property Management' },
        ]
      : [
          { label: 'Tenant', value: data.tenant?.name || 'Tenant' },
          { label: 'Tenant Address', value: data.tenant?.address || '-' },
          { label: 'Property', value: `${data.property?.name || 'Property'} ${data.property?.address ? '(' + data.property.address + ')' : ''}` },
          { label: 'Landlord', value: data.landlord?.name || 'Landlord' },
        ],
    summaryCards: [
      { label: isAll ? 'Opening Balance' : 'Balance Forward', value: data.summary.balanceForwardFormatted, color: '#475569' },
      { label: isAll ? 'Total Rent Charged' : 'Total Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
      { label: 'Total Payments', value: data.summary.totalPaymentsFormatted, color: '#04A26F' },
      { label: 'Total Outstanding', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 65 },
      { key: 'reference', label: 'Reference', width: 65 },
      { key: 'description', label: 'Description', width: 140 },
      { key: 'payee', label: 'Payee', width: 85 },
      { key: 'debitFormatted', label: 'Debit (£)', width: 56, align: 'right' },
      { key: 'creditFormatted', label: 'Credit (£)', width: 56, align: 'right' },
      { key: 'balanceFormatted', label: 'Balance (£)', width: 56, align: 'right' },
    ],
    rows: (data.transactions || []).map((t) => ({
      ...t,
      date: formatUKDate(t.date),
    })),
    totalRow: {
      date: 'TOTALS',
      debitFormatted: data.summary.totalRentDueFormatted,
      creditFormatted: data.summary.totalPaymentsFormatted,
      balanceFormatted: data.summary.totalOutstandingFormatted,
    },
  });
}

// ----------------------------------------------------
// 2. LANDLORD REPORT PDF
// ----------------------------------------------------
async function generateLandlordReportPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);

  return renderPDFReportDoc({
    reportTitle: 'LANDLORD FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${fromStr} - ${toStr}`,
    logoUrl: data.landlord?.logoUrl || data.landlord?.logo?.url || null,
    metaFields: [
      { label: 'Landlord', value: data.landlord.name },
      { label: 'Phone', value: data.landlord.phone || '-' },
      { label: 'Email', value: data.landlord.email || '-' },
      { label: 'Properties', value: `${data.summary.totalProperties} Properties` },
    ],
    summaryCards: [
      { label: 'Total Units', value: `${data.summary.totalUnits} (${data.summary.occupiedUnits} Occ)`, color: '#2563EB' },
      { label: 'Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
      { label: 'Rent Received', value: data.summary.totalPaymentsFormatted, color: '#04A26F' },
      { label: 'Expenses', value: data.summary.totalExpensesFormatted, color: '#DC2626' },
      { label: 'Net Income', value: data.summary.netIncomeFormatted, color: '#04A26F' },
    ],
    columns: [
      { key: 'propertyName', label: 'Property Name', width: 143 },
      { key: 'propertyType', label: 'Type', width: 70 },
      { key: 'totalUnits', label: 'Units', width: 50, align: 'center' },
      { key: 'rentDueFormatted', label: 'Rent Due', width: 65, align: 'right' },
      { key: 'paymentsFormatted', label: 'Received', width: 65, align: 'right' },
      { key: 'expensesFormatted', label: 'Expenses', width: 65, align: 'right' },
      { key: 'netIncomeFormatted', label: 'Net Income', width: 65, align: 'right' },
    ],
    rows: data.propertiesBreakdown || data.properties || [],
    totalRow: {
      propertyName: 'PORTFOLIO TOTALS',
      rentDueFormatted: data.summary.totalRentDueFormatted,
      paymentsFormatted: data.summary.totalPaymentsFormatted,
      expensesFormatted: data.summary.totalExpensesFormatted,
      netIncomeFormatted: data.summary.netIncomeFormatted,
    },
  });
}

// ----------------------------------------------------
// 3. AGENT REPORT PDF
// ----------------------------------------------------
async function generateAgentReportPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);

  return renderPDFReportDoc({
    reportTitle: 'AGENT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${fromStr} - ${toStr}`,
    metaFields: [
      { label: 'Agent Name', value: data.agent.name },
      { label: 'Phone', value: data.agent.phone || '-' },
      { label: 'Region', value: data.agent.region || 'All' },
      { label: 'Assigned Units', value: `${data.summary?.assignedUnitsCount || 0} (${data.summary?.occupiedUnitsCount || 0} Occupied)` },
    ],
    summaryCards: [
      { label: 'Assigned Units', value: String(data.summary?.assignedUnitsCount || 0), color: '#0F172A' },
      { label: 'Expected Rent', value: data.summary.totalExpectedFormatted || data.summary.expectedAmountFormatted || '£0.00', color: '#2563EB' },
      { label: 'Approved Expenses', value: data.summary.totalExpensesFormatted || data.summary.expenseAmountFormatted || '£0.00', color: '#DC2626' },
      { label: 'Net Due', value: data.summary.netAmountDueFormatted || data.summary.netAmountFormatted || '£0.00', color: '#D97706' },
      { label: 'Total Received', value: data.summary.totalReceivedFormatted || data.summary.paidAmountFormatted || '£0.00', color: '#04A26F' },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted || data.summary.remainingAmountFormatted || '£0.00', color: '#DC2626' },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 65 },
      { key: 'tenantName', label: 'Tenant', width: 95 },
      { key: 'propertyName', label: 'Property / Unit', width: 115 },
      { key: 'expectedFormatted', label: 'Expected', width: 62, align: 'right' },
      { key: 'expenseFormatted', label: 'Expense', width: 62, align: 'right' },
      { key: 'receivedFormatted', label: 'Received', width: 62, align: 'right' },
      { key: 'outstandingFormatted', label: 'Outstanding', width: 62, align: 'right' },
    ],
    rows: (data.collections || []).map((c) => ({
      ...c,
      date: formatUKDate(c.date),
      propertyName: `${c.propertyName || '-'} ${c.unitName ? '(' + c.unitName + ')' : ''}`,
    })),
    totalRow: {
      date: 'TOTALS',
      expectedFormatted: data.summary.totalExpectedFormatted,
      expenseFormatted: data.summary.totalExpensesFormatted,
      receivedFormatted: data.summary.totalReceivedFormatted,
      outstandingFormatted: data.summary.totalOutstandingFormatted,
    },
  });
}

// ----------------------------------------------------
// 4. PROPERTY REPORT PDF
// ----------------------------------------------------
async function generatePropertyReportPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);

  const prop = data.property || {};
  const sum = data.summary || {};

  return renderPDFReportDoc({
    reportTitle: 'PROPERTY FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${fromStr} - ${toStr}`,
    logoUrl: data.landlord?.logoUrl || data.landlord?.logo?.url || prop.landlordLogo || null,
    metaFields: [
      { label: 'Property', value: prop.name || prop.title || 'Property' },
      { label: 'Type', value: prop.type || '-' },
      { label: 'Address', value: prop.address || '-' },
      { label: 'Landlord', value: data.landlord?.name || prop.landlordName || '-' },
    ],
    summaryCards: [
      { label: 'Total Units', value: `${sum.totalUnits || 0} (${sum.occupiedUnits || 0} Occ)`, color: '#2563EB' },
      { label: 'Rent Due', value: sum.totalRentDueFormatted || formatReportCurrency(sum.totalRent || 0), color: '#D97706' },
      { label: 'Rent Received', value: sum.totalPaymentsFormatted || formatReportCurrency(sum.totalPaid || 0), color: '#04A26F' },
      { label: 'Expenses', value: sum.totalExpensesFormatted || formatReportCurrency(sum.totalExpenses || 0), color: '#DC2626' },
      { label: 'Net Income', value: sum.netIncomeFormatted || formatReportCurrency(sum.netIncome || (sum.totalPaid || 0) - (sum.totalExpenses || 0)), color: '#04A26F' },
    ],
    columns: [
      { key: 'unitName', label: 'Unit', width: 75 },
      { key: 'tenantName', label: 'Tenant', width: 110 },
      { key: 'status', label: 'Status', width: 68 },
      { key: 'rentDueFormatted', label: 'Rent Due', width: 67, align: 'right' },
      { key: 'paymentsFormatted', label: 'Received', width: 67, align: 'right' },
      { key: 'expensesFormatted', label: 'Expenses', width: 67, align: 'right' },
      { key: 'netIncomeFormatted', label: 'Net Income', width: 69, align: 'right' },
    ],
    rows: data.unitsBreakdown || (data.units || []).map((u) => ({
      unitName: u.name || u.unitName || '-',
      tenantName: u.tenantName || '-',
      status: u.status || '-',
      rentDueFormatted: formatReportCurrency(u.price || u.monthlyRent || 0),
      paymentsFormatted: formatReportCurrency(u.payments || 0),
      expensesFormatted: formatReportCurrency(u.expenses || 0),
      netIncomeFormatted: formatReportCurrency((u.price || u.monthlyRent || 0) - (u.expenses || 0)),
    })),
    totalRow: {
      unitName: 'PROPERTY TOTALS',
      rentDueFormatted: sum.totalRentDueFormatted || formatReportCurrency(sum.totalRent || 0),
      paymentsFormatted: sum.totalPaymentsFormatted || formatReportCurrency(sum.totalPaid || 0),
      expensesFormatted: sum.totalExpensesFormatted || formatReportCurrency(sum.totalExpenses || 0),
      netIncomeFormatted: sum.netIncomeFormatted || formatReportCurrency(sum.netIncome || (sum.totalPaid || 0) - (sum.totalExpenses || 0)),
    },
  });
}

// ----------------------------------------------------
// 5. UNIT REPORT PDF
// ----------------------------------------------------
async function generateUnitReportPDF(data) {
  return generatePropertyReportPDF(data);
}

// ----------------------------------------------------
// 6. PAYMENT REPORT PDF
// ----------------------------------------------------
async function generatePaymentReportPDF(data) {
  return renderPDFReportDoc({
    reportTitle: 'TENANT PAYMENT REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Payments', value: `${data.summary.totalPaymentsCount}`, color: '#2563EB' },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
      { label: 'Total Received', value: data.summary.totalPaidFormatted, color: '#04A26F' },
      { label: 'Total Remaining', value: data.summary.totalRemainingFormatted, color: '#DC2626' },
    ],
    columns: [
      { key: 'dueDate', label: 'Due Date', width: 65 },
      { key: 'customerName', label: 'Tenant', width: 100 },
      { key: 'propertyName', label: 'Property / Unit', width: 110 },
      { key: 'paymentMethod', label: 'Method', width: 70 },
      { key: 'amountFormatted', label: 'Due (£)', width: 58, align: 'right' },
      { key: 'paidAmountFormatted', label: 'Received (£)', width: 60, align: 'right' },
      { key: 'status', label: 'Status', width: 60, align: 'center' },
    ],
    rows: (data.rows || []).map((r) => ({
      ...r,
      dueDate: formatUKDate(r.dueDate),
      propertyName: `${r.propertyName || '-'} (${r.unitName || '-'})`,
    })),
    totalRow: {
      dueDate: 'TOTALS',
      amountFormatted: data.summary.totalRentDueFormatted,
      paidAmountFormatted: data.summary.totalPaidFormatted,
    },
  });
}

// ----------------------------------------------------
// 7. EXPENSE REPORT PDF
// ----------------------------------------------------
async function generateExpenseReportPDF(data) {
  return renderPDFReportDoc({
    reportTitle: 'EXPENSE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Expenses', value: `${data.summary.totalExpensesCount}`, color: '#2563EB' },
      { label: 'Total Amount', value: data.summary.totalAmountFormatted, color: '#DC2626' },
      { label: 'Property Expenses', value: data.summary.totalPropertyExpensesFormatted, color: '#D97706' },
      { label: 'Agent Expenses', value: data.summary.totalAgentExpensesFormatted, color: '#9333EA' },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 65 },
      { key: 'type', label: 'Type', width: 75 },
      { key: 'propertyName', label: 'Property / Agent', width: 110 },
      { key: 'category', label: 'Category', width: 85 },
      { key: 'supplier', label: 'Supplier', width: 88 },
      { key: 'amountFormatted', label: 'Amount (£)', width: 100, align: 'right' },
    ],
    rows: (data.rows || []).map((r) => ({
      ...r,
      date: formatUKDate(r.date),
      propertyName: r.propertyName || r.agentName || '-',
    })),
    totalRow: {
      date: 'TOTALS',
      amountFormatted: data.summary.totalAmountFormatted,
    },
  });
}

// ----------------------------------------------------
// 8. INCOME REPORT PDF
// ----------------------------------------------------
async function generateIncomeReportPDF(data) {
  return renderPDFReportDoc({
    reportTitle: 'RENTAL INCOME PERFORMANCE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `Billing Year ${data.year || new Date().getFullYear()}`,
    summaryCards: [
      { label: 'Expected Income', value: data.summary.totalExpectedFormatted, color: '#2563EB' },
      { label: 'Received Income', value: data.summary.totalReceivedFormatted, color: '#04A26F' },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
      { label: 'Collection Rate', value: `${data.summary.collectionRate}%`, color: '#04A26F' },
    ],
    columns: [
      { key: 'monthName', label: 'Month', width: 100 },
      { key: 'year', label: 'Year', width: 60, align: 'center' },
      { key: 'expectedFormatted', label: 'Expected (£)', width: 120, align: 'right' },
      { key: 'receivedFormatted', label: 'Received (£)', width: 120, align: 'right' },
      { key: 'outstandingFormatted', label: 'Outstanding (£)', width: 123, align: 'right' },
    ],
    rows: data.rows || [],
    totalRow: {
      monthName: 'ANNUAL TOTALS',
      expectedFormatted: data.summary.totalExpectedFormatted,
      receivedFormatted: data.summary.totalReceivedFormatted,
      outstandingFormatted: data.summary.totalOutstandingFormatted,
    },
  });
}

// ----------------------------------------------------
// 9. INVOICE REPORT PDF
// ----------------------------------------------------
async function generateInvoiceReportPDF(data) {
  return renderPDFReportDoc({
    reportTitle: 'RENT INVOICE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Invoices', value: `${data.summary.totalInvoices}`, color: '#2563EB' },
      { label: 'Invoiced Amount', value: data.summary.totalInvoicedFormatted, color: '#D97706' },
      { label: 'Total Paid', value: data.summary.totalPaidFormatted, color: '#04A26F' },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
    ],
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #', width: 70 },
      { key: 'issueDate', label: 'Issue Date', width: 65 },
      { key: 'tenantName', label: 'Tenant', width: 100 },
      { key: 'propertyName', label: 'Property', width: 110 },
      { key: 'amountFormatted', label: 'Invoiced (£)', width: 60, align: 'right' },
      { key: 'paidAmountFormatted', label: 'Paid (£)', width: 58, align: 'right' },
      { key: 'status', label: 'Status', width: 60, align: 'center' },
    ],
    rows: (data.rows || []).map((r) => ({
      ...r,
      issueDate: formatUKDate(r.issueDate),
    })),
    totalRow: {
      invoiceNumber: 'TOTALS',
      amountFormatted: data.summary.totalInvoicedFormatted,
      paidAmountFormatted: data.summary.totalPaidFormatted,
    },
  });
}

// ----------------------------------------------------
// 10. FINANCIAL SUMMARY PDF
// ----------------------------------------------------
async function generateFinancialSummaryPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);
  const summary = data.summary || {};
  const rentList = data.rentTransactions || data.payments || [];
  const expList = data.expenseTransactions || data.expenses || [];

  return renderPDFReportDoc({
    reportTitle: 'FINANCIAL PERFORMANCE SUMMARY',
    generatedAt: formatUKDate(data.generatedAt || data.reportDate || new Date()),
    periodText: data.fromDate && data.toDate ? `${fromStr} - ${toStr}` : 'Full Portfolio History',
    summaryCards: [
      { label: 'Gross Expected Rent', value: summary.grossIncomeFormatted || summary.totalRentDueFormatted || '£0.00', color: '#2563EB' },
      { label: 'Rent Cleared / Received', value: summary.totalReceivedFormatted || summary.totalPaymentsReceivedFormatted || '£0.00', color: '#04A26F' },
      { label: 'Operating Expenses', value: summary.totalExpensesFormatted || '£0.00', color: '#DC2626' },
      { label: 'Net Cash Flow', value: summary.netIncomeFormatted || summary.netFinancialPositionFormatted || '£0.00', color: '#04A26F' },
    ],
    tables: [
      {
        title: 'SECTION 1: FINANCIAL CATEGORY PERFORMANCE',
        columns: [
          { key: 'category', label: 'Financial Category', width: 170 },
          { key: 'expectedFormatted', label: 'Expected (£)', width: 115, align: 'right' },
          { key: 'receivedFormatted', label: 'Actual Received / Paid (£)', width: 120, align: 'right' },
          { key: 'netFormatted', label: 'Net Position (£)', width: 118, align: 'right' },
        ],
        rows: data.rows || [],
        totalRow: {
          category: 'NET FINANCIAL POSITION',
          expectedFormatted: summary.grossIncomeFormatted || summary.totalRentDueFormatted || '£0.00',
          receivedFormatted: summary.totalReceivedFormatted || summary.totalPaymentsReceivedFormatted || '£0.00',
          netFormatted: summary.netIncomeFormatted || summary.netFinancialPositionFormatted || '£0.00',
        },
      },
      {
        title: `SECTION 2: ITEMIZED RENT PAYMENT TRANSACTIONS (${rentList.length} Records)`,
        columns: [
          { key: 'dateFormatted', label: 'Date', width: 62, align: 'center' },
          { key: 'tenantName', label: 'Tenant', width: 105 },
          { key: 'propertyName', label: 'Property', width: 115 },
          { key: 'amountFormatted', label: 'Due (£)', width: 64, align: 'right' },
          { key: 'paidAmountFormatted', label: 'Received (£)', width: 64, align: 'right' },
          { key: 'remainingAmountFormatted', label: 'Arrears (£)', width: 60, align: 'right' },
          { key: 'status', label: 'Status', width: 53, align: 'center' },
        ],
        rows: rentList,
        totalRow: {
          dateFormatted: 'TOTALS',
          tenantName: `${rentList.length} Payments`,
          amountFormatted: summary.totalRentDueFormatted || summary.grossIncomeFormatted || '£0.00',
          paidAmountFormatted: summary.totalReceivedFormatted || summary.totalPaymentsReceivedFormatted || '£0.00',
          remainingAmountFormatted: summary.totalOutstandingRentFormatted || '£0.00',
          status: `${summary.collectionRate || 0}%`,
        },
      },
      {
        title: `SECTION 3: ITEMIZED OPERATING & MAINTENANCE EXPENSES (${expList.length} Records)`,
        columns: [
          { key: 'dateFormatted', label: 'Date', width: 62, align: 'center' },
          { key: 'propertyName', label: 'Property / Location', width: 120 },
          { key: 'category', label: 'Category', width: 90 },
          { key: 'supplier', label: 'Payee / Supplier', width: 95 },
          { key: 'description', label: 'Details', width: 93 },
          { key: 'amountFormatted', label: 'Amount (£)', width: 63, align: 'right' },
        ],
        rows: expList,
        totalRow: {
          dateFormatted: 'TOTALS',
          propertyName: `${expList.length} Expenses`,
          amountFormatted: summary.totalExpensesFormatted || '£0.00',
        },
      },
    ],
  });
}

// ----------------------------------------------------
// 11. MORTGAGE REPORT PDF
// ----------------------------------------------------
async function generateMortgageReportPDF(data) {
  return renderPDFReportDoc({
    reportTitle: 'MORTGAGE & FINANCING REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Active Mortgages',
    summaryCards: [
      { label: 'Original Facilities', value: data.summary.totalOriginalLoanFormatted, color: '#2563EB' },
      { label: 'Current Bank Debt', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
      { label: 'Monthly Commitments', value: data.summary.totalMonthlyPaymentsFormatted, color: '#D97706' },
    ],
    columns: [
      { key: 'ref', label: 'Facility Ref', width: 70 },
      { key: 'type', label: 'Type', width: 75 },
      { key: 'propertyName', label: 'Secured Properties', width: 115 },
      { key: 'lenderName', label: 'Lender', width: 75 },
      { key: 'loanFormatted', label: 'Facility (£)', width: 65, align: 'right' },
      { key: 'outstandingFormatted', label: 'Balance (£)', width: 65, align: 'right' },
      { key: 'monthlyFormatted', label: 'Monthly (£)', width: 55, align: 'right' },
      { key: 'status', label: 'Status', width: 45, align: 'center' },
    ],
    rows: (data.rows || []).map((r) => ({
      ref: r.mortgageReference || r.mortgageAccountNumber || '-',
      type: r.mortgageType === 'Collective / Group' ? 'Collective' : 'Individual',
      propertyName: r.propertyName,
      lenderName: r.lenderName,
      loanFormatted: r.originalLoanAmountFormatted,
      outstandingFormatted: r.currentOutstandingBalanceFormatted,
      monthlyFormatted: r.monthlyPaymentFormatted,
      status: r.status,
    })),
    totalRow: {
      ref: 'TOTALS',
      type: '',
      propertyName: '',
      lenderName: '',
      loanFormatted: data.summary.totalOriginalLoanFormatted,
      outstandingFormatted: data.summary.totalOutstandingFormatted,
      monthlyFormatted: data.summary.totalMonthlyPaymentsFormatted,
    },
  });
}

module.exports = {
  renderPDFReportDoc,
  generateTenantStatementPDF,
  generateLandlordReportPDF,
  generateAgentReportPDF,
  generatePropertyReportPDF,
  generateUnitReportPDF,
  generatePaymentReportPDF,
  generateExpenseReportPDF,
  generateIncomeReportPDF,
  generateInvoiceReportPDF,
  generateFinancialSummaryPDF,
  generateMortgageReportPDF,
};
