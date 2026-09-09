const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const systemLogoPath = path.join(__dirname, '../assets/logo.png');

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
    if (!url) return resolve(null);
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', () => resolve(null));
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

      const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const fetchedBuffer = logoUrl ? await fetchImageBuffer(logoUrl) : null;
      const logoBuffer = fetchedBuffer || (fs.existsSync(systemLogoPath) ? fs.readFileSync(systemLogoPath) : null);

      // 1. BRANDING HEADER BAR
      doc.rect(36, 36, 523, 40).fill('#04A26F');

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 44, 41, { fit: [100, 30] });
        } catch (e) {
          doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text('PIXXTECHNOLOGIES', 44, 46);
        }
      } else {
        doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text('PIXXTECHNOLOGIES', 44, 46);
      }

      doc.fontSize(9).fillColor('#E6F4EA').font('Helvetica').text('PROPERTY MANAGEMENT SYSTEM', 44, 62);
      doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text(reportTitle.toUpperCase(), 220, 50, { width: 325, align: 'right' });

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
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('EXECUTIVE SUMMARY', 36, y);
        y += 14;

        const cardWidth = Math.floor(523 / Math.min(summaryCards.length, 4)) - 6;
        let cardX = 36;
        let startY = y;

        summaryCards.forEach((card, idx) => {
          if (idx > 0 && idx % 4 === 0) {
            cardX = 36;
            startY += 42;
          }

          doc.rect(cardX, startY, cardWidth, 36).fillAndStroke('#F8FAFC', '#E2E8F0');
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text(card.label.toUpperCase(), cardX + 6, startY + 6, { width: cardWidth - 12, align: 'center' });
          doc.fontSize(10).font('Helvetica-Bold').fillColor(card.color || '#04A26F').text(String(card.value), cardX + 6, startY + 18, { width: cardWidth - 12, align: 'center' });

          cardX += cardWidth + 6;
        });

        y = startY + 46;
      }

      // 4. DETAILED TRANSACTIONS TABLE
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('DETAILED REPORT', 36, y);
      y += 14;

      const totalTableWidth = 523;
      const calcWidths = columns.map((c) => c.width || Math.floor(totalTableWidth / columns.length));

      let currentPositions = [];
      let currentX = 36;
      calcWidths.forEach((w) => {
        currentPositions.push(currentX);
        currentX += w;
      });

      function drawTableHeader(yPos) {
        doc.rect(36, yPos, 523, 18).fill('#1E293B');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
        columns.forEach((col, idx) => {
          doc.text(col.label, currentPositions[idx] + 2, yPos + 5, {
            width: calcWidths[idx] - 4,
            align: col.align || 'left',
          });
        });
      }

      drawTableHeader(y);
      y += 20;

      doc.font('Helvetica').fontSize(8).fillColor('#1E293B');

      rows.forEach((row, rIdx) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
          drawTableHeader(y);
          y += 20;
          doc.font('Helvetica').fontSize(8).fillColor('#1E293B');
        }

        if (rIdx % 2 === 1) {
          doc.rect(36, y - 2, 523, 16).fill('#F8FAFC');
        }

        columns.forEach((col, cIdx) => {
          const rawVal = row[col.key];
          const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';
          doc.fillColor('#1E293B').text(valStr, currentPositions[cIdx] + 2, y + 2, {
            width: calcWidths[cIdx] - 4,
            align: col.align || 'left',
            lineBreak: false,
          });
        });

        doc.moveTo(36, y + 14).lineTo(559, y + 14).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
        y += 16;
      });

      // 5. BOTTOM TOTAL ROW
      if (totalRow) {
        if (y > 740) {
          doc.addPage();
          y = 40;
        }

        doc.rect(36, y, 523, 18).fill('#F1F5F9');
        doc.moveTo(36, y).lineTo(559, y).strokeColor('#04A26F').lineWidth(1.5).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A');
        columns.forEach((col, cIdx) => {
          const totVal = totalRow[col.key];
          const valStr = totVal !== undefined && totVal !== null ? String(totVal) : (cIdx === 0 ? 'TOTAL' : '');
          doc.text(valStr, currentPositions[cIdx] + 2, y + 4, {
            width: calcWidths[cIdx] - 4,
            align: col.align || 'left',
          });
        });

        y += 22;
      }

      // 6. FOOTER WITH PAGE NUMBERS
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(36, 800).lineTo(559, 800).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
        doc.fontSize(8).fillColor('#64748B').font('Helvetica').text(
          `PixxTechnologies Property Management System | Generated: ${formatUKDate(generatedAt)} | Page ${i + 1} of ${range.count}`,
          36,
          806,
          { align: 'center', width: 523 }
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

  return renderPDFReportDoc({
    reportTitle: 'STATEMENT OF ACCOUNT',
    generatedAt: data.statementDate,
    periodText: `${fromStr} - ${toStr}`,
    logoUrl: data.landlord?.logoUrl,
    metaFields: [
      { label: 'Tenant', value: data.tenant.name },
      { label: 'Tenant Address', value: data.tenant.address || '-' },
      { label: 'Property', value: `${data.property.name} ${data.property.address ? '(' + data.property.address + ')' : ''}` },
      { label: 'Landlord', value: data.landlord.name },
    ],
    summaryCards: [
      { label: 'Balance Forward', value: data.summary.balanceForwardFormatted, color: '#475569' },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
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
      { label: 'Email', value: data.agent.email || '-' },
      { label: 'Region', value: data.agent.region || 'All' },
    ],
    summaryCards: [
      { label: 'Expected Rent', value: data.summary.totalExpectedFormatted, color: '#2563EB' },
      { label: 'Approved Expenses', value: data.summary.totalExpensesFormatted, color: '#DC2626' },
      { label: 'Net Due', value: data.summary.netAmountDueFormatted, color: '#D97706' },
      { label: 'Total Received', value: data.summary.totalReceivedFormatted, color: '#04A26F' },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
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

  return renderPDFReportDoc({
    reportTitle: 'PROPERTY FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${fromStr} - ${toStr}`,
    metaFields: [
      { label: 'Property', value: data.property.name },
      { label: 'Type', value: data.property.type || '-' },
      { label: 'Address', value: data.property.address || '-' },
      { label: 'Landlord', value: data.landlord?.name || '-' },
    ],
    summaryCards: [
      { label: 'Total Units', value: `${data.summary.totalUnits} (${data.summary.occupiedUnits} Occ)`, color: '#2563EB' },
      { label: 'Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
      { label: 'Rent Received', value: data.summary.totalPaymentsFormatted, color: '#04A26F' },
      { label: 'Expenses', value: data.summary.totalExpensesFormatted, color: '#DC2626' },
      { label: 'Net Income', value: data.summary.netIncomeFormatted, color: '#04A26F' },
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
    rows: data.unitsBreakdown || [],
    totalRow: {
      unitName: 'PROPERTY TOTALS',
      rentDueFormatted: data.summary.totalRentDueFormatted,
      paymentsFormatted: data.summary.totalPaymentsFormatted,
      expensesFormatted: data.summary.totalExpensesFormatted,
      netIncomeFormatted: data.summary.netIncomeFormatted,
    },
  });
}

// ----------------------------------------------------
// 5. UNIT REPORT PDF
// ----------------------------------------------------
async function generateUnitReportPDF(data) {
  const fromStr = formatUKDate(data.fromDate);
  const toStr = formatUKDate(data.toDate);

  return renderPDFReportDoc({
    reportTitle: 'UNIT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${fromStr} - ${toStr}`,
    metaFields: [
      { label: 'Unit', value: data.unit.name },
      { label: 'Property', value: data.property.name },
      { label: 'Type', value: data.unit.type || '-' },
      { label: 'Current Tenant', value: data.tenant?.name || 'Available' },
    ],
    summaryCards: [
      { label: 'Monthly Rent', value: data.summary.monthlyRentFormatted, color: '#2563EB' },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted, color: '#D97706' },
      { label: 'Rent Collected', value: data.summary.totalPaymentsFormatted, color: '#04A26F' },
      { label: 'Expenses', value: data.summary.totalExpensesFormatted, color: '#DC2626' },
      { label: 'Net Balance', value: data.summary.netBalanceFormatted, color: '#04A26F' },
    ],
    columns: [
      { key: 'date', label: 'Date', width: 65 },
      { key: 'type', label: 'Type', width: 75 },
      { key: 'reference', label: 'Reference', width: 85 },
      { key: 'description', label: 'Description', width: 140 },
      { key: 'amountFormatted', label: 'Amount (£)', width: 78, align: 'right' },
      { key: 'status', label: 'Status', width: 80, align: 'center' },
    ],
    rows: (data.transactions || []).map((t) => ({
      ...t,
      date: formatUKDate(t.date),
    })),
    totalRow: {
      date: 'TOTALS',
      amountFormatted: data.summary.netBalanceFormatted,
    },
  });
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

  return renderPDFReportDoc({
    reportTitle: 'FINANCIAL PERFORMANCE SUMMARY',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `${fromStr} - ${toStr}`,
    summaryCards: [
      { label: 'Gross Income', value: data.summary.grossIncomeFormatted, color: '#2563EB' },
      { label: 'Operating Expenses', value: data.summary.totalExpensesFormatted, color: '#DC2626' },
      { label: 'Net Income', value: data.summary.netIncomeFormatted, color: '#04A26F' },
      { label: 'Bank Debt', value: data.summary.mortgageDebtFormatted, color: '#9333EA' },
    ],
    columns: [
      { key: 'category', label: 'Financial Category', width: 173 },
      { key: 'expectedFormatted', label: 'Expected (£)', width: 110, align: 'right' },
      { key: 'receivedFormatted', label: 'Actual Received (£)', width: 120, align: 'right' },
      { key: 'netFormatted', label: 'Net Position (£)', width: 120, align: 'right' },
    ],
    rows: data.rows || [],
    totalRow: {
      category: 'NET FINANCIAL POSITION',
      expectedFormatted: data.summary.grossIncomeFormatted,
      receivedFormatted: data.summary.grossIncomeFormatted,
      netFormatted: data.summary.netIncomeFormatted,
    },
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
      { label: 'Original Loan', value: data.summary.totalOriginalLoanFormatted, color: '#2563EB' },
      { label: 'Current Debt', value: data.summary.totalOutstandingFormatted, color: '#DC2626' },
      { label: 'Monthly Commitments', value: data.summary.totalMonthlyPaymentsFormatted, color: '#D97706' },
    ],
    columns: [
      { key: 'propertyName', label: 'Property', width: 110 },
      { key: 'lenderName', label: 'Lender', width: 85 },
      { key: 'accountNo', label: 'Account #', width: 75 },
      { key: 'loanFormatted', label: 'Original (£)', width: 64, align: 'right' },
      { key: 'outstandingFormatted', label: 'Current Debt (£)', width: 65, align: 'right' },
      { key: 'monthlyFormatted', label: 'Monthly (£)', width: 64, align: 'right' },
      { key: 'status', label: 'Status', width: 60, align: 'center' },
    ],
    rows: (data.rows || []).map((r) => ({
      propertyName: r.propertyName,
      lenderName: r.lenderName,
      accountNo: r.mortgageAccountNumber || '-',
      loanFormatted: r.originalLoanAmountFormatted,
      outstandingFormatted: r.currentOutstandingBalanceFormatted,
      monthlyFormatted: r.monthlyPaymentFormatted,
      status: r.status,
    })),
    totalRow: {
      propertyName: 'TOTALS',
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
