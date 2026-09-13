import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getTenantById,
  archiveTenant,
  restoreTenant,
  getTenantPayments,
  TenantItem,
} from '@/src/services/tenantService';
import { getTenancies, TenancyItem } from '@/src/services/tenancyService';

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tenant, setTenant] = useState<TenantItem | null>(null);
  const [activeTenancy, setActiveTenancy] = useState<TenancyItem | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const [tRes, tenanciesRes, paymentsRes] = await Promise.all([
        getTenantById(id),
        getTenancies({ customerId: id, status: 'Active' }).catch(() => ({ success: false, count: 0, data: [] })),
        getTenantPayments(id).catch(() => ({ success: false, count: 0, data: [] })),
      ]);

      if (tRes && tRes.data) {
        setTenant(tRes.data);
      }
      if (tenanciesRes && tenanciesRes.data && tenanciesRes.data.length > 0) {
        setActiveTenancy(tenanciesRes.data[0]);
      } else {
        setActiveTenancy(null);
      }
      if (paymentsRes && paymentsRes.data) {
        setRecentPayments(paymentsRes.data.slice(0, 5));
      }
    } catch (err: any) {
      console.log('Error loading tenant detail:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load tenant details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleArchiveToggle = () => {
    if (!tenant) return;
    const isArchived = tenant.isArchived || tenant.status === 'Archived';

    Alert.alert(
      isArchived ? 'Restore Tenant' : 'Archive Tenant',
      isArchived
        ? 'Do you want to restore this tenant to active listings?'
        : 'Are you sure you want to archive this tenant? Active tenancy will be ended and property released.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Restore' : 'Archive',
          style: isArchived ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isArchived) {
                await restoreTenant(tenant._id);
                Alert.alert('Restored', 'Tenant has been restored.');
              } else {
                await archiveTenant(tenant._id);
                Alert.alert('Archived', 'Tenant has been archived.');
              }
              loadDetails();
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
        <Text style={styles.loadingText}>Loading tenant profile...</Text>
      </View>
    );
  }

  if (errorMessage || !tenant) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Tenant Not Found</Text>
        <Text style={styles.errorSubtitle}>{errorMessage || 'Unable to load profile data.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tenant.fullName || tenant.name}
        </Text>
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() => router.push(`/tenants/edit/${tenant._id}` as any)}
        >
          <MaterialIcons name="edit" size={20} color="#0284c7" />
          <Text style={styles.headerEditText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {tenant.profileImage ? (
              <Image source={{ uri: tenant.profileImage }} style={styles.profileAvatarImg} />
            ) : (
              <View style={styles.profileAvatarCircle}>
                <Text style={styles.profileAvatarText}>
                  {tenant.name ? tenant.name.charAt(0).toUpperCase() : 'T'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.mainName}>{tenant.fullName || tenant.name}</Text>
              <Text style={styles.typeBadge}>{tenant.type || 'Individual Tenant'}</Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.divider} />
          {tenant.phone ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>{tenant.phone}</Text>
            </View>
          ) : null}

          {tenant.email ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>{tenant.email}</Text>
            </View>
          ) : null}

          {tenant.address ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="place" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {[tenant.address, tenant.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}

          {tenant.cnicOrReg ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="badge" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>ID / Reg No: {tenant.cnicOrReg}</Text>
            </View>
          ) : null}

          {tenant.emergencyContact ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="contact-phone" size={18} color="#dc2626" style={styles.detailIcon} />
              <Text style={styles.detailText}>Emergency: {tenant.emergencyContact}</Text>
            </View>
          ) : null}

          {tenant.notes ? (
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{tenant.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Current Tenancy Information */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeader}>Current Tenancy</Text>
            {activeTenancy && (
              <TouchableOpacity
                onPress={() => router.push(`/tenancies/${activeTenancy._id}` as any)}
              >
                <Text style={styles.linkText}>View Agreement</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTenancy ? (
            <View>
              <View style={styles.detailRow}>
                <MaterialIcons name="business" size={18} color="#0284c7" style={styles.detailIcon} />
                <Text style={[styles.detailText, { fontWeight: '700', color: '#0f172a' }]}>
                  {activeTenancy.propertyId?.name || (activeTenancy.propertyId as any)?.propertyName || 'Property'}
                </Text>
              </View>

              {activeTenancy.propertyId?.address ? (
                <View style={styles.detailRow}>
                  <MaterialIcons name="location-on" size={18} color="#64748b" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{activeTenancy.propertyId.address}</Text>
                </View>
              ) : null}

              {activeTenancy.landlordId ? (
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={18} color="#64748b" style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    Landlord: <Text style={{ fontWeight: '600' }}>{activeTenancy.landlordId.fullName}</Text>
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={18} color="#64748b" style={styles.detailIcon} />
                <Text style={styles.detailText}>
                  From: {activeTenancy.startDate ? new Date(activeTenancy.startDate).toLocaleDateString('en-GB') : '-'}
                  {' to '}
                  {activeTenancy.endDate ? new Date(activeTenancy.endDate).toLocaleDateString('en-GB') : 'Ongoing'}
                </Text>
              </View>

              <View style={styles.financialRow}>
                <View>
                  <Text style={styles.financialLabel}>Monthly Rent</Text>
                  <Text style={styles.financialValue}>
                    £{Number(activeTenancy.monthlyRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.financialLabel}>Rent Due Day</Text>
                  <Text style={styles.financialValue}>Day {activeTenancy.paymentDueDay || 1}</Text>
                </View>
              </View>

              {activeTenancy.securityDeposit ? (
                <Text style={styles.depositText}>
                  Security Deposit: £{Number(activeTenancy.securityDeposit).toLocaleString('en-GB')}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.noTenancyBox}>
              <MaterialIcons name="info-outline" size={24} color="#94a3b8" />
              <Text style={styles.noTenancyTitle}>No active tenancy agreement</Text>
              <Text style={styles.noTenancySub}>This tenant is not assigned to any property.</Text>
              <TouchableOpacity
                style={styles.createTenancyBtn}
                onPress={() => router.push(`/tenancies/create?tenantId=${tenant._id}` as any)}
              >
                <MaterialIcons name="add" size={18} color="#ffffff" />
                <Text style={styles.createTenancyBtnText}>Create Tenancy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        {recentPayments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Recent Rent Payments</Text>
            {recentPayments.map((p, idx) => (
              <View key={idx} style={[styles.paymentRow, idx !== recentPayments.length - 1 && styles.paymentBorder]}>
                <View>
                  <Text style={styles.paymentMonth}>
                    Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-GB') : '-'}
                  </Text>
                  <Text style={styles.paymentStatusText}>{p.status}</Text>
                </View>
                <Text style={styles.paymentAmount}>
                  £{Number(p.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Archive / Restore Button */}
        <TouchableOpacity style={styles.sectionButton} onPress={() => router.push(`/payments?tenantId=${tenant._id}`)}>
  <MaterialIcons name="payments" size={20} color="#0284c7" />
  <Text style={styles.sectionButtonText}>Payments</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.archiveBtn, (tenant.isArchived || tenant.status === 'Archived') && styles.restoreBtn]}
  onPress={handleArchiveToggle}
>
  <MaterialIcons
    name={tenant.isArchived || tenant.status === 'Archived' ? 'unarchive' : 'archive'}
    size={20}
    color={tenant.isArchived || tenant.status === 'Archived' ? '#0284c7' : '#ef4444'}
  />
  <Text
    style={[
      styles.archiveBtnText,
      (tenant.isArchived || tenant.status === 'Archived') && styles.restoreBtnText,
    ]}
  >
    {tenant.isArchived || tenant.status === 'Archived' ? 'Restore Tenant' : 'Archive Tenant'}
  </Text>
</TouchableOpacity>
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
    paddingTop: 52,
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
    marginHorizontal: 10,
    textAlign: 'center',
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  headerEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  mainName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  typeBadge: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  depositText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  noTenancyBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  noTenancyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  noTenancySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  createTenancyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  createTenancyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  paymentStatusText: {
    fontSize: 11,
    color: '#059669',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  archiveBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  restoreBtn: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  restoreBtnText: {
    color: '#0284c7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
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
