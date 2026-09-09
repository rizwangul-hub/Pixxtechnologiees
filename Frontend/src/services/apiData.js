import fetchAPI, { API_BASE_URL } from './api';

/**
 * Backend Data Persistence & Export Service for PixxTechnologies
 */

// --- UNIFIED DASHBOARD API ---

export async function fetchUnifiedDashboardAPI(propertyId = '') {
  try {
    const endpoint = propertyId ? `/dashboard?propertyId=${propertyId}` : '/dashboard';
    const res = await fetchAPI(endpoint);
    if (res.success && res.data) {
      if (!propertyId) {
        localStorage.setItem('pixx_dashboard_cache', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Unified dashboard fallback:', e.message);
  }
  return null;
}

export async function fetchPropertyDashboardAPI() {
  try {
    const res = await fetchAPI('/dashboard/properties');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Property dashboard fallback:', e.message);
  }
  return [];
}

// --- PROPERTIES API ---

export async function fetchPropertiesFromAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/properties${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      if (!query) {
        localStorage.setItem('pixx_properties_list', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Falling back to local properties:', e.message);
  }
  return null;
}

// --- LANDLORDS API ---

export async function fetchLandlordsFromAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/landlords${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      if (!query) {
        localStorage.setItem('pixx_landlords_data', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Falling back to local landlords:', e.message);
  }
  return null;
}

export async function fetchLandlordByIdAPI(id) {
  try {
    const res = await fetchAPI(`/landlords/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch landlord by ID error:', e.message);
  }
  return null;
}

export async function createLandlordAPI(landlordData) {
  try {
    const res = await fetchAPI('/landlords', {
      method: 'POST',
      body: JSON.stringify(landlordData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Save landlord error:', e.message);
    throw e;
  }
}

export async function updateLandlordAPI(id, landlordData) {
  try {
    const res = await fetchAPI(`/landlords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(landlordData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Update landlord error:', e.message);
    throw e;
  }
}

export async function deleteLandlordAPI(id) {
  try {
    const res = await fetchAPI(`/landlords/${id}`, {
      method: 'DELETE',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete landlord error:', e.message);
    throw e;
  }
}

export async function fetchLandlordPropertiesAPI(landlordId) {
  try {
    const res = await fetchAPI(`/landlords/${landlordId}/properties`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch landlord properties error:', e.message);
  }
  return [];
}

export async function createPropertyAPI(propertyData) {
  try {
    const res = await fetchAPI('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Save property error:', e.message);
    throw e;
  }
}

// --- UNITS API ---

export async function fetchUnitsFromAPI(propertyId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = propertyId
      ? `/properties/${propertyId}/units${query ? `?${query}` : ''}`
      : `/units${query ? `?${query}` : ''}`;
    const res = await fetchAPI(endpoint);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Falling back to local units:', e.message);
  }
  return null;
}

export async function createUnitAPI(unitData) {
  try {
    const endpoint = unitData.propertyId ? `/properties/${unitData.propertyId}/units` : '/units';
    const res = await fetchAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Save unit error:', e.message);
    throw e;
  }
}

// --- CUSTOMERS API ---

export async function fetchCustomersFromAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/customers${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      if (!query) {
        localStorage.setItem('pixx_customers_list', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Falling back to local customers:', e.message);
  }
  return null;
}

export async function createCustomerAPI(customerData) {
  try {
    const res = await fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Save customer error:', e.message);
    throw e;
  }
}

export async function fetchCustomerByIdAPI(id) {
  try {
    const res = await fetchAPI(`/customers/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch customer by ID error:', e.message);
  }
  return null;
}

// --- TENANCY ASSIGNMENT API ---

export async function assignTenancyAPI(tenancyData) {
  try {
    const res = await fetchAPI('/tenancies', {
      method: 'POST',
      body: JSON.stringify(tenancyData),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Tenancy API error:', e.message);
    throw e;
  }
}

export async function endTenancyAPI(tenancyId) {
  try {
    const res = await fetchAPI(`/tenancies/${tenancyId}/end`, {
      method: 'POST',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] End tenancy error:', e.message);
    throw e;
  }
}

// --- DASHBOARD SUMMARY APIs (LEGACY SUPPORT) ---

export async function fetchDashboardSummaryAPI() {
  try {
    const res = await fetchAPI('/dashboard/summary');
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Falling back to calculated summary:', e.message);
  }
  return null;
}

export async function fetchFinancialSummaryAPI() {
  try {
    const res = await fetchAPI('/dashboard/financial-summary');
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Financial summary error:', e.message);
  }
  return null;
}

// --- PAYMENTS APIs ---

export async function fetchPaymentsAPI(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const res = await fetchAPI(`/payments${params ? `?${params}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      if (!params) {
        localStorage.setItem('pixx_payment_schedules_list', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch payments error:', e.message);
  }
  return [];
}

export async function fetchOverduePaymentsAPI() {
  try {
    const res = await fetchAPI('/payments/overdue');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch overdue payments error:', e.message);
  }
  return [];
}

export async function fetchUpcomingPaymentsAPI() {
  try {
    const res = await fetchAPI('/payments/upcoming');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch upcoming payments error:', e.message);
  }
  return [];
}

export async function recordPaymentAPI(paymentId, paymentData) {
  try {
    const res = await fetchAPI(`/payments/${paymentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Record payment error:', e.message);
    throw e;
  }
}

// --- EXPENSES APIs ---

export async function fetchExpensesAPI(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const res = await fetchAPI(`/expenses${params ? `?${params}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      if (!params) {
        localStorage.setItem('pixx_expenses_list', JSON.stringify(res.data));
      }
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch expenses error:', e.message);
  }
  return [];
}

export async function createExpenseAPI(expenseData) {
  try {
    const res = await fetchAPI('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Create expense error:', e.message);
    throw e;
  }
}

// --- CLOUDINARY FILE UPLOAD API ---

export async function uploadFileToCloudinaryAPI(file, folder = 'pixxtechnologies/documents') {
  const token = localStorage.getItem('pixx_auth_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cloudinary upload failed');
  }

  return data;
}

// --- EXPORT DOWNLOAD HELPER ---

export function getExportDownloadURL(resource, format = 'csv', filters = {}) {
  const query = new URLSearchParams({ ...filters, format }).toString();
  return `${API_BASE_URL}/export/${resource}${format === 'excel' ? '/excel' : ''}?${query}`;
}

// --- TENANT DOCUMENT APIs ---

export async function fetchTenantDocumentsAPI(tenantId) {
  try {
    const res = await fetchAPI(`/tenants/${tenantId}/documents`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch tenant documents error:', e.message);
  }
  return [];
}

export async function uploadTenantDocumentAPI(tenantId, file, documentName, documentType = 'standard', expiryDate = '') {
  const token = localStorage.getItem('pixx_auth_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentName', documentName);
  formData.append('documentType', documentType);
  if (expiryDate) {
    formData.append('expiryDate', expiryDate);
  }

  const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/documents`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Tenant document upload failed');
  }

  return data.data;
}

export async function updateTenantDocumentAPI(documentId, updateData) {
  try {
    const res = await fetchAPI(`/tenant-documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Update document error:', e.message);
    throw e;
  }
}

export async function deleteTenantDocumentAPI(documentId) {
  try {
    const res = await fetchAPI(`/tenant-documents/${documentId}`, {
      method: 'DELETE',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete document error:', e.message);
    throw e;
  }
}

export async function fetchExpiringDocumentsAPI() {
  try {
    const res = await fetchAPI('/tenant-documents/expiring-soon');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch expiring documents error:', e.message);
  }
  return [];
}

export async function fetchExpiredDocumentsAPI() {
  try {
    const res = await fetchAPI('/tenant-documents/expired');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch expired documents error:', e.message);
  }
  return [];
}

// --- AGENT MANAGEMENT APIS ---

export async function fetchAgentsAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/agents${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agents error:', e.message);
  }
  return [];
}

export async function fetchAgentByIdAPI(id) {
  try {
    const res = await fetchAPI(`/agents/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agent details error:', e.message);
  }
  return null;
}

export async function createAgentAPI(formData) {
  try {
    const res = await fetchAPI('/agents', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Create agent error:', e.message);
    throw e;
  }
}

export async function updateAgentAPI(id, formData) {
  try {
    const res = await fetchAPI(`/agents/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Update agent error:', e.message);
    throw e;
  }
}

export async function deleteAgentAPI(id) {
  try {
    const res = await fetchAPI(`/agents/${id}`, {
      method: 'DELETE',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete agent error:', e.message);
    throw e;
  }
}

// --- AGENT PAYMENTS APIS ---

export async function fetchAgentPaymentsAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/agent-payments${query ? `?${query}` : ''}`);
    if (res.success) {
      return res;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agent payments error:', e.message);
  }
  return { data: [], summary: {} };
}

export async function recordAgentPaymentAPI(paymentId, paymentData) {
  try {
    const res = await fetchAPI(`/agent-payments/${paymentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Record agent payment error:', e.message);
    throw e;
  }
}

// --- AGENT EXPENSES APIS ---

export async function fetchAgentExpensesAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/agent-expenses${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agent expenses error:', e.message);
  }
  return [];
}

export async function createAgentExpenseAPI(formData) {
  try {
    const res = await fetchAPI('/agent-expenses', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Create agent expense error:', e.message);
    throw e;
  }
}

export async function updateAgentExpenseAPI(id, formData) {
  try {
    const res = await fetchAPI(`/agent-expenses/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Update agent expense error:', e.message);
    throw e;
  }
}

export async function deleteAgentExpenseAPI(id) {
  try {
    const res = await fetchAPI(`/agent-expenses/${id}`, {
      method: 'DELETE',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete agent expense error:', e.message);
    throw e;
  }
}

// --- AGENT DASHBOARD SUMMARY API ---

export async function fetchAgentDashboardSummaryAPI() {
  try {
    const res = await fetchAPI('/dashboard/agent-summary');
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agent dashboard summary error:', e.message);
  }
  return null;
}

// --- REPORT CENTER APIS ---

export async function fetchTenantStatementAPI(tenantId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/tenant-statement/${tenantId}${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch tenant statement error:', e.message);
  }
  return null;
}

export async function fetchLandlordReportAPI(landlordId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/landlord/${landlordId}${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch landlord report error:', e.message);
  }
  return null;
}

export async function fetchAgentReportAPI(agentId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/agent/${agentId}${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch agent report error:', e.message);
  }
  return null;
}

export async function fetchPropertyReportAPI(propertyId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/property/${propertyId}${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch property report error:', e.message);
  }
  return null;
}

export async function fetchUnitReportAPI(unitId, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/unit/${unitId}${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch unit report error:', e.message);
  }
  return null;
}

export async function fetchPaymentReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/payments${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch payment report error:', e.message);
  }
  return null;
}

export async function fetchExpenseReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/expenses${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch expense report error:', e.message);
  }
  return null;
}

export async function fetchFinancialSummaryReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/financial-summary${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch financial summary error:', e.message);
  }
  return null;
}

export async function fetchIncomeReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/income${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch income report error:', e.message);
  }
  return null;
}

export async function fetchInvoiceReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/invoices${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch invoice report error:', e.message);
  }
  return null;
}



// --- NOTIFICATIONS & DOCUMENT EXPIRY APIS ---

export async function fetchNotificationsAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/notifications${query ? `?${query}` : ''}`);
    if (res.success) {
      return res;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch notifications error:', e.message);
  }
  return { data: [], unreadCount: 0 };
}

export async function markNotificationReadAPI(id) {
  try {
    const res = await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
    return res;
  } catch (e) {
    console.warn('[API Warning] Mark notification read error:', e.message);
    throw e;
  }
}

export async function markAllNotificationsReadAPI() {
  try {
    const res = await fetchAPI('/notifications/read-all', { method: 'PUT' });
    return res;
  } catch (e) {
    console.warn('[API Warning] Mark all notifications read error:', e.message);
    throw e;
  }
}

export async function deleteNotificationAPI(id) {
  try {
    const res = await fetchAPI(`/notifications/${id}`, { method: 'DELETE' });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete notification error:', e.message);
    throw e;
  }
}

export async function fetchDocumentNotificationHistoryAPI(documentId) {
  try {
    const res = await fetchAPI(`/tenant-documents/${documentId}/notification-history`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch document notification history error:', e.message);
  }
  return null;
}

export async function triggerTestDocumentExpiryEmailAPI(recipientEmail, sendNow = true) {
  try {
    const res = await fetchAPI('/tenant-documents/test-email', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail, sendNow }),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Trigger test email error:', e.message);
    throw e;
  }
}

// --- MORTGAGE MANAGEMENT APIS ---

export async function fetchMortgagesAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/mortgages${query ? `?${query}` : ''}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch mortgages error:', e.message);
  }
  return [];
}

export async function fetchMortgageSummaryAPI() {
  try {
    const res = await fetchAPI('/mortgages/summary');
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch mortgage summary error:', e.message);
  }
  return null;
}

export async function fetchUpcomingMortgagesAPI() {
  try {
    const res = await fetchAPI('/mortgages/upcoming');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch upcoming mortgages error:', e.message);
  }
  return [];
}

export async function fetchMortgageByIdAPI(id) {
  try {
    const res = await fetchAPI(`/mortgages/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch mortgage details error:', e.message);
  }
  return null;
}

export async function createMortgageAPI(mortgageData) {
  try {
    const res = await fetchAPI('/mortgages', {
      method: 'POST',
      body: JSON.stringify(mortgageData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Create mortgage error:', e.message);
    throw e;
  }
}

export async function updateMortgageAPI(id, mortgageData) {
  try {
    const res = await fetchAPI(`/mortgages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mortgageData),
    });
    return res.data;
  } catch (e) {
    console.warn('[API Warning] Update mortgage error:', e.message);
    throw e;
  }
}

export async function deleteMortgageAPI(id) {
  try {
    const res = await fetchAPI(`/mortgages/${id}`, {
      method: 'DELETE',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Delete mortgage error:', e.message);
    throw e;
  }
}

export async function fetchMortgagePaymentsAPI(mortgageId) {
  try {
    const res = await fetchAPI(`/mortgages/${mortgageId}/payments`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch mortgage payments error:', e.message);
  }
  return [];
}

export async function recordMortgagePaymentAPI(mortgageId, paymentData) {
  try {
    const res = await fetchAPI(`/mortgages/${mortgageId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Record mortgage payment error:', e.message);
    throw e;
  }
}

export async function fetchMortgageReportAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetchAPI(`/reports/mortgages${query ? `?${query}` : ''}`);
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn('[API Warning] Fetch mortgage report error:', e.message);
  }
  return null;
}

// --- ARCHIVE & RESTORE APIS ---

export async function archiveCustomerAPI(id, reason = '') {
  try {
    const res = await fetchAPI(`/customers/${id}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Archive customer error:', e.message);
    throw e;
  }
}

export async function restoreCustomerAPI(id) {
  try {
    const res = await fetchAPI(`/customers/${id}/restore`, {
      method: 'PUT',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Restore customer error:', e.message);
    throw e;
  }
}

export async function archiveAgentAPI(id, reason = '') {
  try {
    const res = await fetchAPI(`/agents/${id}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Archive agent error:', e.message);
    throw e;
  }
}

export async function restoreAgentAPI(id) {
  try {
    const res = await fetchAPI(`/agents/${id}/restore`, {
      method: 'PUT',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Restore agent error:', e.message);
    throw e;
  }
}

export async function archiveLandlordAPI(id, reason = '') {
  try {
    const res = await fetchAPI(`/landlords/${id}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Archive landlord error:', e.message);
    throw e;
  }
}

export async function restoreLandlordAPI(id) {
  try {
    const res = await fetchAPI(`/landlords/${id}/restore`, {
      method: 'PUT',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Restore landlord error:', e.message);
    throw e;
  }
}

export async function archivePropertyAPI(id, reason = '') {
  try {
    const res = await fetchAPI(`/properties/${id}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Archive property error:', e.message);
    throw e;
  }
}

export async function restorePropertyAPI(id) {
  try {
    const res = await fetchAPI(`/properties/${id}/restore`, {
      method: 'PUT',
    });
    return res;
  } catch (e) {
    console.warn('[API Warning] Restore property error:', e.message);
    throw e;
  }
}

