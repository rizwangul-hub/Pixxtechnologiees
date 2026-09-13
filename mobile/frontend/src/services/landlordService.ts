import client from '../api/client';
import { LandlordBrief } from './propertyService';

export interface LandlordListResponse {
  success: boolean;
  count?: number;
  data: LandlordBrief[];
}

export const getLandlordsList = async (): Promise<LandlordBrief[]> => {
  try {
    const res = await client.get<LandlordListResponse>('/landlords', {
      params: { archived: 'false', limit: 200 },
    });
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    console.log('Error fetching landlords:', err);
    return [];
  }
};
