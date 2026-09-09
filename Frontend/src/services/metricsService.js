import { getSavedProperties, getSavedUnits } from '../data/propertiesData';
import {
  getSavedCustomers,
  getSavedAgreements,
  getSavedPaymentSchedules,
  getSavedRecordedPayments,
  computeScheduleStatus,
} from '../data/customersData';

/**
 * Reusable Calculation & Metrics Service
 * Serves as the single source of truth for Dashboard, Reports, and Exports.
 */

// Helper to calculate days difference between two dates
export function calculateDaysOverdue(dueDateStr) {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// --- BASIC COUNTS ---

export function getTotalPropertiesCount() {
  return getSavedProperties().length;
}

// In the new model, each property IS an individual rentable unit
export function getTotalUnitsCount() {
  return getSavedProperties().length;
}

export function getOccupiedUnitsCount() {
  return getSavedProperties().filter((p) => p.status === 'Occupied').length;
}

export function getAvailableUnitsCount() {
  return getSavedProperties().filter((p) => p.status === 'Available').length;
}

export function getReservedUnitsCount() {
  return getSavedProperties().filter((p) => p.status === 'Reserved').length;
}

export function getTotalCustomersCount() {
  return getSavedCustomers().length;
}

// --- FINANCIAL COMPUTATIONS ---

export function getFinancialOverview() {
  const properties = getSavedProperties();
  const schedules = getSavedPaymentSchedules();
  const payments = getSavedRecordedPayments();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Monthly expected rent from properties with monthly_rent price type
  const monthlyExpectedRent = properties
    .filter((p) => p.priceType === 'monthly_rent' || !p.priceType)
    .reduce((sum, p) => sum + (Number(p.monthlyRent) || Number(p.price) || 0), 0);

  // Payments received in the current calendar month
  const paymentsReceivedThisMonth = payments
    .filter((p) => {
      if (!p.paymentDate) return false;
      const d = new Date(p.paymentDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

  // Pending & Overdue amounts from schedules
  const pendingAmount = schedules
    .filter((s) => s.status === 'Pending' || s.status === 'Partially Paid')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);

  const overdueAmount = schedules
    .filter((s) => s.status === 'Overdue')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);

  const totalPendingAndOverdue = pendingAmount + overdueAmount;

  const totalCollectedAllTime = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

  return {
    monthlyExpectedRent,
    paymentsReceivedThisMonth,
    pendingAmount,
    overdueAmount,
    totalPendingAndOverdue,
    totalCollectedAllTime,
  };
}

// --- DASHBOARD TABLE DATASETS ---

export function getRecentPaymentsList(limit = 5) {
  const payments = getSavedRecordedPayments();
  return payments.slice(0, limit);
}

export function getUpcomingPaymentsList(limit = 5) {
  const schedules = getSavedPaymentSchedules();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLaterDate = new Date();
  thirtyDaysLaterDate.setDate(thirtyDaysLaterDate.getDate() + 30);
  const thirtyDaysLater = thirtyDaysLaterDate.toISOString().split('T')[0];

  const upcoming = schedules.filter((s) => {
    return (s.status === 'Pending' || s.status === 'Partially Paid') && s.dueDate >= today && s.dueDate <= thirtyDaysLater;
  });

  // Sort by earliest due date
  upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return upcoming.slice(0, limit);
}

export function getOverduePaymentsList(limit = 10) {
  const schedules = getSavedPaymentSchedules();
  const overdue = schedules
    .filter((s) => s.status === 'Overdue')
    .map((s) => ({
      ...s,
      daysOverdue: calculateDaysOverdue(s.dueDate),
    }));

  // Sort by highest days overdue first
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return limit ? overdue.slice(0, limit) : overdue;
}

export function getAvailableUnitsList(limit = 5) {
  const units = getSavedUnits();
  const properties = getSavedProperties();

  const available = units
    .filter((u) => u.status === 'Available')
    .map((u) => {
      const propObj = properties.find((p) => p.id === u.propertyId);
      return {
        ...u,
        propertyName: propObj ? propObj.name : 'Property',
      };
    });

  return limit ? available.slice(0, limit) : available;
}

// --- REPORT DATASETS ---

export function getPropertyReportData(filters = {}) {
  const properties = getSavedProperties();
  const units = getSavedUnits();

  return properties
    .filter((p) => {
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matches = p.name.toLowerCase().includes(q) || (p.address && p.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.propertyId && filters.propertyId !== 'All' && p.id !== filters.propertyId) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const propUnits = units.filter((u) => u.propertyId === p.id);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address || '',
        totalUnits: propUnits.length,
        occupiedUnits: propUnits.filter((u) => u.status === 'Occupied').length,
        availableUnits: propUnits.filter((u) => u.status === 'Available').length,
        status: p.status || 'Active',
      };
    });
}

export function getUnitReportData(filters = {}) {
  const units = getSavedUnits();
  const properties = getSavedProperties();

  return units
    .filter((u) => {
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matches = (u.name && u.name.toLowerCase().includes(q)) || (u.type && u.type.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.propertyId && filters.propertyId !== 'All') {
        const uPropId = u.propertyId?._id ? u.propertyId._id.toString() : u.propertyId ? u.propertyId.toString() : '';
        if (uPropId !== filters.propertyId.toString()) return false;
      }
      if (filters.status && filters.status !== 'All' && u.status !== filters.status) {
        return false;
      }
      return true;
    })
    .map((u) => {
      const uPropId = u.propertyId?._id ? u.propertyId._id.toString() : u.propertyId ? u.propertyId.toString() : '';
      const propObj = properties.find((p) => (p.id || p._id)?.toString() === uPropId);
      return {
        ...u,
        propertyName: propObj ? (propObj.name || propObj.propertyName) : 'Property',
        customerName: u.customerName || '—',
      };
    });
}

export function getCustomerReportData(filters = {}) {
  const customers = getSavedCustomers();
  const agreements = getSavedAgreements();

  return customers
    .filter((c) => {
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.status && filters.status !== 'All' && c.status !== filters.status) {
        return false;
      }
      return true;
    })
    .map((c) => {
      const activeAgreements = agreements.filter((a) => a.customerId === c.id && a.status === 'Active');
      const primaryAgr = activeAgreements[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '—',
        email: c.email || '—',
        address: c.address || '—',
        propertyName: primaryAgr ? primaryAgr.propertyName : '—',
        unitName: primaryAgr ? primaryAgr.unitName : '—',
        agreementType: primaryAgr ? primaryAgr.agreementType : '—',
        startDate: primaryAgr ? primaryAgr.startDate : '—',
        endDate: primaryAgr ? primaryAgr.endDate : '—',
        status: c.status || 'Active',
      };
    });
}

export function getPaymentReportData(filters = {}) {
  const payments = getSavedRecordedPayments();
  const schedules = getSavedPaymentSchedules();

  return payments.filter((p) => {
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matches =
        p.customerName.toLowerCase().includes(q) ||
        (p.propertyName && p.propertyName.toLowerCase().includes(q)) ||
        (p.unitName && p.unitName.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filters.propertyId && filters.propertyId !== 'All' && p.propertyId !== filters.propertyId) {
      return false;
    }
    if (filters.dateFrom && p.paymentDate < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && p.paymentDate > filters.dateTo) {
      return false;
    }
    return true;
  });
}

export function getOutstandingPaymentReportData(filters = {}) {
  const schedules = getSavedPaymentSchedules();
  const overdueOrPending = schedules
    .filter((s) => s.status === 'Overdue' || s.status === 'Partially Paid' || s.status === 'Pending')
    .map((s) => ({
      ...s,
      daysOverdue: calculateDaysOverdue(s.dueDate),
    }));

  return overdueOrPending.filter((s) => {
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matches =
        s.customerName.toLowerCase().includes(q) ||
        (s.propertyName && s.propertyName.toLowerCase().includes(q)) ||
        (s.unitName && s.unitName.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filters.propertyId && filters.propertyId !== 'All' && s.propertyId !== filters.propertyId) {
      return false;
    }
    if (filters.status && filters.status !== 'All' && s.status !== filters.status) {
      return false;
    }
    return true;
  });
}

export function getRentalIncomeReportData(filters = {}) {
  const schedules = getSavedPaymentSchedules();
  const payments = getSavedRecordedPayments();

  let filteredSchedules = schedules;
  let filteredPayments = payments;

  if (filters.propertyId && filters.propertyId !== 'All') {
    filteredSchedules = filteredSchedules.filter((s) => s.propertyId === filters.propertyId);
    filteredPayments = filteredPayments.filter((p) => p.propertyId === filters.propertyId);
  }

  if (filters.dateFrom) {
    filteredSchedules = filteredSchedules.filter((s) => s.dueDate >= filters.dateFrom);
    filteredPayments = filteredPayments.filter((p) => p.paymentDate >= filters.dateFrom);
  }

  if (filters.dateTo) {
    filteredSchedules = filteredSchedules.filter((s) => s.dueDate <= filters.dateTo);
    filteredPayments = filteredPayments.filter((p) => p.paymentDate <= filters.dateTo);
  }

  const totalExpectedRent = filteredSchedules.reduce((sum, s) => sum + (Number(s.expectedAmount) || 0), 0);
  const totalReceived = filteredPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const totalPending = filteredSchedules
    .filter((s) => s.status === 'Pending' || s.status === 'Partially Paid')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);
  const totalOverdue = filteredSchedules
    .filter((s) => s.status === 'Overdue')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);

  return {
    totalExpectedRent,
    totalReceived,
    totalPending,
    totalOverdue,
    detailedSchedules: filteredSchedules,
  };
}
