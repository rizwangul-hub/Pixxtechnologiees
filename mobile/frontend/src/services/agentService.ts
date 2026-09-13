import client from '../api/client';

export interface AgentItem {
  _id: string;
  fullName?: string;
  name?: string;
  agencyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived?: boolean;
}

export const getAgentsList = async (): Promise<AgentItem[]> => {
  try {
    const res = await client.get<{ success: boolean; data: AgentItem[] }>('/agents');
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data.filter((a) => !a.isArchived);
    }
    return [];
  } catch (err) {
    console.log('Error loading agents:', err);
    return [];
  }
};
