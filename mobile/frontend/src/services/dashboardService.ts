import client from '../api/client';

export interface DashboardResponse {
  success: boolean;
  message?: string;
  data: {
    propertyInfo: {
      totalLandlords: number;
      totalProperties: number;
      occupiedProperties: number;
      availableProperties: number;
      reservedProperties: number;
      maintenanceProperties: number;
      totalUnits: number;
      occupiedUnits: number;
      availableUnits: number;
      reservedUnits: number;
      maintenanceUnits: number;
    };
    tenantInfo: {
      totalCustomers: number;
      activeTenancies: number;
      endedTenancies: number;
    };
    financialInfo: {
      monthlyExpectedRent: number;
      monthlyCollectedRent: number;
      monthlyOutstandingRent: number;
      totalOverdue: number;
      totalPropertyExpenses: number;
      totalAgentExpenses: number;
      totalExpenses: number;
    };
    paymentInfo: {
      overduePaymentCount: number;
      upcomingPaymentCount: number;
      paidPaymentCount: number;
      pendingPaymentCount: number;
    };
    documentInfo: {
      expiringDocumentsCount: number;
      expiredDocumentsCount: number;
      expiringWithoutAgentCount: number;
    };
    recentPayments: any[];
    overduePayments: any[];
    upcomingPayments: any[];
    recentExpenses: any[];
    expiringDocuments: any[];
    expiredDocuments: any[];
    availableUnits: any[];
  };
}

export const getDashboardData = async (): Promise<DashboardResponse> => {
  const response = await client.get<DashboardResponse>('/dashboard');
  return response.data;
};
