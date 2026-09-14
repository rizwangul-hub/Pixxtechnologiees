import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTenancies, endTenancy, TenancyItem } from '@/src/services/tenancyService';

export default function TenancyDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8;
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tenancy, setTenancy] = useState<TenancyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const res = await getTenancies();
      const found = res.data?.find((t) => t._id === id);
      if (found) {
        setTenancy(found);
      } else {
        setErrorMessage('Tenancy agreement not found.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load tenancy agreement.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEndTenancy = () => {
    if (!tenancy) return;
    Alert.alert(
      'End Tenancy',
      'Are you sure you want to end this tenancy? The property status will automatically revert to Available.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Tenancy',
          style: 'destructive',
          onPress: async () => {
            try {
              await endTenancy(tenancy._id);
              Alert.alert('Success', 'Tenancy ended. Property has been released.');
              loadData();
            } catch (e: any) {
              Alert.alert('Action Failed', e.response?.data?.message || e.message || 'Error occurred.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading tenancy details...</Text>
      </View>
    );
  }

  if (errorMessage || !tenancy) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Tenancy Not Found</Text>
        <Text style={styles.errorSubtitle}>{errorMessage || 'Unable to load tenancy data.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const propName = tenancy.propertyId?.name || (tenancy.propertyId as any)?.propertyName || 'Property';
  const tenantName = tenancy.customerId?.fullName || tenancy.customerId?.name || 'Tenant';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Tenancy Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.mainProperty}>{propName}</Text>
              <Text style={styles.subText}>{tenancy.propertyId?.address || 'London, UK'}</Text>
            </View>
            <View style={[styles.statusBadge, tenancy.status === 'Active' ? styles.badgeActive : styles.badgeEnded]}>
              <Text style={[styles.statusBadgeText, tenancy.status === 'Active' ? styles.badgeActiveText : styles.badgeEndedText]}>
                {tenancy.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Tenant Information */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeader}>Tenant</Text>
            {tenancy.customerId?._id && (
              <TouchableOpacity
                onPress={() => router.push(`/tenants/${tenancy.customerId._id}` as any)}
              >
                <Text style={styles.linkText}>View Profile</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.entityName}>{tenantName}</Text>
          {tenancy.customerId?.phone ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={16} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>{tenancy.customerId.phone}</Text>
            </View>
          ) : null}
          {tenancy.customerId?.email ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={16} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>{tenancy.customerId.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Financial Terms */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Lease & Financial Terms</Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={18} color="#64748b" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              Duration: {tenancy.startDate ? new Date(tenancy.startDate).toLocaleDateString('en-GB') : '-'}
              {' to '}
              {tenancy.endDate ? new Date(tenancy.endDate).toLocaleDateString('en-GB') : 'Ongoing'}
            </Text>
          </View>

          <View style={styles.financialRow}>
            <View>
              <Text style={styles.financialLabel}>Monthly Rent</Text>
              <Text style={styles.financialValue}>
                £{Number(tenancy.monthlyRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.financialLabel}>Payment Due Day</Text>
              <Text style={styles.financialValue}>Day {tenancy.paymentDueDay || 1}</Text>
            </View>
          </View>

          {tenancy.securityDeposit ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="security" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Security Deposit: £{Number(tenancy.securityDeposit).toLocaleString('en-GB')}
              </Text>
            </View>
          ) : null}

          {tenancy.openingBalance ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="account-balance-wallet" size={18} color="#b45309" style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: '#b45309', fontWeight: '600' }]}>
                Opening Balance: £{Number(tenancy.openingBalance).toLocaleString('en-GB')}
              </Text>
            </View>
          ) : null}

          {tenancy.notes ? (
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{tenancy.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Agent Info if attached */}
        {tenancy.agentId ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Managing Agent</Text>
            <Text style={styles.entityName}>
              {tenancy.agentId.fullName || tenancy.agentId.name || tenancy.agentId.agencyName}
            </Text>
            {tenancy.companyMonthlyAmount ? (
              <Text style={styles.detailText}>Monthly Fee: £{tenancy.companyMonthlyAmount}</Text>
            ) : null}
          </View>
        ) : null}

        {/* End Tenancy Button */}
        {tenancy.status === 'Active' && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEndTenancy}>
            <MaterialIcons name="cancel" size={20} color="#dc2626" />
            <Text style={styles.endBtnText}>End Tenancy & Release Property</Text>
          </TouchableOpacity>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainProperty: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
  },
  badgeActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeActiveText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeEnded: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeEndedText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  entityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  financialLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  notesWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 14,
    gap: 6,
  },
  endBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
