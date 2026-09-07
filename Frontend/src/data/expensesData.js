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

export const demoExpenses = [
  {
    id: 'exp-101',
    portfolioId: 'port-1',
    propertyId: 'prop-1',
    supplierId: 'sup-1',
    supplierName: 'Z&Z Services Ltd',
    reference: '82 Como Street',
    propertyName: '82 COMO STREET',
    date: '2025-01-12',
    dueDate: '2025-01-12',
    amountPaid: 1700.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-102',
    portfolioId: 'port-1',
    propertyId: 'prop-2',
    supplierId: 'sup-2',
    supplierName: 'Carpet Express London',
    reference: 'Invoice No 221',
    propertyName: '7 Vansittart Street',
    date: '2025-01-08',
    dueDate: '2025-01-08',
    amountPaid: 0.0,
    amountDue: 850.0,
    status: 'awaiting_payment',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-103',
    portfolioId: 'port-1',
    propertyId: 'prop-3',
    supplierId: 'sup-3',
    supplierName: 'Claudio Calanna',
    reference: '26 clarance Road',
    propertyName: '26A Clarence Road GRAYS RM17 6QJ',
    date: '2025-01-06',
    dueDate: '2025-01-06',
    amountPaid: 1000.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-104',
    portfolioId: 'port-1',
    propertyId: 'prop-4',
    supplierId: 'sup-4',
    supplierName: 'ABC Property Services',
    reference: 'REF-2024-88',
    propertyName: '15 Clarance Road (Shop)',
    date: '2024-12-20',
    dueDate: '2025-01-05',
    amountPaid: 0.0,
    amountDue: 1450.0,
    status: 'awaiting_payment',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-105',
    portfolioId: 'port-1',
    propertyId: 'prop-5',
    supplierId: 'sup-5',
    supplierName: 'London Maintenance Ltd',
    reference: 'Monthly Boiler Servicing',
    propertyName: '12 Alexandra Street',
    date: '2024-12-15',
    dueDate: '2024-12-15',
    amountPaid: 350.0,
    amountDue: 0.0,
    status: 'repeating',
    isRepeating: true,
    currency: 'GBP',
  },
  {
    id: 'exp-106',
    portfolioId: 'port-1',
    propertyId: 'prop-1',
    supplierId: 'sup-1',
    supplierName: 'Z&Z Services Ltd',
    reference: 'Painting & Decorating',
    propertyName: '82 COMO STREET',
    date: '2024-12-01',
    dueDate: '2024-12-01',
    amountPaid: 2100.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-107',
    portfolioId: 'port-1',
    propertyId: 'prop-2',
    supplierId: 'sup-2',
    supplierName: 'Carpet Express London',
    reference: 'Flooring Unit 2',
    propertyName: '7 Vansittart Street',
    date: '2024-11-28',
    dueDate: '2024-12-10',
    amountPaid: 450.0,
    amountDue: 450.0,
    status: 'awaiting_payment',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-108',
    portfolioId: 'port-1',
    propertyId: 'prop-3',
    supplierId: 'sup-3',
    supplierName: 'Claudio Calanna',
    reference: 'Plumbing Emergency Fix',
    propertyName: '26A Clarence Road GRAYS RM17 6QJ',
    date: '2024-11-15',
    dueDate: '2024-11-15',
    amountPaid: 620.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-109',
    portfolioId: 'port-1',
    propertyId: 'prop-4',
    supplierId: 'sup-5',
    supplierName: 'London Maintenance Ltd',
    reference: 'Fire Alarm Safety Audit',
    propertyName: '15 Clarance Road (Shop)',
    date: '2024-11-01',
    dueDate: '2024-11-01',
    amountPaid: 290.0,
    amountDue: 0.0,
    status: 'repeating',
    isRepeating: true,
    currency: 'GBP',
  },
  {
    id: 'exp-110',
    portfolioId: 'port-1',
    propertyId: 'prop-5',
    supplierId: 'sup-4',
    supplierName: 'ABC Property Services',
    reference: 'Roof Leak Repair',
    propertyName: '12 Alexandra Street',
    date: '2024-10-22',
    dueDate: '2024-11-05',
    amountPaid: 1800.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-111',
    portfolioId: 'port-1',
    propertyId: 'prop-1',
    supplierId: 'sup-1',
    supplierName: 'Z&Z Services Ltd',
    reference: 'Electrical Rewiring Stage 1',
    propertyName: '82 COMO STREET',
    date: '2024-10-10',
    dueDate: '2024-10-10',
    amountPaid: 3200.0,
    amountDue: 0.0,
    status: 'fully_paid',
    isRepeating: false,
    currency: 'GBP',
  },
  {
    id: 'exp-112',
    portfolioId: 'port-1',
    propertyId: 'prop-2',
    supplierId: 'sup-5',
    supplierName: 'London Maintenance Ltd',
    reference: 'Garden Clearance & Fence Repair',
    propertyName: '7 Vansittart Street',
    date: '2024-09-25',
    dueDate: '2024-10-01',
    amountPaid: 0.0,
    amountDue: 550.0,
    status: 'awaiting_payment',
    isRepeating: false,
    currency: 'GBP',
  },
];

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
