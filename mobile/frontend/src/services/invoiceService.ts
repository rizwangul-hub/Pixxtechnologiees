import client from '@/src/api/client';

export interface Invoice {
  _id: string;
  customerId: string;
  propertyId: string;
  tenancyId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  invoiceDate: string;
  dueDate: string;
  status: string;
  reference?: string;
  notes?: string;
  // populated references
  customer?: any;
  property?: any;
  tenancy?: any;
  pdfUrl?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  count: number;
  data: Invoice[];
}

export interface InvoiceDetailResponse {
  success: boolean;
  data: Invoice;
}

/** Get list of invoices (optional filters) */
export const getInvoices = async (params: Record<string, any> = {}): Promise<InvoiceListResponse> => {
  const res = await client.get<InvoiceListResponse>('/invoices', { params });
  return res.data;
};

/** Get a single invoice by id */
export const getInvoiceById = async (id: string): Promise<InvoiceDetailResponse> => {
  const res = await client.get<InvoiceDetailResponse>(`/invoices/${id}`);
  return res.data;
};
