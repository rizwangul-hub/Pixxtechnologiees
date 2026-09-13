import client from '../api/client';
import { AxiosResponse } from 'axios';

export interface Expense {
  _id: string;
  propertyId: any;
  supplier?: string;
  description: string;
  category?: string;
  amount: number;
  date: string;
  dueDate?: string;
  paidAmount?: number;
  remainingAmount: number;
  status: string;
  notes?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/expenses */
export const getExpenses = async (params?: Record<string, any>) => {
  const res: AxiosResponse = await client.get('/expenses', { params });
  return res.data;
};

/** GET single expense */
export const getExpenseById = async (id: string) => {
  const res: AxiosResponse = await client.get(`/expenses/${id}`);
  return res.data;
};

/** Create expense - supports file upload under field 'attachment' */
export const createExpense = async (
  data: {
    propertyId: string;
    supplier?: string;
    description: string;
    category?: string;
    amount: number;
    date: string;
    dueDate?: string;
    paidAmount?: number;
    notes?: string;
    status?: string;
  },
  fileUri?: string,
  fileName?: string
) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v as any);
  });
  if (fileUri) {
    const cleanName = fileName || fileUri.split('/').pop() || 'receipt.jpg';
    const match = /\\.(\\w+)$/.exec(cleanName);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('attachment', { uri: fileUri, name: cleanName, type } as any);
  }
  const res: AxiosResponse = await client.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** Update expense - optional receipt */
export const updateExpense = async (
  id: string,
  data: Partial<{
    supplier: string;
    description: string;
    category: string;
    amount: number;
    date: string;
    dueDate: string;
    paidAmount: number;
    notes: string;
    status: string;
  }>,
  fileUri?: string,
  fileName?: string
) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v as any);
  });
  if (fileUri) {
    const cleanName = fileName || fileUri.split('/').pop() || 'receipt.jpg';
    const match = /\\.(\\w+)$/.exec(cleanName);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    formData.append('attachment', { uri: fileUri, name: cleanName, type } as any);
  }
  const res: AxiosResponse = await client.put(`/expenses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteExpense = async (id: string) => {
  const res: AxiosResponse = await client.delete(`/expenses/${id}`);
  return res.data;
};
