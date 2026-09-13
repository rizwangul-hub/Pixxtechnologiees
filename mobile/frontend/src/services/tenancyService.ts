import client from '../api/client';
import { TenantItem } from './tenantService';
import { PropertyItem } from './propertyService';

export interface TenancyItem {
  _id: string;
  customerId: TenantItem;
  propertyId: PropertyItem;
  landlordId?: {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
  } | null;
  agentId?: {
    _id: string;
    fullName?: string;
    name?: string;
    agencyName?: string;
    phone?: string;
    email?: string;
  } | null;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  paymentDueDay?: number;
  securityDeposit?: number;
  companyMonthlyAmount?: number;
  agentPaymentDueDay?: number;
  status: 'Active' | 'Ended' | 'Cancelled' | 'Archived' | string;
  isArchived?: boolean;
  openingBalance?: number;
  billingStartDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenancyListResponse {
  success: boolean;
  count: number;
  data: TenancyItem[];
}

export interface TenancyDetailResponse {
  success: boolean;
  message?: string;
  data: TenancyItem;
}

export interface CreateTenancyPayload {
  customerId: string;
  propertyId: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  paymentDueDay?: number;
  securityDeposit?: number;
  openingBalance?: number;
  billingStartDate?: string;
  agentId?: string | null;
  companyMonthlyAmount?: number;
  agentPaymentDueDay?: number;
  notes?: string;
}

export const getTenancies = async (params: { customerId?: string; propertyId?: string; status?: string } = {}): Promise<TenancyListResponse> => {
  const query: any = {};
  if (params.customerId && params.customerId !== 'All') query.customerId = params.customerId;
  if (params.propertyId && params.propertyId !== 'All') query.propertyId = params.propertyId;
  if (params.status && params.status !== 'All') query.status = params.status;

  const res = await client.get<TenancyListResponse>('/tenancies', { params: query });
  return res.data;
};

export const createTenancy = async (payload: CreateTenancyPayload): Promise<TenancyDetailResponse> => {
  const res = await client.post<TenancyDetailResponse>('/tenancies', payload);
  return res.data;
};

export const endTenancy = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await client.post(`/tenancies/${id}/end`);
  return res.data;
};
