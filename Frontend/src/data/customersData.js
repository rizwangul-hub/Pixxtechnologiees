import * as XLSX from 'xlsx';
import { getSavedUnits, updateUnit } from './propertiesData';

export const customerTypes = ['Individual', 'Company / Business', 'Organization'];

export const agreementTypes = ['Rent', 'Sale'];

export const paymentFrequencies = ['Monthly', 'Quarterly', 'Bi-Annually', 'Annually', 'One-Time'];

export const paymentMethods = ['Bank Transfer', 'Cash', 'Cheque', 'Online Payment', 'Other'];

export const scheduleStatuses = ['Received', 'Partially Received', 'Pending', 'Overdue'];

// --- DEMO INITIAL DATA ---

export const demoCustomers = [
  {
    id: 'cust-1',
    name: 'Centennial Property Ltd',
    type: 'Company / Business',
    phone: '+44 20 7946 0111',
    email: 'info@centennialprop.com',
    cnicOrReg: 'REG-987654',
    address: 'Suite 4, Business Park, London',
    city: 'London',
    notes: 'Long-term corporate tenant across multiple units.',
    status: 'Active',
    createdAt: '2025-01-01',
  },
  {
    id: 'cust-2',
    name: 'Danial Butt',
    type: 'Individual',
    phone: '+44 20 7946 0222',
    email: 'danial.butt@example.com',
    cnicOrReg: 'QQ 12 34 56 A',
    address: '42 Oxford Street, London',
    city: 'London',
    notes: 'Individual tenant occupying office suite.',
    status: 'Active',
    createdAt: '2025-01-02',
  },
  {
    id: 'cust-3',
    name: 'Baffour Duah Agyemang',
    type: 'Individual',
    phone: '+44 20 7946 0333',
    email: 'baffour.agyemang@example.com',
    cnicOrReg: 'PL 65 43 21 B',
    address: 'Flat 201, Regent Heights, London',
    city: 'London',
    notes: 'Residential flat tenant.',
    status: 'Active',
    createdAt: '2025-01-03',
  },
  {
    id: 'cust-4',
    name: 'Constantin-Florin Istrate',
    type: 'Individual',
    phone: '+44 20 7946 0444',
    email: 'constantin@example.com',
    cnicOrReg: 'NR 99 88 77 C',
    address: 'Como Street Plaza, London',
    city: 'London',
    notes: 'Retail shop tenant.',
    status: 'Active',
    createdAt: '2025-01-10',
  },
  {
    id: 'cust-5',
    name: 'Ivape Grays Limited',
    type: 'Company / Business',
    phone: '+44 1375 800100',
    email: 'contact@ivapegrays.com',
    cnicOrReg: 'REG-112233',
    address: 'Clarence Road Shops, Grays, Essex',
    city: 'Grays',
    notes: 'Vape retail business tenant.',
    status: 'Active',
    createdAt: '2025-01-12',
  },
];

export const demoAgreements = [
  {
    id: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    agreementType: 'Rent',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    monthlyOrSalePrice: 250000,
    securityDeposit: 500000,
    paymentFrequency: 'Monthly',
    dueDayOfMonth: 5,
    status: 'Active',
    notes: '1-year commercial lease',
    createdAt: '2025-01-01',
  },
  {
    id: 'agr-2',
    customerId: 'cust-2',
    customerName: 'Danial Butt',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-103',
    unitName: 'Office 101',
    agreementType: 'Rent',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    monthlyOrSalePrice: 320000,
    securityDeposit: 640000,
    paymentFrequency: 'Monthly',
    dueDayOfMonth: 1,
    status: 'Active',
    notes: 'Office lease contract',
    createdAt: '2025-01-01',
  },
  {
    id: 'agr-3',
    customerId: 'cust-3',
    customerName: 'Baffour Duah Agyemang',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-104',
    unitName: 'Flat 201',
    agreementType: 'Rent',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    monthlyOrSalePrice: 180000,
    securityDeposit: 360000,
    paymentFrequency: 'Monthly',
    dueDayOfMonth: 10,
    status: 'Active',
    notes: 'Residential tenancy',
    createdAt: '2025-01-01',
  },
];

export const demoPaymentSchedules = [
  {
    id: 'sched-101',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    periodName: 'January 2025 Rent',
    dueDate: '2025-01-05',
    expectedAmount: 250000,
    paidAmount: 250000,
    remainingAmount: 0,
    type: 'Rent',
    status: 'Paid',
    notes: 'Paid via direct bank transfer',
  },
  {
    id: 'sched-102',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    periodName: 'February 2025 Rent',
    dueDate: '2025-02-05',
    expectedAmount: 250000,
    paidAmount: 250000,
    remainingAmount: 0,
    type: 'Rent',
    status: 'Paid',
    notes: 'Paid on time',
  },
  {
    id: 'sched-103',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    periodName: 'March 2025 Rent',
    dueDate: '2025-03-05',
    expectedAmount: 250000,
    paidAmount: 150000,
    remainingAmount: 100000,
    type: 'Rent',
    status: 'Partially Paid',
    notes: 'Partial payment received on 5th March',
  },
  {
    id: 'sched-104',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    periodName: 'April 2025 Rent',
    dueDate: '2025-04-05',
    expectedAmount: 250000,
    paidAmount: 0,
    remainingAmount: 250000,
    type: 'Rent',
    status: 'Pending',
    notes: 'Upcoming due date',
  },
  {
    id: 'sched-201',
    agreementId: 'agr-2',
    customerId: 'cust-2',
    customerName: 'Danial Butt',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-103',
    unitName: 'Office 101',
    periodName: 'January 2025 Rent',
    dueDate: '2025-01-01',
    expectedAmount: 320000,
    paidAmount: 320000,
    remainingAmount: 0,
    type: 'Rent',
    status: 'Paid',
    notes: '',
  },
  {
    id: 'sched-202',
    agreementId: 'agr-2',
    customerId: 'cust-2',
    customerName: 'Danial Butt',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-103',
    unitName: 'Office 101',
    periodName: 'February 2025 Rent',
    dueDate: '2025-02-01',
    expectedAmount: 320000,
    paidAmount: 0,
    remainingAmount: 320000,
    type: 'Rent',
    status: 'Overdue',
    notes: 'Reminder sent to tenant',
  },
  {
    id: 'sched-301',
    agreementId: 'agr-3',
    customerId: 'cust-3',
    customerName: 'Baffour Duah Agyemang',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-104',
    unitName: 'Flat 201',
    periodName: 'January 2025 Rent',
    dueDate: '2025-01-10',
    expectedAmount: 180000,
    paidAmount: 180000,
    remainingAmount: 0,
    type: 'Rent',
    status: 'Paid',
    notes: '',
  },
];

export const demoRecordedPayments = [
  {
    id: 'pay-1',
    scheduleId: 'sched-101',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    amountPaid: 250000,
    paymentDate: '2025-01-04',
    paymentMethod: 'Bank Transfer',
    referenceNo: 'TXN-998811',
    notes: 'Full payment for Jan 2025',
    recordedBy: 'Manager',
    createdAt: '2025-01-04',
  },
  {
    id: 'pay-2',
    scheduleId: 'sched-102',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    amountPaid: 250000,
    paymentDate: '2025-02-05',
    paymentMethod: 'Bank Transfer',
    referenceNo: 'TXN-998844',
    notes: 'Full payment for Feb 2025',
    recordedBy: 'Manager',
    createdAt: '2025-02-05',
  },
  {
    id: 'pay-3',
    scheduleId: 'sched-103',
    agreementId: 'agr-1',
    customerId: 'cust-1',
    customerName: 'Centennial Property Ltd',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-101',
    unitName: 'Shop 01',
    amountPaid: 150000,
    paymentDate: '2025-03-05',
    paymentMethod: 'Cheque',
    referenceNo: 'CHQ-445522',
    notes: 'Partial payment',
    recordedBy: 'Manager',
    createdAt: '2025-03-05',
  },
  {
    id: 'pay-4',
    scheduleId: 'sched-201',
    agreementId: 'agr-2',
    customerId: 'cust-2',
    customerName: 'Danial Butt',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-103',
    unitName: 'Office 101',
    amountPaid: 320000,
    paymentDate: '2025-01-01',
    paymentMethod: 'Online Payment',
    referenceNo: 'ONL-776655',
    notes: '',
    recordedBy: 'Manager',
    createdAt: '2025-01-01',
  },
  {
    id: 'pay-5',
    scheduleId: 'sched-301',
    agreementId: 'agr-3',
    customerId: 'cust-3',
    customerName: 'Baffour Duah Agyemang',
    propertyId: 'prop-1',
    propertyName: 'Pixx Heights',
    unitId: 'unit-104',
    unitName: 'Flat 201',
    amountPaid: 180000,
    paymentDate: '2025-01-10',
    paymentMethod: 'Cash',
    referenceNo: 'CSH-0012',
    notes: '',
    recordedBy: 'Manager',
    createdAt: '2025-01-10',
  },
];

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
