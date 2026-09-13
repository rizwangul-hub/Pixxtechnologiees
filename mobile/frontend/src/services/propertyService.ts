import client from '../api/client';

export interface PropertyImage {
  url: string;
  public_id?: string;
}

export interface LandlordBrief {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  region?: string;
  logo?: {
    url?: string;
  };
}

export interface AgentBrief {
  _id: string;
  fullName?: string;
  name?: string;
  agencyName?: string;
  email?: string;
  phone?: string;
}

export interface TenantBrief {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ActiveTenancy {
  _id: string;
  status: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  paymentDueDay?: number;
  customerId?: TenantBrief;
  agentId?: AgentBrief;
}

export interface PropertyItem {
  _id: string;
  name: string;
  type: string;
  assetType?: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance' | 'Archived' | string;
  assetStatus?: string;
  monthlyRent: number;
  price?: number;
  salePrice?: number;
  floor?: string;
  size?: string;
  sizeUnit?: string;
  address?: string;
  city?: string;
  area?: string;
  county?: string;
  postcode?: string;
  country?: string;
  description?: string;
  notes?: string;
  images?: PropertyImage[];
  landlordId?: LandlordBrief;
  agentId?: string | AgentBrief;
  agent?: AgentBrief | null;
  agentName?: string | null;
  agentFee?: number;
  tenant?: TenantBrief | null;
  tenantName?: string | null;
  activeTenancy?: ActiveTenancy | null;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyListResponse {
  success: boolean;
  message?: string;
  count: number;
  data: PropertyItem[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface PropertyDetailResponse {
  success: boolean;
  message?: string;
  data: PropertyItem;
}

export interface PropertyFilterParams {
  search?: string;
  type?: string;
  status?: string;
  landlordId?: string;
  archived?: boolean;
  page?: number;
  limit?: number;
}

export const getProperties = async (params: PropertyFilterParams = {}): Promise<PropertyListResponse> => {
  const query: any = {};
  if (params.search && params.search.trim()) query.search = params.search.trim();
  if (params.type && params.type !== 'All') query.type = params.type;
  if (params.status && params.status !== 'All') query.status = params.status;
  if (params.landlordId && params.landlordId !== 'All') query.landlordId = params.landlordId;
  if (params.archived) query.archived = 'true';
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const res = await client.get<PropertyListResponse>('/properties', { params: query });
  return res.data;
};

export const getPropertyById = async (id: string): Promise<PropertyDetailResponse> => {
  const res = await client.get<PropertyDetailResponse>(`/properties/${id}`);
  return res.data;
};

export const createProperty = async (data: Partial<PropertyItem>): Promise<PropertyDetailResponse> => {
  const res = await client.post<PropertyDetailResponse>('/properties', data);
  return res.data;
};

export const updateProperty = async (id: string, data: Partial<PropertyItem>): Promise<PropertyDetailResponse> => {
  const res = await client.put<PropertyDetailResponse>(`/properties/${id}`, data);
  return res.data;
};

export const archiveProperty = async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const res = await client.put(`/properties/${id}/archive`, { reason: reason || 'Archived from mobile app' });
  return res.data;
};

export const restoreProperty = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await client.put(`/properties/${id}/restore`);
  return res.data;
};

export const getPropertyMortgages = async (propertyId: string): Promise<{ success: boolean; data: any[] }> => {
  try {
    const res = await client.get(`/mortgages/property/${propertyId}`);
    return res.data;
  } catch (err) {
    return { success: false, data: [] };
  }
};
