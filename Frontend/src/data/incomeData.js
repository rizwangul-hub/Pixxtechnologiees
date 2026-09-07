/**
 * Income Manager Data Layer
 * Decouples demo contact lists, line item types, account types, and invoice storage from UI components.
 * Future integration: Replace localStorage with API calls (GET /api/income, POST /api/income).
 */

export const demoContacts = [
  'ABC Properties Ltd',
  'John Smith',
  'Sarah Williams',
  'XYZ Services Ltd',
  'Global Real Estate Management',
  'Apex Maintenance Corp',
];

export const incomeItemTypes = [
  'Other Income',
  'Service Income',
  'Management Fee',
  'Maintenance Income',
  'Commission',
  'Miscellaneous Income',
];

export const incomeAccountTypes = [
  'Other Income',
  'Rental Income',
  'Service Income',
  'Commission Income',
  'Miscellaneous Income',
];

const STORAGE_KEY = 'landlordvision_income_invoices';

/**
 * Retrieves saved invoices from localStorage.
 */
export function getSavedInvoices() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves a new invoice to localStorage.
 */
export function saveInvoice(invoice) {
  const existing = getSavedInvoices();
  const updated = [invoice, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Generates next sequential invoice number (e.g. INV-1275).
 */
export function getNextInvoiceNumber() {
  const existing = getSavedInvoices();
  const baseNum = 1275;
  const nextNum = baseNum + existing.length;
  return `INV-${nextNum}`;
}
