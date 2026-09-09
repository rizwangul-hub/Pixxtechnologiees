/**
 * Data layer for Payments Manager
 * Handles Expense Payments and Income Payments state and filters.
 */

export const demoSuppliers = [
  'Claudio Calanna',
  'Z&Z Services Ltd',
  'Carpet Express London',
  'ABC Property Services',
  'London Maintenance Ltd',
];

export const demoPayers = [
  'John Smith',
  'Sarah Williams',
  'Michael Brown',
  'Emily Davis',
  'ABC Properties Ltd',
];

export const bankAccounts = [
  'My Bank Account',
  'Old Street Bank Account',
  'Petty Cash',
];

export const paymentTypes = [
  'Bank Transfer',
  'Direct Debit',
  'Standing Order',
  'Cash',
  'Cheque',
  'Credit Card',
];

export const demoExpensePayments = [];

export const demoIncomePayments = [];

const EXPENSE_PAYMENTS_KEY = 'landlordvision_expense_payments';
const INCOME_PAYMENTS_KEY = 'landlordvision_income_payments';

export function getSavedExpensePayments() {
  try {
    const data = localStorage.getItem(EXPENSE_PAYMENTS_KEY);
    return data ? JSON.parse(data) : demoExpensePayments;
  } catch (e) {
    return demoExpensePayments;
  }
}

export function saveExpensePayment(payment) {
  const existing = getSavedExpensePayments();
  const updated = [payment, ...existing];
  localStorage.setItem(EXPENSE_PAYMENTS_KEY, JSON.stringify(updated));
  return updated;
}

export function getSavedIncomePayments() {
  try {
    const data = localStorage.getItem(INCOME_PAYMENTS_KEY);
    return data ? JSON.parse(data) : demoIncomePayments;
  } catch (e) {
    return demoIncomePayments;
  }
}

export function saveIncomePayment(payment) {
  const existing = getSavedIncomePayments();
  const updated = [payment, ...existing];
  localStorage.setItem(INCOME_PAYMENTS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Multi-criteria filter for payment records
 */
export function filterPayments(payments, filters, isIncomeTab = false) {
  return payments.filter((item) => {
    // Text search
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      const party = (isIncomeTab ? item.payer : item.supplier) || '';
      const matchesSearch =
        party.toLowerCase().includes(q) ||
        (item.reference && item.reference.toLowerCase().includes(q)) ||
        (item.property && item.property.toLowerCase().includes(q)) ||
        (item.account && item.account.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // Filter By Dropdown
    if (filters.searchBy && filters.searchBy !== '- All -') {
      const q = (filters.search || '').toLowerCase().trim();
      if (q) {
        if (filters.searchBy === 'Supplier' && !isIncomeTab) {
          if (!item.supplier || !item.supplier.toLowerCase().includes(q)) return false;
        } else if (filters.searchBy === 'Payer' && isIncomeTab) {
          if (!item.payer || !item.payer.toLowerCase().includes(q)) return false;
        } else if (filters.searchBy === 'Reference') {
          if (!item.reference || !item.reference.toLowerCase().includes(q)) return false;
        } else if (filters.searchBy === 'Property') {
          if (!item.property || !item.property.toLowerCase().includes(q)) return false;
        } else if (filters.searchBy === 'Account') {
          if (!item.account || !item.account.toLowerCase().includes(q)) return false;
        }
      }
    }

    // Date From
    if (filters.dateFrom) {
      if (new Date(item.date) < new Date(filters.dateFrom)) return false;
    }

    // Date To
    if (filters.dateTo) {
      if (new Date(item.date) > new Date(filters.dateTo)) return false;
    }

    // Amount From
    if (filters.amountFrom !== '' && filters.amountFrom !== undefined && filters.amountFrom !== null) {
      if (item.paymentAmount < parseFloat(filters.amountFrom)) return false;
    }

    // Amount To
    if (filters.amountTo !== '' && filters.amountTo !== undefined && filters.amountTo !== null) {
      if (item.paymentAmount > parseFloat(filters.amountTo)) return false;
    }

    return true;
  });
}
