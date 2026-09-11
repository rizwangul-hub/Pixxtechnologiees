const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
} = require('docx');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
 * Generic Word (.docx) Report Renderer for UK Property Management Business Reports
 */
async function renderWordReportDoc(options) {
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

  const children = [];

  const fetchedBuffer = logoUrl ? await fetchImageBuffer(logoUrl) : null;
  const logoBuffer = fetchedBuffer || (fs.existsSync(systemLogoPath) ? fs.readFileSync(systemLogoPath) : null);

  if (logoBuffer) {
    try {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 80 },
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: {
                width: 140,
                height: 50,
              },
            }),
          ],
        })
      );
    } catch (e) {
      // Fallback silently if image invalid
    }
  }

  // 1. BRANDING HEADER
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({
          text: 'PIXXTECHNOLOGIES',
          bold: true,
          size: 28, // 14pt
          color: '04A26F',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'PROPERTY MANAGEMENT SYSTEM',
          bold: true,
          size: 16,
          color: '64748B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: reportTitle.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
        }),
      ],
    })
  );

  // 2. METADATA SECTION TABLE
  const metaRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Report Generated: ', bold: true, size: 18 }),
                new TextRun({ text: formatUKDate(generatedAt), size: 18 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Report Period: ', bold: true, size: 18 }),
                new TextRun({ text: periodText || 'Full History', size: 18 }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  if (metaFields && metaFields.length > 0) {
    for (let i = 0; i < metaFields.length; i += 2) {
      const f1 = metaFields[i];
      const f2 = metaFields[i + 1];

      metaRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${f1.label}: `, bold: true, size: 18 }),
                    new TextRun({ text: String(f1.value || '-'), size: 18 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                f2
                  ? new Paragraph({
                      children: [
                        new TextRun({ text: `${f2.label}: `, bold: true, size: 18 }),
                        new TextRun({ text: String(f2.value || '-'), size: 18 }),
                      ],
                    })
                  : new Paragraph({ children: [] }),
              ],
            }),
          ],
        })
      );
    }
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaRows,
    }),
    new Paragraph({ spacing: { after: 200 } })
  );

  // 3. EXECUTIVE SUMMARY SECTION
  if (summaryCards && summaryCards.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'EXECUTIVE SUMMARY',
            bold: true,
            size: 20,
            color: '0F172A',
          }),
        ],
      })
    );

    const summaryCells = summaryCards.map(
      (card) =>
        new TableCell({
          width: { size: Math.floor(100 / summaryCards.length), type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 40 },
              children: [new TextRun({ text: card.label.toUpperCase(), bold: true, size: 14, color: '64748B' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
              children: [new TextRun({ text: String(card.value), bold: true, size: 20, color: '04A26F' })],
            }),
          ],
        })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: summaryCells })],
      }),
      new Paragraph({ spacing: { after: 240 } })
    );
  }

  // 4. DETAILED REPORT TABLE
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'DETAILED REPORT TRANSACTIONS',
          bold: true,
          size: 20,
          color: '0F172A',
        }),
      ],
    })
  );

  const tableRows = [];

  // Table Header Row
  const headerCells = columns.map(
    (col) =>
      new TableCell({
        shading: { fill: '1E293B' },
        children: [
          new Paragraph({
            alignment: col.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: [new TextRun({ text: col.label, bold: true, color: 'FFFFFF', size: 16 })],
          }),
        ],
      })
  );
  tableRows.push(new TableRow({ children: headerCells }));

  // Data Rows
  rows.forEach((row, rIdx) => {
    const dataCells = columns.map((col) => {
      const rawVal = row[col.key];
      const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';
      return new TableCell({
        shading: rIdx % 2 === 1 ? { fill: 'F8FAFC' } : undefined,
        children: [
          new Paragraph({
            alignment: col.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: [new TextRun({ text: valStr, size: 16, color: '1E293B' })],
          }),
        ],
      });
    });
    tableRows.push(new TableRow({ children: dataCells }));
  });

  // Total Row
  if (totalRow) {
    const totalCells = columns.map((col, cIdx) => {
      const totVal = totalRow[col.key];
      const valStr = totVal !== undefined && totVal !== null ? String(totVal) : (cIdx === 0 ? 'TOTAL' : '');
      return new TableCell({
        shading: { fill: 'F1F5F9' },
        children: [
          new Paragraph({
            alignment: col.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: [new TextRun({ text: valStr, bold: true, size: 16, color: '0F172A' })],
          }),
        ],
      });
    });
    tableRows.push(new TableRow({ children: totalCells }));
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    new Paragraph({ spacing: { after: 300 } }),
    // FOOTER
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `PixxTechnologies Property Management System | Generated: ${formatUKDate(generatedAt)}`,
          size: 14,
          color: '94A3B8',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return await Packer.toBuffer(doc);
}

// ----------------------------------------------------
// Export Handlers for ALL 11 Report Types
// ----------------------------------------------------

async function generateTenantStatementWord(data) {
  return renderWordReportDoc({
    reportTitle: 'STATEMENT OF ACCOUNT',
    generatedAt: data.statementDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    logoUrl: data.landlord?.logoUrl || data.landlord?.logo?.url || null,
    metaFields: [
      { label: 'Tenant', value: data.tenant.name },
      { label: 'Tenant Address', value: data.tenant.address || '-' },
      { label: 'Property', value: `${data.property.name} ${data.property.address ? '(' + data.property.address + ')' : ''}` },
      { label: 'Landlord', value: data.landlord.name },
    ],
    summaryCards: [
      { label: 'Balance Forward', value: data.summary.balanceForwardFormatted },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted },
      { label: 'Total Payments', value: data.summary.totalPaymentsFormatted },
      { label: 'Total Outstanding', value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'reference', label: 'Reference' },
      { key: 'description', label: 'Description' },
      { key: 'payee', label: 'Payee' },
      { key: 'debitFormatted', label: 'Debit (£)', align: 'right' },
      { key: 'creditFormatted', label: 'Credit (£)', align: 'right' },
      { key: 'balanceFormatted', label: 'Balance (£)', align: 'right' },
    ],
    rows: (data.transactions || []).map((t) => ({ ...t, date: formatUKDate(t.date) })),
    totalRow: {
      date: 'TOTALS',
      debitFormatted: data.summary.totalRentDueFormatted,
      creditFormatted: data.summary.totalPaymentsFormatted,
      balanceFormatted: data.summary.totalOutstandingFormatted,
    },
  });
}

async function generateLandlordReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'LANDLORD FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    logoUrl: data.landlord?.logoUrl || data.landlord?.logo?.url || null,
    metaFields: [
      { label: 'Landlord', value: data.landlord.name },
      { label: 'Phone', value: data.landlord.phone || '-' },
      { label: 'Email', value: data.landlord.email || '-' },
      { label: 'Properties', value: `${data.summary.totalProperties} Properties` },
    ],
    summaryCards: [
      { label: 'Total Units', value: `${data.summary.totalUnits} (${data.summary.occupiedUnits} Occ)` },
      { label: 'Rent Due', value: data.summary.totalRentDueFormatted },
      { label: 'Rent Received', value: data.summary.totalPaymentsFormatted },
      { label: 'Expenses', value: data.summary.totalExpensesFormatted },
      { label: 'Net Income', value: data.summary.netIncomeFormatted },
    ],
    columns: [
      { key: 'propertyName', label: 'Property Name' },
      { key: 'propertyType', label: 'Type' },
      { key: 'totalUnits', label: 'Units' },
      { key: 'rentDueFormatted', label: 'Rent Due', align: 'right' },
      { key: 'paymentsFormatted', label: 'Received', align: 'right' },
      { key: 'expensesFormatted', label: 'Expenses', align: 'right' },
      { key: 'netIncomeFormatted', label: 'Net Income', align: 'right' },
    ],
    rows: data.propertiesBreakdown || [],
    totalRow: {
      propertyName: 'PORTFOLIO TOTALS',
      rentDueFormatted: data.summary.totalRentDueFormatted,
      paymentsFormatted: data.summary.totalPaymentsFormatted,
      expensesFormatted: data.summary.totalExpensesFormatted,
      netIncomeFormatted: data.summary.netIncomeFormatted,
    },
  });
}

async function generateAgentReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'AGENT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Agent Name', value: data.agent.name },
      { label: 'Phone', value: data.agent.phone || '-' },
      { label: 'Email', value: data.agent.email || '-' },
      { label: 'Region', value: data.agent.region || 'All' },
    ],
    summaryCards: [
      { label: 'Expected Rent', value: data.summary.totalExpectedFormatted },
      { label: 'Approved Expenses', value: data.summary.totalExpensesFormatted },
      { label: 'Net Due', value: data.summary.netAmountDueFormatted },
      { label: 'Total Received', value: data.summary.totalReceivedFormatted },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'tenantName', label: 'Tenant' },
      { key: 'propertyName', label: 'Property / Unit' },
      { key: 'expectedFormatted', label: 'Expected', align: 'right' },
      { key: 'expenseFormatted', label: 'Expense', align: 'right' },
      { key: 'receivedFormatted', label: 'Received', align: 'right' },
      { key: 'outstandingFormatted', label: 'Outstanding', align: 'right' },
    ],
    rows: (data.collections || []).map((c) => ({
      ...c,
      date: formatUKDate(c.date),
      propertyName: `${c.propertyName || '-'} (${c.unitName || '-'})`,
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

async function generatePropertyReportWord(data) {
  const prop = data.property || {};
  const sum = data.summary || {};

  return renderWordReportDoc({
    reportTitle: 'PROPERTY FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Property', value: prop.name || prop.title || 'Property' },
      { label: 'Type', value: prop.type || '-' },
      { label: 'Address', value: prop.address || '-' },
      { label: 'Landlord', value: data.landlord?.name || prop.landlordName || '-' },
    ],
    summaryCards: [
      { label: 'Total Units', value: `${sum.totalUnits || 0} (${sum.occupiedUnits || 0} Occ)` },
      { label: 'Rent Due', value: sum.totalRentDueFormatted || formatReportCurrency(sum.totalRent || 0) },
      { label: 'Rent Received', value: sum.totalPaymentsFormatted || formatReportCurrency(sum.totalPaid || 0) },
      { label: 'Expenses', value: sum.totalExpensesFormatted || formatReportCurrency(sum.totalExpenses || 0) },
      { label: 'Net Income', value: sum.netIncomeFormatted || formatReportCurrency(sum.netIncome || (sum.totalPaid || 0) - (sum.totalExpenses || 0)) },
    ],
    columns: [
      { key: 'unitName', label: 'Unit' },
      { key: 'tenantName', label: 'Tenant' },
      { key: 'status', label: 'Status' },
      { key: 'rentDueFormatted', label: 'Rent Due', align: 'right' },
      { key: 'paymentsFormatted', label: 'Received', align: 'right' },
      { key: 'expensesFormatted', label: 'Expenses', align: 'right' },
      { key: 'netIncomeFormatted', label: 'Net Income', align: 'right' },
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

async function generateUnitReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'UNIT FINANCIAL REPORT',
    generatedAt: data.reportDate,
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    metaFields: [
      { label: 'Unit', value: data.unit.name },
      { label: 'Property', value: data.property.name },
      { label: 'Type', value: data.unit.type || '-' },
      { label: 'Current Tenant', value: data.tenant?.name || 'Available' },
    ],
    summaryCards: [
      { label: 'Monthly Rent', value: data.summary.monthlyRentFormatted },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted },
      { label: 'Rent Collected', value: data.summary.totalPaymentsFormatted },
      { label: 'Expenses', value: data.summary.totalExpensesFormatted },
      { label: 'Net Balance', value: data.summary.netBalanceFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'reference', label: 'Reference' },
      { key: 'description', label: 'Description' },
      { key: 'amountFormatted', label: 'Amount (£)', align: 'right' },
      { key: 'status', label: 'Status' },
    ],
    rows: (data.transactions || []).map((t) => ({ ...t, date: formatUKDate(t.date) })),
    totalRow: {
      date: 'TOTALS',
      amountFormatted: data.summary.netBalanceFormatted,
    },
  });
}

async function generatePaymentReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'TENANT PAYMENT REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Payments', value: `${data.summary.totalPaymentsCount}` },
      { label: 'Total Rent Due', value: data.summary.totalRentDueFormatted },
      { label: 'Total Received', value: data.summary.totalPaidFormatted },
      { label: 'Total Remaining', value: data.summary.totalRemainingFormatted },
    ],
    columns: [
      { key: 'dueDate', label: 'Due Date' },
      { key: 'customerName', label: 'Tenant' },
      { key: 'propertyName', label: 'Property / Unit' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'amountFormatted', label: 'Due (£)', align: 'right' },
      { key: 'paidAmountFormatted', label: 'Received (£)', align: 'right' },
      { key: 'status', label: 'Status' },
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

async function generateExpenseReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'EXPENSE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Expenses', value: `${data.summary.totalExpensesCount}` },
      { label: 'Total Amount', value: data.summary.totalAmountFormatted },
      { label: 'Property Expenses', value: data.summary.totalPropertyExpensesFormatted },
      { label: 'Agent Expenses', value: data.summary.totalAgentExpensesFormatted },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'propertyName', label: 'Property / Agent' },
      { key: 'category', label: 'Category' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'amountFormatted', label: 'Amount (£)', align: 'right' },
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

async function generateIncomeReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'RENTAL INCOME PERFORMANCE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `Billing Year ${data.year || new Date().getFullYear()}`,
    summaryCards: [
      { label: 'Expected Income', value: data.summary.totalExpectedFormatted },
      { label: 'Received Income', value: data.summary.totalReceivedFormatted },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted },
      { label: 'Collection Rate', value: `${data.summary.collectionRate}%` },
    ],
    columns: [
      { key: 'monthName', label: 'Month' },
      { key: 'year', label: 'Year' },
      { key: 'expectedFormatted', label: 'Expected (£)', align: 'right' },
      { key: 'receivedFormatted', label: 'Received (£)', align: 'right' },
      { key: 'outstandingFormatted', label: 'Outstanding (£)', align: 'right' },
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

async function generateInvoiceReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'RENT INVOICE REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Full History',
    summaryCards: [
      { label: 'Total Invoices', value: `${data.summary.totalInvoices}` },
      { label: 'Invoiced Amount', value: data.summary.totalInvoicedFormatted },
      { label: 'Total Paid', value: data.summary.totalPaidFormatted },
      { label: 'Outstanding', value: data.summary.totalOutstandingFormatted },
    ],
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'tenantName', label: 'Tenant' },
      { key: 'propertyName', label: 'Property' },
      { key: 'amountFormatted', label: 'Invoiced (£)', align: 'right' },
      { key: 'paidAmountFormatted', label: 'Paid (£)', align: 'right' },
      { key: 'status', label: 'Status' },
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

async function generateFinancialSummaryWord(data) {
  return renderWordReportDoc({
    reportTitle: 'FINANCIAL PERFORMANCE SUMMARY',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: `${formatUKDate(data.fromDate)} - ${formatUKDate(data.toDate)}`,
    summaryCards: [
      { label: 'Gross Income', value: data.summary.grossIncomeFormatted },
      { label: 'Operating Expenses', value: data.summary.totalExpensesFormatted },
      { label: 'Net Income', value: data.summary.netIncomeFormatted },
      { label: 'Bank Debt', value: data.summary.mortgageDebtFormatted },
    ],
    columns: [
      { key: 'category', label: 'Financial Category' },
      { key: 'expectedFormatted', label: 'Expected (£)', align: 'right' },
      { key: 'receivedFormatted', label: 'Actual Received (£)', align: 'right' },
      { key: 'netFormatted', label: 'Net Position (£)', align: 'right' },
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

async function generateMortgageReportWord(data) {
  return renderWordReportDoc({
    reportTitle: 'MORTGAGE & FINANCING REPORT',
    generatedAt: formatUKDate(data.generatedAt),
    periodText: 'Active Mortgages',
    summaryCards: [
      { label: 'Original Loan', value: data.summary.totalOriginalLoanFormatted },
      { label: 'Current Debt', value: data.summary.totalOutstandingFormatted },
      { label: 'Monthly Commitments', value: data.summary.totalMonthlyPaymentsFormatted },
    ],
    columns: [
      { key: 'propertyName', label: 'Property' },
      { key: 'lenderName', label: 'Lender' },
      { key: 'accountNo', label: 'Account #' },
      { key: 'loanFormatted', label: 'Original (£)', align: 'right' },
      { key: 'outstandingFormatted', label: 'Current Debt (£)', align: 'right' },
      { key: 'monthlyFormatted', label: 'Monthly (£)', align: 'right' },
      { key: 'status', label: 'Status' },
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
  renderWordReportDoc,
  generateTenantStatementWord,
  generateLandlordReportWord,
  generateAgentReportWord,
  generatePropertyReportWord,
  generateUnitReportWord,
  generatePaymentReportWord,
  generateExpenseReportWord,
  generateIncomeReportWord,
  generateInvoiceReportWord,
  generateFinancialSummaryWord,
  generateMortgageReportWord,
};
