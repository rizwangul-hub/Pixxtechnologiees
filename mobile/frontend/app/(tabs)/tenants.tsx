import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTenants, TenantItem } from '@/src/services/tenantService';
import { getTenancies, TenancyItem } from '@/src/services/tenancyService';
import { getLandlordsList } from '@/src/services/landlordService';
import { LandlordBrief } from '@/src/services/propertyService';
import DatabaseLoading from '../components/DatabaseLoading';

export interface LandlordTenantGroup {
  landlordId: string;
  landlordName: string;
  landlordLogoUrl?: string;
  tenants: TenantItem[];
  totalTenants: number;
  activeLeasesCount: number;
  totalMonthlyRent: number;
}

const STATUS_FILTERS = ['All', 'Active', 'Inactive', 'Archived'];

export default function TenantsScreen() {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8;
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [tenancies, setTenancies] = useState<TenancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchTenantsData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const isArchived = selectedStatus === 'Archived';
      const [tenantsRes, tenanciesRes] = await Promise.all([
        getTenants({
          search: searchQuery,
          status: isArchived ? undefined : selectedStatus,
          archived: isArchived,
          limit: 100,
        }),
        getTenancies({ status: 'Active' }).catch(() => ({ success: false, count: 0, data: [] })),
      ]);

      if (tenantsRes && tenantsRes.data) {
        setTenants(tenantsRes.data);
      } else {
        setTenants([]);
      }

      if (tenanciesRes && tenanciesRes.data) {
        setTenancies(tenanciesRes.data);
      }
    } catch (err: any) {
      console.log('Error fetching tenants:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load tenants. Check network connection.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      fetchTenantsData();
    }, [fetchTenantsData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenantsData();
  };

  // View mode: 'grouped' by landlord (default) or 'flat' list
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [landlords, setLandlords] = useState<LandlordBrief[]>([]);

  useEffect(() => {
    getLandlordsList().then(setLandlords).catch(() => {});
  }, []);

  // Map active tenancy per customerId
  const activeTenancyMap = useMemo(() => {
    const map: Record<string, TenancyItem> = {};
    tenancies.forEach((t) => {
      const cId = t.customerId?._id || (t.customerId as any);
      if (cId) map[cId.toString()] = t;
    });
    return map;
  }, [tenancies]);

  // Group tenants by landlord (matching web version)
  const groupedByLandlord = useMemo<LandlordTenantGroup[]>(() => {
    const groupsMap: Record<string, LandlordTenantGroup> = {};

    tenants.forEach((tenant) => {
      const activeTenancy = activeTenancyMap[tenant._id];
      const landlordObj = (activeTenancy?.landlordId && typeof activeTenancy.landlordId === 'object')
        ? (activeTenancy.landlordId as any)
        : ((activeTenancy?.propertyId?.landlordId && typeof activeTenancy.propertyId.landlordId === 'object')
            ? (activeTenancy.propertyId.landlordId as any)
            : null);

      const landlordId = landlordObj
        ? (landlordObj._id || landlordObj.id || 'unassigned').toString()
        : (activeTenancy?.landlordId
            ? (activeTenancy.landlordId as any).toString()
            : (activeTenancy?.propertyId?.landlordId
                ? (activeTenancy.propertyId.landlordId as any).toString()
                : 'unassigned'));

      let matchedLandlord = landlordObj;
      if (!matchedLandlord && landlords.length > 0) {
        matchedLandlord = landlords.find((l) => (l._id || (l as any).id)?.toString() === landlordId);
      }

      const landlordName =
        matchedLandlord?.fullName ||
        matchedLandlord?.name ||
        (landlordId !== 'unassigned' ? 'Landlord' : 'General / Unassigned Tenants');
      const landlordLogoUrl =
        matchedLandlord?.logo?.url || matchedLandlord?.logoUrl || '';

      if (!groupsMap[landlordId]) {
        groupsMap[landlordId] = {
          landlordId,
          landlordName,
          landlordLogoUrl,
          tenants: [],
          totalTenants: 0,
          activeLeasesCount: 0,
          totalMonthlyRent: 0,
        };
      }

      const group = groupsMap[landlordId];
      group.tenants.push(tenant);
      group.totalTenants += 1;
      if (activeTenancy) {
        group.activeLeasesCount += 1;
        const rent = Number(activeTenancy.monthlyRent || 0);
        group.totalMonthlyRent += isNaN(rent) ? 0 : rent;
      }
    });

    return Object.values(groupsMap);
  }, [tenants, activeTenancyMap, landlords]);

  const renderTenantCard = ({ item }: { item: TenantItem }) => {
    const activeTenancy = activeTenancyMap[item._id];
    const propertyName = activeTenancy?.propertyId?.name || (activeTenancy?.propertyId as any)?.propertyName || null;
    const rentAmount = activeTenancy?.monthlyRent;

    const isArchived = item.isArchived || item.status === 'Archived';
    const isOccupying = Boolean(activeTenancy);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/tenants/${item._id}` as any)}
      >
        <View style={styles.cardHeader}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'T'}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.tenantName} numberOfLines={1}>
              {item.fullName || item.name}
            </Text>
            <Text style={styles.tenantType}>{item.type || 'Individual Tenant'}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isArchived
                ? styles.badgeArchived
                : isOccupying
                ? styles.badgeActive
                : styles.badgeVacant,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isArchived
                  ? styles.badgeArchivedText
                  : isOccupying
                  ? styles.badgeActiveText
                  : styles.badgeVacantText,
              ]}
            >
              {isArchived ? 'Archived' : isOccupying ? 'Active Lease' : 'No Lease'}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.cardBody}>
          {item.phone ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={15} color="#64748b" style={styles.infoIcon} />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          ) : null}

          {item.email ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={15} color="#64748b" style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : null}

          {propertyName ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="home-work" size={15} color="#059669" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: '#059669', fontWeight: '600' }]} numberOfLines={1}>
                Property: {propertyName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            {rentAmount !== undefined ? (
              <Text style={styles.rentText}>
                £{Number(rentAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} / mo
              </Text>
            ) : (
              <Text style={styles.noTenancyText}>Currently vacant</Text>
            )}
          </View>
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View Profile</Text>
            <MaterialIcons name="chevron-right" size={18} color="#0284c7" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with UK Pixxtechnologies Logo & Branding */}
      <View style={[styles.topHeader, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/more' as any);
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerBrandWrap}>
          <Image
            source={require('@/assets/images/logo1.jpg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.brandTitle}>UK Pixxtechnologies</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {loading ? 'Loading tenants...' : `${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'} registered`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/tenants/create' as any)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="person-add" size={18} color="#ffffff" />
          <Text style={styles.addBtnHeaderText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, email..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchTenantsData}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, selectedStatus !== 'All' && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons
            name="tune"
            size={20}
            color={selectedStatus !== 'All' ? '#ffffff' : '#0284c7'}
          />
        </TouchableOpacity>
      </View>

      {/* View Mode Switcher: Grouped by Landlord vs All Tenants */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'grouped' && styles.viewModeTabActive]}
          onPress={() => setViewMode('grouped')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="group-work"
            size={16}
            color={viewMode === 'grouped' ? '#0284c7' : '#64748b'}
          />
          <Text style={[styles.viewModeText, viewMode === 'grouped' && styles.viewModeTextActive]}>
            Grouped by Landlord
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'flat' && styles.viewModeTabActive]}
          onPress={() => setViewMode('flat')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="view-list"
            size={16}
            color={viewMode === 'flat' ? '#0284c7' : '#64748b'}
          />
          <Text style={[styles.viewModeText, viewMode === 'flat' && styles.viewModeTextActive]}>
            All Tenants List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body List */}
      {loading && !refreshing ? (
        <DatabaseLoading />
      ) : errorMessage ? (
        <View style={styles.centeredState}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Tenants</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchTenantsData(); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'grouped' ? (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
          showsVerticalScrollIndicator={false}
        >
          {groupedByLandlord.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No tenants found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'Try searching with different terms or reset your filter.'
                  : 'Start by registering your first tenant profile.'}
              </Text>
              {searchQuery || selectedStatus !== 'All' ? (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                  }}
                >
                  <Text style={styles.clearFilterBtnText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => router.push('/tenants/create' as any)}
                >
                  <MaterialIcons name="person-add" size={18} color="#ffffff" />
                  <Text style={styles.addFirstBtnText}>Register Tenant</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            groupedByLandlord.map((group) => (
              <View key={group.landlordId} style={styles.landlordGroupCard}>
                {/* Landlord Header Banner */}
                <View style={styles.landlordGroupHeader}>
                  <View style={styles.landlordGroupHeaderTop}>
                    <View style={styles.landlordProfileWrap}>
                      {group.landlordLogoUrl ? (
                        <Image source={{ uri: group.landlordLogoUrl }} style={styles.landlordLogo} />
                      ) : (
                        <View style={styles.landlordInitialsCircle}>
                          <Text style={styles.landlordInitialsText}>
                            {group.landlordName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.landlordGroupName} numberOfLines={1}>
                          {group.landlordName}
                        </Text>
                        <Text style={styles.landlordGroupSub}>
                          Landlord Tenants & Leases
                        </Text>
                      </View>
                    </View>

                    {group.landlordId !== 'unassigned' && (
                      <TouchableOpacity
                        style={styles.landlordReportBtn}
                        onPress={() => router.push(`/reports/tenant?landlordId=${group.landlordId}` as any)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="assessment" size={14} color="#0284c7" />
                        <Text style={styles.landlordReportBtnText}>Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Landlord Metric Chips */}
                  <View style={styles.groupMetricChipsRow}>
                    <View style={styles.groupMetricChip}>
                      <MaterialIcons name="people" size={13} color="#0284c7" />
                      <Text style={styles.groupMetricChipText}>
                        {group.totalTenants} {group.totalTenants === 1 ? 'Tenant' : 'Tenants'}
                      </Text>
                    </View>
                    <View style={[styles.groupMetricChip, { backgroundColor: '#f0fdf4' }]}>
                      <MaterialIcons name="vpn-key" size={13} color="#16a34a" />
                      <Text style={[styles.groupMetricChipText, { color: '#16a34a' }]}>
                        {group.activeLeasesCount} Active Leases
                      </Text>
                    </View>
                    <View style={[styles.groupMetricChip, { backgroundColor: '#ecfdf5' }]}>
                      <MaterialIcons name="payments" size={13} color="#059669" />
                      <Text style={[styles.groupMetricChipText, { color: '#059669' }]}>
                        £{group.totalMonthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tenants Cards in this Group */}
                <View style={styles.groupPropertiesContainer}>
                  {group.tenants.map((t) => (
                    <View key={t._id} style={{ marginBottom: 10 }}>
                      {renderTenantCard({ item: t })}
                    </View>
                  ))}
                </View>

                {/* Landlord Group Footer Summary */}
                <View style={styles.landlordGroupFooter}>
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Total Tenants</Text>
                    <Text style={styles.groupFooterValue}>{group.totalTenants}</Text>
                  </View>
                  <View style={styles.groupFooterDivider} />
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Active Leases</Text>
                    <Text style={[styles.groupFooterValue, { color: '#059669' }]}>
                      {group.activeLeasesCount}
                    </Text>
                  </View>
                  <View style={styles.groupFooterDivider} />
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Monthly Rent Total</Text>
                    <Text style={[styles.groupFooterValue, { color: '#0284c7' }]}>
                      £{group.totalMonthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item._id}
          renderItem={renderTenantCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No tenants found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'Try searching with different terms or reset your filter.'
                  : 'Start by registering your first tenant profile.'}
              </Text>
              {searchQuery || selectedStatus !== 'All' ? (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                  }}
                >
                  <Text style={styles.clearFilterBtnText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => router.push('/tenants/create' as any)}
                >
                  <MaterialIcons name="person-add" size={18} color="#ffffff" />
                  <Text style={styles.addFirstBtnText}>Register Tenant</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Add Tenant Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => router.push('/tenants/create' as any)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tenants</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={styles.filterSectionLabel}>Status</Text>
              <View style={styles.chipsWrap}>
                {STATUS_FILTERS.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, selectedStatus === st && styles.chipSelected]}
                    onPress={() => setSelectedStatus(st)}
                  >
                    <Text style={[styles.chipText, selectedStatus === st && styles.chipTextSelected]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setSelectedStatus('All');
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => {
                    setFilterModalVisible(false);
                    fetchTenantsData();
                  }}
                >
                  <Text style={styles.applyBtnText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 6,
    marginLeft: -4,
  },
  headerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  viewModeTabActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  landlordGroupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  landlordGroupHeader: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  landlordGroupHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  landlordProfileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  landlordLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  landlordInitialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landlordInitialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  landlordGroupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  landlordGroupSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  landlordReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  landlordReportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  groupMetricChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  groupMetricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  groupMetricChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  groupPropertiesContainer: {
    padding: 12,
  },
  landlordGroupFooter: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  groupFooterItem: {
    alignItems: 'center',
    flex: 1,
  },
  groupFooterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  groupFooterLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  groupFooterValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
  },
  addBtnHeaderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0284c7',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  tenantType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
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
  badgeVacant: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeVacantText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeArchived: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  badgeArchivedText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    marginVertical: 4,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  noTenancyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
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
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 16,
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  clearFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  addFirstBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
