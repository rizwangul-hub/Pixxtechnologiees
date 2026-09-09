import * as XLSX from 'xlsx';
import { getSavedUnits, updateUnit } from './propertiesData';

export const customerTypes = ['Individual', 'Company / Business', 'Organization'];

export const agreementTypes = ['Rent', 'Sale'];

export const paymentFrequencies = ['Monthly', 'Quarterly', 'Bi-Annually', 'Annually', 'One-Time'];

export const paymentMethods = ['Bank Transfer', 'Cash', 'Cheque', 'Online Payment', 'Other'];

export const scheduleStatuses = ['Received', 'Partially Received', 'Pending', 'Overdue'];

// --- DEMO INITIAL DATA ---

export const demoCustomers = [];

export const demoAgreements = [];

export const demoPaymentSchedules = [];

export const demoRecordedPayments = [];

// --- LOCAL STORAGE KEYS ---
const CUSTOMERS_KEY = 'pixx_customers_list';
const AGREEMENTS_KEY = 'pixx_agreements_list';
const SCHEDULES_KEY = 'pixx_payment_schedules_list';
const PAYMENTS_KEY = 'pixx_recorded_payments_list';

// --- CUSTOMER STORAGE & OPERATIONS ---

export function getSavedCustomers() {
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : demoCustomers;
  } catch (e) {
    return demoCustomers;
  }
}

export function saveCustomer(customer) {
  const existing = getSavedCustomers();
  const newCustomer = {
    ...customer,
    id: customer.id || `cust-${Date.now()}`,
    status: customer.status || 'Active',
    createdAt: customer.createdAt || new Date().toISOString().split('T')[0],
  };
  const updated = [newCustomer, ...existing];
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return newCustomer;
}

export function updateCustomer(customerId, updatedFields) {
  const existing = getSavedCustomers();
  const updated = existing.map((c) =>
    c.id === customerId ? { ...c, ...updatedFields, updatedAt: new Date().toISOString() } : c
  );
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteCustomer(customerId) {
  const existing = getSavedCustomers();
  const updated = existing.filter((c) => c.id !== customerId);
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return updated;
}

// --- AGREEMENTS STORAGE & OPERATIONS ---

export function getSavedAgreements() {
  try {
    const data = localStorage.getItem(AGREEMENTS_KEY);
    return data ? JSON.parse(data) : demoAgreements;
  } catch (e) {
    return demoAgreements;
  }
}

export function getAgreementsByCustomer(customerId) {
  const agreements = getSavedAgreements();
  return agreements.filter((a) => a.customerId === customerId);
}

export function saveAgreement(agreementData) {
  const agreements = getSavedAgreements();
  const newAgrId = `agr-${Date.now()}`;

  const newAgreement = {
    ...agreementData,
    id: newAgrId,
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedAgreements = [newAgreement, ...agreements];
  localStorage.setItem(AGREEMENTS_KEY, JSON.stringify(updatedAgreements));

  // Update corresponding Unit status to Occupied and set customerName
  if (agreementData.unitId) {
    updateUnit(agreementData.unitId, {
      status: 'Occupied',
      customerName: agreementData.customerName,
    });
  }

  // Generate automated payment schedules for this agreement
  generatePaymentScheduleForAgreement(newAgreement);

  return newAgreement;
}

export function terminateAgreement(agreementId) {
  const agreements = getSavedAgreements();
  const agreement = agreements.find((a) => a.id === agreementId);

  if (agreement) {
    // Update agreement status to Terminated
    const updatedAgreements = agreements.map((a) =>
      a.id === agreementId ? { ...a, status: 'Terminated', terminatedAt: new Date().toISOString().split('T')[0] } : a
    );
    localStorage.setItem(AGREEMENTS_KEY, JSON.stringify(updatedAgreements));

    // Revert unit status to Available
    if (agreement.unitId) {
      updateUnit(agreement.unitId, {
        status: 'Available',
        customerName: null,
      });
    }
  }

  return getSavedAgreements();
}

// --- PAYMENT SCHEDULE GENERATOR & OPERATIONS ---

export function computeScheduleStatus(item) {
  const expected = Number(item.expectedAmount) || 0;
  const paid = Number(item.paidAmount) || 0;
  const remaining = expected - paid;
  const today = new Date().toISOString().split('T')[0];

  if (remaining <= 0) {
    return 'Received';
  }
  if (paid > 0 && item.dueDate < today) {
    return 'Overdue';
  }
  if (paid > 0) {
    return 'Partially Received';
  }
  if (item.dueDate < today) {
    return 'Overdue';
  }
  return 'Pending';
}

export function getSavedPaymentSchedules() {
  try {
    const data = localStorage.getItem(SCHEDULES_KEY);
    const schedules = data ? JSON.parse(data) : demoPaymentSchedules;

    // Dynamically auto-calculate status based on dueDate & paidAmount
    return schedules.map((item) => ({
      ...item,
      status: computeScheduleStatus(item),
    }));
  } catch (e) {
    return demoPaymentSchedules.map((item) => ({
      ...item,
      status: computeScheduleStatus(item),
    }));
  }
}

export function generatePaymentScheduleForAgreement(agreement) {
  const existingSchedules = getSavedPaymentSchedules();
  const newItems = [];

  const {
    id: agreementId,
    customerId,
    customerName,
    propertyId,
    propertyName,
    unitId,
    unitName,
    agreementType,
    startDate,
    endDate,
    monthlyOrSalePrice,
    securityDeposit,
    dueDayOfMonth = 1,
  } = agreement;

  const start = new Date(startDate || new Date());
  const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  const price = Number(monthlyOrSalePrice) || 0;

  // If Security Deposit is present, add initial security deposit schedule item
  if (Number(securityDeposit) > 0) {
    newItems.push({
      id: `sched-sec-${Date.now()}`,
      agreementId,
      customerId,
      customerName,
      propertyId,
      propertyName,
      unitId,
      unitName,
      periodName: 'Security Deposit',
      dueDate: startDate,
      expectedAmount: Number(securityDeposit),
      paidAmount: 0,
      remainingAmount: Number(securityDeposit),
      type: 'Security Deposit',
      status: computeScheduleStatus({ expectedAmount: securityDeposit, paidAmount: 0, dueDate: startDate }),
      notes: 'Initial refundable security deposit',
    });
  }

  if (agreementType === 'Rent') {
    // Generate monthly rent schedules from start to end date
    let current = new Date(start);
    let monthCount = 0;

    while (current <= end && monthCount < 60) {
      // Limit to 5 years max
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Due date calculation
      const dueDay = Math.min(Number(dueDayOfMonth) || 1, 28);
      const dueDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

      newItems.push({
        id: `sched-${agreementId}-${monthCount + 1}-${Date.now()}`,
        agreementId,
        customerId,
        customerName,
        propertyId,
        propertyName,
        unitId,
        unitName,
        periodName: `${monthLabel} Rent`,
        dueDate: dueDateStr,
        expectedAmount: price,
        paidAmount: 0,
        remainingAmount: price,
        type: 'Rent',
        status: computeScheduleStatus({ expectedAmount: price, paidAmount: 0, dueDate: dueDateStr }),
        notes: `Monthly rent obligation for ${monthLabel}`,
      });

      // Move to next month
      current.setMonth(current.getMonth() + 1);
      monthCount++;
    }
  } else if (agreementType === 'Sale') {
    // Sale agreement - full price or down payment + installments
    newItems.push({
      id: `sched-${agreementId}-sale-full-${Date.now()}`,
      agreementId,
      customerId,
      customerName,
      propertyId,
      propertyName,
      unitId,
      unitName,
      periodName: 'Property Sale Price',
      dueDate: startDate,
      expectedAmount: price,
      paidAmount: 0,
      remainingAmount: price,
      type: 'Sale',
      status: computeScheduleStatus({ expectedAmount: price, paidAmount: 0, dueDate: startDate }),
      notes: 'Total agreed sale price payment obligation',
    });
  }

  const updatedAll = [...newItems, ...existingSchedules];
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(updatedAll));
  return newItems;
}

// --- RECORDED PAYMENTS STORAGE & OPERATIONS ---

export function getSavedRecordedPayments() {
  try {
    const data = localStorage.getItem(PAYMENTS_KEY);
    return data ? JSON.parse(data) : demoRecordedPayments;
  } catch (e) {
    return demoRecordedPayments;
  }
}

export function recordPayment(paymentData) {
  const payments = getSavedRecordedPayments();
  const newPayment = {
    ...paymentData,
    id: `pay-${Date.now()}`,
    amountPaid: Number(paymentData.amountPaid) || 0,
    recordedBy: paymentData.recordedBy || 'Manager',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedPayments = [newPayment, ...payments];
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updatedPayments));

  // Update corresponding PaymentSchedule item if scheduleId is provided
  if (paymentData.scheduleId) {
    const schedules = getSavedPaymentSchedules();
    const updatedSchedules = schedules.map((sched) => {
      if (sched.id === paymentData.scheduleId) {
        const newPaid = (Number(sched.paidAmount) || 0) + newPayment.amountPaid;
        const expected = Number(sched.expectedAmount) || 0;
        const newRemaining = Math.max(0, expected - newPaid);
        const updatedItem = {
          ...sched,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
        };
        return {
          ...updatedItem,
          status: computeScheduleStatus(updatedItem),
        };
      }
      return sched;
    });

    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(updatedSchedules));
  }

  return newPayment;
}

// --- METRICS COMPUTATION HELPERS ---

export function getCustomerMetrics(customerId) {
  const agreements = getAgreementsByCustomer(customerId);
  const allSchedules = getSavedPaymentSchedules().filter((s) => s.customerId === customerId);
  const allPayments = getSavedRecordedPayments().filter((p) => p.customerId === customerId);

  const totalExpected = allSchedules.reduce((sum, s) => sum + (Number(s.expectedAmount) || 0), 0);
  const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const totalPending = allSchedules
    .filter((s) => s.status === 'Pending' || s.status === 'Partially Paid')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);
  const totalOverdue = allSchedules
    .filter((s) => s.status === 'Overdue')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);

  return {
    activeAgreementsCount: agreements.filter((a) => a.status === 'Active').length,
    totalExpected,
    totalPaid,
    totalPending,
    totalOverdue,
  };
}

export function getOverallPaymentMetrics() {
  const schedules = getSavedPaymentSchedules();
  const payments = getSavedRecordedPayments();

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const totalPending = schedules
    .filter((s) => s.status === 'Pending' || s.status === 'Partially Paid')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);
  const totalOverdue = schedules
    .filter((s) => s.status === 'Overdue')
    .reduce((sum, s) => sum + (Number(s.remainingAmount) || 0), 0);

  return {
    totalCollected,
    totalPending,
    totalOverdue,
    totalSchedulesCount: schedules.length,
    paidCount: schedules.filter((s) => s.status === 'Paid').length,
    overdueCount: schedules.filter((s) => s.status === 'Overdue').length,
    pendingCount: schedules.filter((s) => s.status === 'Pending').length,
  };
}

// --- EXPORT UTILITIES (EXCEL & CSV) ---

export function exportCustomersToFile(customers, format = 'xlsx') {
  const exportData = customers.map((c) => {
    const metrics = getCustomerMetrics(c.id);
    return {
      'Customer Name': c.name || c.fullName || '—',
      'Type': c.type || 'Individual',
      'Phone': c.phone || '—',
      'Email': c.email || '—',
      'NINO / Reg No': c.cnicOrReg || '—',
      'Address': c.address || '—',
      'City': c.city || '—',
      'Active Agreements': metrics.activeAgreementsCount || 0,
      'Total Paid (£)': metrics.totalPaid || 0,
      'Total Pending (£)': metrics.totalPending || 0,
      'Total Overdue (£)': metrics.totalOverdue || 0,
      'Status': c.status || 'Active',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  const filename = `Pixx_Customers_Export_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

export function exportPaymentSchedulesToFile(schedules, format = 'xlsx') {
  const exportData = schedules.map((s) => ({
    'Customer': s.customerName || '—',
    'Property': s.propertyName || '—',
    'Unit': s.unitName || '—',
    'Period / Obligation': s.periodName || '—',
    'Due Date': s.dueDate || '—',
    'Expected Amount (£)': s.expectedAmount || 0,
    'Paid Amount (£)': s.paidAmount || 0,
    'Remaining Balance (£)': s.remainingAmount || 0,
    'Status': s.status || 'Pending',
    'Type': s.type || 'Rent',
    'Notes': s.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PaymentSchedules');

  const filename = `Pixx_Payment_Schedules_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

export function exportPaymentsToFile(payments, format = 'xlsx') {
  const exportData = payments.map((p) => ({
    'Customer': p.customerName || '—',
    'Property': p.propertyName || '—',
    'Unit': p.unitName || '—',
    'Amount Paid (£)': p.amountPaid || 0,
    'Payment Date': p.paymentDate || '—',
    'Payment Method': p.paymentMethod || 'Bank Transfer',
    'Reference / Txn No': p.referenceNo || '—',
    'Recorded By': p.recordedBy || 'Manager',
    'Notes': p.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RecordedPayments');

  const filename = `Pixx_Recorded_Payments_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}
