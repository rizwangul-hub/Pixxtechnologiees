import client from '../api/client';

export interface UploadResponse {
  success: boolean;
  message?: string;
  url: string;
  public_id?: string;
}

export const uploadImageToBackend = async (uri: string, filename?: string): Promise<UploadResponse> => {
  const formData = new FormData();

  const cleanName = filename || uri.split('/').pop() || 'property_photo.jpg';
  const match = /\.(\w+)$/.exec(cleanName);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

  formData.append('file', {
    uri,
    name: cleanName,
    type,
  } as any);

  formData.append('folder', 'pixx_technologies/properties');

  const res = await client.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};
