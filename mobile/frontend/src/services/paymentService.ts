import client from '../api/client';

/**
 * Types matching the backend Payment model.
 */
export interface Payment {
  _id: string;
  customerId: string; // tenant id
  propertyId: string;
  tenancyId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string; // ISO date string
  paidDate?: string;
  billingMonth: number;
  billingYear: number;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Received' | 'Partially Received' | 'Overdue';
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Online' | 'Other';
  reference?: string;
  notes?: string;
  paymentType?: string;
  // populated references
  customer?: any;
  property?: any;
  tenancy?: any;
}

export interface PaymentListResponse {
  success: boolean;
  count: number;
  data: Payment[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface PaymentDetailResponse {
  success: boolean;
  data: Payment;
  message?: string;
}

/** Get list of payments with optional filters */
export const getPayments = async (params: Record<string, any> = {}): Promise<PaymentListResponse> => {
  const res = await client.get<PaymentListResponse>('/payments', { params });
  return res.data;
};

/** Get a single payment by id */
export const getPaymentById = async (id: string): Promise<PaymentDetailResponse> => {
  const res = await client.get<PaymentDetailResponse>(`/payments/${id}`);
  return res.data;
};

/** Record a payment against a payment record */
export const recordPayment = async (
  paymentId: string,
  payload: { amountPaid: number; paymentMethod?: string; reference?: string; notes?: string }
): Promise<PaymentDetailResponse> => {
  const res = await client.post<PaymentDetailResponse>(`/payments/${paymentId}/pay`, payload);
  return res.data;
};

/** Get overdue payments */
export const getOverduePayments = async (): Promise<PaymentListResponse> => {
  const res = await client.get<PaymentListResponse>('/payments/overdue');
  return res.data;
};

/** Get upcoming payments */
export const getUpcomingPayments = async (): Promise<PaymentListResponse> => {
  const res = await client.get<PaymentListResponse>('/payments/upcoming');
  return res.data;
};

/** Get payment summary */
export const getPaymentSummary = async (): Promise<any> => {
  const res = await client.get<any>('/payments/summary');
  return res.data;
};
