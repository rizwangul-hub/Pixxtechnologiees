/**
 * Dashboard Payment Monitoring Data Layer
 * Separates payment records and calculation logic from UI components.
 */

export const dashboardPaymentsData = {
  overdue: {
    rentCharges: [],
    propertyExpenses: [],
  },
  upcoming: {
    rentCharges: [],
    propertyExpenses: [],
  },
};

/**
 * Calculates total overdue metrics dynamically from underlying records.
 */
export function calculateOverdueTotals(rentCharges = [], propertyExpenses = []) {
  const count = (rentCharges?.length || 0) + (propertyExpenses?.length || 0);

  const rentTotal = (rentCharges || []).reduce((sum, item) => sum + (Number(item.rentOverdue) || 0), 0);
  const chargesTotal = (rentCharges || []).reduce((sum, item) => sum + (Number(item.chargesOverdue) || 0), 0);
  const rentChargesGrandTotal = rentTotal + chargesTotal;

  const expensesTotal = (propertyExpenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    count,
    rentTotal,
    chargesTotal,
    rentChargesGrandTotal,
    expensesTotal,
    grandTotal: rentChargesGrandTotal + expensesTotal,
  };
}

/**
 * Calculates total upcoming metrics dynamically from underlying records.
 */
export function calculateUpcomingTotals(rentCharges = [], propertyExpenses = []) {
  const count = (rentCharges?.length || 0) + (propertyExpenses?.length || 0);

  const rentTotal = (rentCharges || []).reduce((sum, item) => sum + (Number(item.rent) || 0), 0);
  const chargesTotal = (rentCharges || []).reduce((sum, item) => sum + (Number(item.charges) || 0), 0);
  const rentChargesGrandTotal = (rentCharges || []).reduce(
    (sum, item) => sum + (Number(item.rent) || 0) + (Number(item.charges) || 0),
    0
  );

  const expensesTotal = (propertyExpenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    count,
    rentTotal,
    chargesTotal,
    rentChargesGrandTotal,
    expensesTotal,
    grandTotal: rentChargesGrandTotal + expensesTotal,
  };
}