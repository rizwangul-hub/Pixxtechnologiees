// src/services/documentService.ts
import client from '../api/client';

export interface TenantDocument {
  _id: string;
  tenantId: string;
  documentName: string;
  documentType: 'standard' | 'custom';
  fileUrl: string;
  publicId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  expiryDate?: string | null;
  uploadedAt: string;
  status?: 'No Expiry Date' | 'Valid' | 'Expiring Soon' | 'Expired';
  daysRemaining?: number | null;
  // enriched fields from controller attachTenancyDetails
  tenantName?: string;
  tenantEmail?: string;
  propertyName?: string;
  agentName?: string;
  expiryReminder30Status?: string;
  recipientEmail?: string;
}

export interface StandardDocumentType {
  id: string;
  name: string;
  hasExpiryDate: boolean;
}

/** List all documents for a specific tenant. */
export const listTenantDocuments = async (tenantId: string) => {
  const res = await client.get<{ success: boolean; count: number; standardList: StandardDocumentType[]; data: TenantDocument[] }>(
    `/tenants/${tenantId}/documents`
  );
  return res.data;
};

/** Upload (create) a new tenant document. */
export const uploadTenantDocument = async (
  tenantId: string,
  fileUri: string,
  documentName: string,
  documentType: 'standard' | 'custom' = 'standard',
  expiryDate?: string | null
) => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'document';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `application/${match[1].toLowerCase()}` : 'application/octet-stream';
  // @ts-ignore – React Native FormData expects this shape
  formData.append('file', { uri: fileUri, name: filename, type: mimeType } as any);
  formData.append('documentName', documentName);
  formData.append('documentType', documentType);
  if (expiryDate !== undefined && expiryDate !== null) formData.append('expiryDate', expiryDate);
  const res = await client.post<{ success: boolean; message: string; data: TenantDocument }>(
    `/tenants/${tenantId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

/** Update metadata (expiry date, custom name) of a document. */
export const updateTenantDocument = async (
  documentId: string,
  updates: { expiryDate?: string | null; documentName?: string }
) => {
  const res = await client.put<{ success: boolean; message: string; data: TenantDocument }>(
    `/tenant-documents/${documentId}`,
    updates,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

/** Delete a tenant document (hard‑delete + Cloudinary cleanup). */
export const deleteTenantDocument = async (documentId: string) => {
  const res = await client.delete<{ success: boolean; message: string }>(`/tenant-documents/${documentId}`);
  return res.data;
};

/** Get documents expiring within next 30 days. */
export const getExpiringSoonDocuments = async () => {
  const res = await client.get<{ success: boolean; count: number; data: TenantDocument[] }>(
    '/tenant-documents/expiring-soon'
  );
  return res.data;
};

/** Get already expired documents. */
export const getExpiredDocuments = async () => {
  const res = await client.get<{ success: boolean; count: number; data: TenantDocument[] }>(
    '/tenant-documents/expired'
  );
  return res.data;
};

/** Fetch notification history for a document. */
export const getDocumentNotificationHistory = async (documentId: string) => {
  const res = await client.get<{ success: boolean; data: any }>(
    `/tenant-documents/${documentId}/notification-history`
  );
  return res.data;
};
