/**
 * Expense Management Data Layer
 * Separates demo records, supplier lists, property lists, and filtering functions from UI.
 * Future integration: Replace demo data with API requests (GET /api/expenses).
 */

export const demoSuppliers = [
  'All',
  'Z&Z Services Ltd',
  'Carpet Express London',
  'Claudio Calanna',
  'ABC Property Services',
  'London Maintenance Ltd',
];

export const demoProperties = [
  'All',
  '82 COMO STREET',
  '7 Vansittart Street',
  '26A Clarence Road GRAYS RM17 6QJ',
  '15 Clarance Road (Shop)',
  '12 Alexandra Street',
];

export const demoExpenses = [];

/**
 * Filter expense records based on search criteria, dropdown selections, date ranges, and status tab.
 */
export function filterExpenses(expenses = [], filters = {}, activeTab = 'all', sortOrder = 'desc') {
  let result = [...expenses];

  // 1. Status Tab Filter
  if (activeTab === 'awaiting_payment') {
    result = result.filter((item) => item.status === 'awaiting_payment' || item.amountDue > 0);
  } else if (activeTab === 'fully_paid') {
    result = result.filter((item) => item.status === 'fully_paid' || (item.amountPaid > 0 && item.amountDue === 0));
  } else if (activeTab === 'repeating') {
    result = result.filter((item) => item.isRepeating || item.status === 'repeating');
  }

  // 2. Search Text
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (item) =>
        (item.supplierName && item.supplierName.toLowerCase().includes(q)) ||
        (item.reference && item.reference.toLowerCase().includes(q)) ||
        (item.propertyName && item.propertyName.toLowerCase().includes(q))
    );
  }

  // 3. Supplier Dropdown
  if (filters.supplier && filters.supplier !== 'All') {
    result = result.filter((item) => item.supplierName === filters.supplier);
  }

  // 4. Property Dropdown
  if (filters.property && filters.property !== 'All') {
    result = result.filter((item) => item.propertyName === filters.property);
  }

  // 5. Date From & To
  if (filters.dateFrom) {
    result = result.filter((item) => item.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    result = result.filter((item) => item.date <= filters.dateTo);
  }

  // 6. Due Date From & To
  if (filters.dueDateFrom) {
    result = result.filter((item) => item.dueDate >= filters.dueDateFrom);
  }
  if (filters.dueDateTo) {
    result = result.filter((item) => item.dueDate <= filters.dueDateTo);
  }

  // 7. Paid Amount From & To
  if (filters.paidAmountFrom !== '' && filters.paidAmountFrom !== undefined) {
    result = result.filter((item) => item.amountPaid >= Number(filters.paidAmountFrom));
  }
  if (filters.paidAmountTo !== '' && filters.paidAmountTo !== undefined) {
    result = result.filter((item) => item.amountPaid <= Number(filters.paidAmountTo));
  }

  // 8. Due Amount From & To
  if (filters.dueAmountFrom !== '' && filters.dueAmountFrom !== undefined) {
    result = result.filter((item) => item.amountDue >= Number(filters.dueAmountFrom));
  }
  if (filters.dueAmountTo !== '' && filters.dueAmountTo !== undefined) {
    result = result.filter((item) => item.amountDue <= Number(filters.dueAmountTo));
  }

  // 9. Date Sorting
  result.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return result;
}