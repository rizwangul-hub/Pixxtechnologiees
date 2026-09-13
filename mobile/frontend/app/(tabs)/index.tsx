import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '@/src/context/AuthContext';
import { getDashboardData, DashboardResponse } from '@/src/services/dashboardService';
import DatabaseLoading from '../components/DatabaseLoading';

export default function DashboardScreen() {
  const { manager, signOut } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState<DashboardResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const res = await getDashboardData();
      if (res && res.data) {
        setDashboardData(res.data);
      } else {
        setError('Failed to load dashboard metrics.');
      }
    } catch (err: any) {
      console.log('Dashboard fetch error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to load dashboard data. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const propertyInfo = dashboardData?.propertyInfo;
  const tenantInfo = dashboardData?.tenantInfo;
  const financialInfo = dashboardData?.financialInfo;
  const paymentInfo = dashboardData?.paymentInfo;
  const documentInfo = dashboardData?.documentInfo;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>PixxTechnologies</Text>
          <Text style={styles.welcomeText}>
            Welcome, {manager?.name || 'Manager'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="logout" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />
        }
      >
        {loading && !refreshing ? (
          <DatabaseLoading />
        ) : error ? (
          <View style={styles.centeredState}>
            <MaterialIcons name="error-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Error Loading Dashboard</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchMetrics(); }}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => router.push('/properties/create')}
              >
                <MaterialIcons name="add-business" size={18} color="#0284c7" />
                <Text style={styles.actionPillText}>+ Property</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => router.push('/tenants/create' as any)}
              >
                <MaterialIcons name="person-add" size={18} color="#0284c7" />
                <Text style={styles.actionPillText}>+ Tenant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => router.push('/tenancies/create' as any)}
              >
                <MaterialIcons name="assignment" size={18} color="#0284c7" />
                <Text style={styles.actionPillText}>+ Tenancy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => router.push('/(tabs)/payments')}
              >
                <MaterialIcons name="payment" size={18} color="#0284c7" />
                <Text style={styles.actionPillText}>+ Payment</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Property Portfolio</Text>
            <View style={styles.grid}>
              <View style={[styles.card, { borderLeftColor: '#0284c7' }]}>
                <Text style={styles.cardLabel}>Total Properties</Text>
                <Text style={styles.cardValue}>{propertyInfo?.totalProperties ?? 0}</Text>
                <Text style={styles.cardSub}>{propertyInfo?.totalLandlords ?? 0} Landlords</Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.cardLabel}>Occupied</Text>
                <Text style={[styles.cardValue, { color: '#059669' }]}>
                  {propertyInfo?.occupiedProperties ?? 0}
                </Text>
                <Text style={styles.cardSub}>
                  {propertyInfo?.totalProperties
                    ? Math.round(((propertyInfo.occupiedProperties || 0) / propertyInfo.totalProperties) * 100)
                    : 0}% occupancy
                </Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.cardLabel}>Available</Text>
                <Text style={[styles.cardValue, { color: '#d97706' }]}>
                  {propertyInfo?.availableProperties ?? 0}
                </Text>
                <Text style={styles.cardSub}>Ready for let</Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#8b5cf6' }]}>
                <Text style={styles.cardLabel}>Active Tenancies</Text>
                <Text style={[styles.cardValue, { color: '#7c3aed' }]}>
                  {tenantInfo?.activeTenancies ?? 0}
                </Text>
                <Text style={styles.cardSub}>{tenantInfo?.totalCustomers ?? 0} Total Tenants</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.grid}>
              <View style={[styles.card, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.cardLabel}>Collected Rent</Text>
                <Text style={[styles.cardValue, { color: '#059669' }]}>
                  £{Number(financialInfo?.monthlyCollectedRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.cardSub}>
                  Expected: £{Number(financialInfo?.monthlyExpectedRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#ef4444' }]}>
                <Text style={styles.cardLabel}>Outstanding Rent</Text>
                <Text style={[styles.cardValue, { color: '#dc2626' }]}>
                  £{Number(financialInfo?.monthlyOutstandingRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.cardSub}>
                  Overdue: £{Number(financialInfo?.totalOverdue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Payment & Document Alerts</Text>
            <View style={styles.grid}>
              <View style={[styles.card, { borderLeftColor: '#f97316' }]}>
                <Text style={styles.cardLabel}>Overdue Payments</Text>
                <Text style={[styles.cardValue, { color: '#ea580c' }]}>
                  {paymentInfo?.overduePaymentCount ?? 0}
                </Text>
                <Text style={styles.cardSub}>Requires attention</Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#0284c7' }]}>
                <Text style={styles.cardLabel}>Upcoming Payments</Text>
                <Text style={[styles.cardValue, { color: '#0284c7' }]}>
                  {paymentInfo?.upcomingPaymentCount ?? 0}
                </Text>
                <Text style={styles.cardSub}>Due soon</Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#e11d48' }]}>
                <Text style={styles.cardLabel}>Expiring Documents</Text>
                <Text style={[styles.cardValue, { color: '#e11d48' }]}>
                  {documentInfo?.expiringDocumentsCount ?? 0}
                </Text>
                <Text style={styles.cardSub}>Within 30 days</Text>
              </View>

              <View style={[styles.card, { borderLeftColor: '#64748b' }]}>
                <Text style={styles.cardLabel}>Total Expenses</Text>
                <Text style={styles.cardValue}>
                  £{Number(financialInfo?.totalExpenses || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.cardSub}>Property + Agent</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  cardSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
