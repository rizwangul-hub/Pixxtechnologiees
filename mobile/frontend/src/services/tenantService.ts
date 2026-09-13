import client from '../api/client';

export interface TenantDocumentItem {
  _id?: string;
  name?: string;
  url: string;
  public_id?: string;
}

export interface TenantItem {
  _id: string;
  name: string;
  fullName?: string;
  type?: 'Individual' | 'Company / Business' | 'Organization' | string;
  phone?: string;
  email?: string;
  cnicOrReg?: string;
  cnicOrId?: string;
  address?: string;
  city?: string;
  emergencyContact?: string;
  profileImage?: string;
  documents?: TenantDocumentItem[];
  documentCount?: number;
  notes?: string;
  status: 'Active' | 'Inactive' | 'Archived' | string;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantListResponse {
  success: boolean;
  message?: string;
  count: number;
  data: TenantItem[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface TenantDetailResponse {
  success: boolean;
  message?: string;
  data: TenantItem;
}

export interface TenantFilterParams {
  search?: string;
  status?: string;
  archived?: boolean;
  page?: number;
  limit?: number;
}

export const getTenants = async (params: TenantFilterParams = {}): Promise<TenantListResponse> => {
  const query: any = {};
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.status && params.status !== 'All') query.status = params.status;
  if (params.archived) query.archived = 'true';
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const res = await client.get<TenantListResponse>('/customers', { params: query });
  return res.data;
};

export const getTenantById = async (id: string): Promise<TenantDetailResponse> => {
  const res = await client.get<TenantDetailResponse>(`/customers/${id}`);
  return res.data;
};

export const createTenant = async (data: Partial<TenantItem>): Promise<TenantDetailResponse> => {
  const res = await client.post<TenantDetailResponse>('/customers', data);
  return res.data;
};

export const updateTenant = async (id: string, data: Partial<TenantItem>): Promise<TenantDetailResponse> => {
  const res = await client.put<TenantDetailResponse>(`/customers/${id}`, data);
  return res.data;
};

export const archiveTenant = async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const res = await client.put(`/customers/${id}/archive`, { reason: reason || 'Archived from mobile app' });
  return res.data;
};

export const restoreTenant = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await client.put(`/customers/${id}/restore`);
  return res.data;
};

export const getTenantPayments = async (customerId: string): Promise<{ success: boolean; count: number; data: any[] }> => {
  try {
    const res = await client.get('/payments', { params: { customer: customerId } });
    return res.data;
  } catch (err) {
    return { success: false, count: 0, data: [] };
  }
};
