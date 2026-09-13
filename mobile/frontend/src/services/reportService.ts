// src/services/reportService.ts
import client from '../api/client';

// ---------- Types ----------
export interface ReportFilterParams {
  fromDate?: string; // ISO string
  toDate?: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  agentId?: string;
  paymentStatus?: string;
  expenseCategory?: string;
  mortgageId?: string;
  page?: number;
  limit?: number;
}

// Generic list response used by many report endpoints
export interface ReportListResponse<T> {
  success: boolean;
  data: T[];
  total?: number; // optional total count for pagination
  page?: number;
  limit?: number;
}

// Specific data shapes – these mirror backend DTOs (no any)
export interface TenantStatementData {
  tenant?: { name?: string; fullName?: string; _id?: string };
  statements?: any[]; // keep as any because internal structure varies; UI will map needed fields
}

export interface PropertyReportData {
  property?: {
    _id: string;
    name: string;
    type: string;
    address: string;
    postcode: string;
    landlord?: { name: string };
    monthlyRent?: number;
    status?: string;
    currentTenant?: { name: string };
  };
  // additional aggregated fields can be added as needed
}

export interface PaymentReportData {
  tenantName: string;
  propertyName: string;
  billingMonth: string; // YYYY-MM
  dueDate: string; // ISO
  amount: number;
  paidAmount: number;
  remaining: number;
  status: string;
  paymentMethod?: string;
  paidDate?: string;
}

export interface ExpenseReportData {
  date: string; // ISO
  propertyName: string;
  category: string;
  description?: string;
  amount: number;
  status?: string;
  receiptUrl?: string;
}

export interface MortgageReportData {
  facilityId: string;
  type: string;
  lender: string;
  originalAmount: number;
  outstandingAmount: number;
  interestRate?: number;
  startDate?: string;
  endDate?: string;
  paymentAmount?: number;
  paymentFrequency?: string;
  securedProperties: string[];
}

// ---------- Service Functions ----------
// Tenant Statement
export const getTenantStatement = (tenantId: string = 'all', params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: TenantStatementData }>(`/reports/tenant-statement/${tenantId || 'all'}`, { params });

export const downloadTenantStatement = (tenantId: string = 'all', format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/tenant-statement/${tenantId || 'all'}/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Landlord Report
export const getLandlordReport = (landlordId: string = 'all', params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: any }>(`/reports/landlord/${landlordId || 'all'}`, { params });

export const downloadLandlordReport = (landlordId: string = 'all', format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/landlord/${landlordId || 'all'}/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Agent Report
export const getAgentReport = (agentId: string = 'all', params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: any }>(`/reports/agent/${agentId || 'all'}`, { params });

export const downloadAgentReport = (agentId: string = 'all', format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/agent/${agentId || 'all'}/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Property Report
export const getPropertyReport = (propertyId: string = 'all', params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: PropertyReportData }>(`/reports/property/${propertyId || 'all'}`, { params });

export const downloadPropertyReport = (propertyId: string = 'all', format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/property/${propertyId || 'all'}/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Payment Report (list)
export const getPaymentReport = (params: ReportFilterParams = {}) =>
  client.get<ReportListResponse<PaymentReportData>>('/reports/payments', { params });

export const downloadPaymentReport = (format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/payments/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Expense Report (list)
export const getExpenseReport = (params: ReportFilterParams = {}) =>
  client.get<ReportListResponse<ExpenseReportData>>('/reports/expenses', { params });

export const downloadExpenseReport = (format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/expenses/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Mortgage Report (list)
export const getMortgageReport = (params: ReportFilterParams = {}) =>
  client.get<ReportListResponse<MortgageReportData>>('/reports/mortgages', { params });

export const downloadMortgageReport = (format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/reports/mortgages/${format}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// Compliance – reuse existing document service for expiring/expired
export const getExpiringSoonDocuments = (params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: any[] }>(`/tenant-documents/expiring-soon`, { params });

export const getExpiredDocuments = (params: ReportFilterParams = {}) =>
  client.get<{ success: boolean; data: any[] }>(`/tenant-documents/expired`, { params });

export const downloadComplianceReport = (format: 'pdf' | 'word' | 'excel', params: ReportFilterParams = {}) =>
  client.get<ArrayBuffer>(`/export/customers/${format === 'excel' ? 'excel' : ''}`, { params, responseType: 'arraybuffer' }).then(res => res.data);

// ---------- Export ----------
export default {
  getTenantStatement,
  downloadTenantStatement,
  getLandlordReport,
  downloadLandlordReport,
  getAgentReport,
  downloadAgentReport,
  getPropertyReport,
  downloadPropertyReport,
  getPaymentReport,
  downloadPaymentReport,
  getExpenseReport,
  downloadExpenseReport,
  getMortgageReport,
  downloadMortgageReport,
  getExpiringSoonDocuments,
  getExpiredDocuments,
  downloadComplianceReport,
};
