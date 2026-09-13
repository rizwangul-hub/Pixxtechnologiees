import client from '../api/client';
import { AxiosResponse } from 'axios';

export interface MortgagePropertyAllocation {
  propertyId: string;
  allocatedAmount?: number;
  notes?: string;
  securedAt?: string;
  releasedAt?: string;
  status?: 'Active' | 'Released' | 'Historical';
}

export interface Mortgage {
  _id: string;
  propertyId?: string | null;
  landlordId: string;
  mortgageType: 'Individual Property' | 'Collective / Group';
  mortgageReference?: string;
  lenderName: string;
  mortgageAccountNumber?: string;
  properties: MortgagePropertyAllocation[];
  originalLoanAmount: number;
  currentOutstandingBalance: number;
  interestRate?: number;
  monthlyPayment: number;
  paymentFrequency?: string;
  startDate: string;
  termMonths?: number;
  maturityDate?: string | null;
  nextPaymentDate: string;
  status: string;
  notes?: string;
  documents?: { url: string; publicId?: string; originalFileName?: string; fileType?: string; uploadedAt?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MortgageSummary {
  totalMortgages: number;
  activeMortgagesCount: number;
  individualCount: number;
  collectiveCount: number;
  totalOriginalLoans: number;
  totalOutstanding: number;
  monthlyPaymentsTotal: number;
  upcomingPaymentsCount: number;
}

export interface MortgagePayment {
  _id: string;
  mortgageId: string;
  propertyId?: string;
  landlordId: string;
  paymentDate: string;
  totalPayment: number;
  principalAmount?: number;
  interestAmount?: number;
  remainingBalance?: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/mortgages */
export const getMortgages = async (params?: Record<string, any>) => {
  const res: AxiosResponse = await client.get('/mortgages', { params });
  return res.data;
};

/** GET /api/mortgages/summary */
export const getMortgageSummary = async (params?: Record<string, any>) => {
  const res: AxiosResponse = await client.get('/mortgages/summary', { params });
  return res.data;
};

/** GET /api/mortgages/upcoming */
export const getUpcomingMortgagePayments = async (params?: Record<string, any>) => {
  const res: AxiosResponse = await client.get('/mortgages/upcoming', { params });
  return res.data;
};

/** GET /api/mortgages/:id */
export const getMortgageById = async (id: string) => {
  const res: AxiosResponse = await client.get(`/mortgages/${id}`);
  return res.data;
};

/** POST /api/mortgages */
export const createMortgage = async (data: Record<string, any>) => {
  const res: AxiosResponse = await client.post('/mortgages', data);
  return res.data;
};

/** PUT /api/mortgages/:id */
export const updateMortgage = async (id: string, data: Record<string, any>) => {
  const res: AxiosResponse = await client.put(`/mortgages/${id}`, data);
  return res.data;
};

/** DELETE /api/mortgages/:id */
export const deleteMortgage = async (id: string) => {
  const res: AxiosResponse = await client.delete(`/mortgages/${id}`);
  return res.data;
};

/** GET /api/mortgages/:id/payments */
export const getMortgagePayments = async (mortgageId: string) => {
  const res: AxiosResponse = await client.get(`/mortgages/${mortgageId}/payments`);
  return res.data;
};

/** POST /api/mortgages/:id/payments */
export const recordMortgagePayment = async (mortgageId: string, data: Record<string, any>) => {
  const res: AxiosResponse = await client.post(`/mortgages/${mortgageId}/payments`, data);
  return res.data;
};

/** POST /api/mortgages/:id/properties */
export const addPropertyToMortgage = async (mortgageId: string, data: Record<string, any>) => {
  const res: AxiosResponse = await client.post(`/mortgages/${mortgageId}/properties`, data);
  return res.data;
};

/** DELETE /api/mortgages/:id/properties/:propertyId */
export const removePropertyFromMortgage = async (mortgageId: string, propertyId: string) => {
  const res: AxiosResponse = await client.delete(`/mortgages/${mortgageId}/properties/${propertyId}`);
  return res.data;
};

/** GET /api/mortgages/property/:propertyId */
export const getPropertyMortgages = async (propertyId: string) => {
  const res: AxiosResponse = await client.get(`/mortgages/property/${propertyId}`);
  return res.data;
};
