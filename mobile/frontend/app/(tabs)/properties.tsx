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
  Modal,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProperties, PropertyItem } from '@/src/services/propertyService';
import { getLandlordsList } from '@/src/services/landlordService';
import { LandlordBrief } from '@/src/services/propertyService';
import DatabaseLoading from '../components/DatabaseLoading';

export interface LandlordPropertyGroup {
  landlordId: string;
  landlordName: string;
  landlordLogoUrl?: string;
  properties: PropertyItem[];
  totalProperties: number;
  totalMonthlyRent: number;
  occupiedCount: number;
  availableCount: number;
}

const PROPERTY_TYPES = ['All', 'Shop', 'Office', 'House', 'Flat', 'Apartment', 'Building', 'Other'];
const STATUSES = ['All', 'Available', 'Occupied', 'Reserved', 'Maintenance', 'Archived'];

export default function PropertiesScreen() {
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLandlordId, setSelectedLandlordId] = useState('All');

  // Landlords options for filter
  const [landlords, setLandlords] = useState<LandlordBrief[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Load landlords once
  useEffect(() => {
    getLandlordsList().then(setLandlords).catch(() => {});
  }, []);

  const fetchPropertiesData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const isArchived = selectedStatus === 'Archived';
      const res = await getProperties({
        search: searchQuery,
        type: selectedType,
        status: isArchived ? undefined : selectedStatus,
        landlordId: selectedLandlordId,
        archived: isArchived,
        limit: 100,
      });

      if (res && res.data) {
        setProperties(res.data);
      } else {
        setProperties([]);
      }
    } catch (err: any) {
      console.log('Error fetching properties:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load properties. Check internet connection.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedType, selectedStatus, selectedLandlordId]);

  useFocusEffect(
    useCallback(() => {
      fetchPropertiesData();
    }, [fetchPropertiesData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPropertiesData();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType !== 'All') count++;
    if (selectedStatus !== 'All') count++;
    if (selectedLandlordId !== 'All') count++;
    return count;
  }, [selectedType, selectedStatus, selectedLandlordId]);

  // View mode: 'grouped' by landlord (default) or 'flat' list
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Group properties by landlord (matching web version)
  const groupedByLandlord = useMemo<LandlordPropertyGroup[]>(() => {
    const groupsMap: Record<string, LandlordPropertyGroup> = {};

    properties.forEach((p) => {
      const landlordObj = (p.landlordId && typeof p.landlordId === 'object') ? (p.landlordId as any) : null;
      const landlordId = landlordObj
        ? (landlordObj._id || landlordObj.id || 'unassigned').toString()
        : (p.landlordId ? (p.landlordId as any).toString() : 'unassigned');

      let matchedLandlord = landlordObj;
      if (!matchedLandlord && landlords.length > 0) {
        matchedLandlord = landlords.find((l) => (l._id || (l as any).id)?.toString() === landlordId);
      }

      const landlordName =
        matchedLandlord?.fullName ||
        matchedLandlord?.name ||
        (landlordId !== 'unassigned' ? 'Landlord' : 'General Portfolio (Unassigned)');
      const landlordLogoUrl =
        matchedLandlord?.logo?.url || matchedLandlord?.logoUrl || '';

      if (!groupsMap[landlordId]) {
        groupsMap[landlordId] = {
          landlordId,
          landlordName,
          landlordLogoUrl,
          properties: [],
          totalProperties: 0,
          totalMonthlyRent: 0,
          occupiedCount: 0,
          availableCount: 0,
        };
      }

      const group = groupsMap[landlordId];
      group.properties.push(p);
      group.totalProperties += 1;
      const rent = Number(p.monthlyRent || p.price || 0);
      group.totalMonthlyRent += isNaN(rent) ? 0 : rent;
      const st = (p.status || '').toLowerCase();
      if (st === 'occupied') {
        group.occupiedCount += 1;
      } else {
        group.availableCount += 1;
      }
    });

    return Object.values(groupsMap);
  }, [properties, landlords]);

  const clearAllFilters = () => {
    setSelectedType('All');
    setSelectedStatus('All');
    setSelectedLandlordId('All');
    setFilterModalVisible(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Occupied':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'Available':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'Reserved':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'Maintenance':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'Archived':
        return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
      default:
        return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    }
  };

  const renderPropertyCard = ({ item }: { item: PropertyItem }) => {
    const statusStyle = getStatusBadgeColor(item.status || 'Available');
    const rentAmount = Number(item.monthlyRent || item.price || 0);
    const landlordName = item.landlordId?.fullName || 'No Landlord';
    const addressLine = [item.address, item.city, item.postcode].filter(Boolean).join(', ');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/properties/${item._id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.propertyName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.propertyType}>{item.type || item.assetType || 'Property'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status || 'Available'}</Text>
          </View>
        </View>

        {addressLine ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={16} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              {addressLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color="#64748b" style={styles.infoIcon} />
          <Text style={styles.infoText} numberOfLines={1}>
            Landlord: <Text style={styles.highlightText}>{landlordName}</Text>
          </Text>
        </View>

        {item.tenantName ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="person-pin" size={16} color="#059669" style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              Tenant: <Text style={[styles.highlightText, { color: '#059669' }]}>{item.tenantName}</Text>
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.rentLabel}>Monthly Rent</Text>
            <Text style={styles.rentAmount}>
              £{rentAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.viewDetailsWrap}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <MaterialIcons name="chevron-right" size={18} color="#0284c7" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Pixxtechnologiees Branding & Logo */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8 },
        ]}
      >
        <View style={styles.headerBrandWrap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.brandTitle}>Pixxtechnologiees</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {loading ? 'Loading properties...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} listed`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/properties/create')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-business" size={18} color="#ffffff" />
          <Text style={styles.addBtnHeaderText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, postcode..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchPropertiesData}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons
            name="tune"
            size={20}
            color={activeFiltersCount > 0 ? '#ffffff' : '#0284c7'}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* View Mode Switcher: Grouped by Landlord vs All Properties */}
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
            All Properties List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading && !refreshing ? (
        <DatabaseLoading />
      ) : errorMessage ? (
        <View style={styles.centeredState}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Properties</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchPropertiesData(); }}>
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
              <MaterialIcons name="domain-disabled" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Try changing your search keywords or clear your active filters.'
                  : 'Get started by adding your first rentable property.'}
              </Text>
              {searchQuery || activeFiltersCount > 0 ? (
                <TouchableOpacity style={styles.clearFilterBtn} onPress={clearAllFilters}>
                  <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => router.push('/properties/create')}
                >
                  <MaterialIcons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addFirstBtnText}>Add Property</Text>
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
                          Landlord Property Portfolio
                        </Text>
                      </View>
                    </View>

                    {group.landlordId !== 'unassigned' && (
                      <TouchableOpacity
                        style={styles.landlordReportBtn}
                        onPress={() => router.push(`/reports/property?landlordId=${group.landlordId}` as any)}
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
                      <MaterialIcons name="business" size={13} color="#0284c7" />
                      <Text style={styles.groupMetricChipText}>
                        {group.totalProperties} {group.totalProperties === 1 ? 'Unit' : 'Units'}
                      </Text>
                    </View>
                    <View style={[styles.groupMetricChip, { backgroundColor: '#ecfdf5' }]}>
                      <MaterialIcons name="payments" size={13} color="#059669" />
                      <Text style={[styles.groupMetricChipText, { color: '#059669' }]}>
                        £{group.totalMonthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
                      </Text>
                    </View>
                    <View style={[styles.groupMetricChip, { backgroundColor: '#f0fdf4' }]}>
                      <MaterialIcons name="check-circle" size={13} color="#16a34a" />
                      <Text style={[styles.groupMetricChipText, { color: '#16a34a' }]}>
                        {group.occupiedCount} Occupied
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Properties in this Group */}
                <View style={styles.groupPropertiesContainer}>
                  {group.properties.map((p) => (
                    <View key={p._id} style={{ marginBottom: 10 }}>
                      {renderPropertyCard({ item: p })}
                    </View>
                  ))}
                </View>

                {/* Landlord Group Footer Summary */}
                <View style={styles.landlordGroupFooter}>
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Total Units</Text>
                    <Text style={styles.groupFooterValue}>{group.totalProperties}</Text>
                  </View>
                  <View style={styles.groupFooterDivider} />
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Occupied</Text>
                    <Text style={[styles.groupFooterValue, { color: '#059669' }]}>
                      {group.occupiedCount}
                    </Text>
                  </View>
                  <View style={styles.groupFooterDivider} />
                  <View style={styles.groupFooterItem}>
                    <Text style={styles.groupFooterLabel}>Monthly Rent Roll</Text>
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
          data={properties}
          keyExtractor={(item) => item._id}
          renderItem={renderPropertyCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="domain-disabled" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Try changing your search keywords or clear your active filters.'
                  : 'Get started by adding your first rentable property.'}
              </Text>
              {searchQuery || activeFiltersCount > 0 ? (
                <TouchableOpacity style={styles.clearFilterBtn} onPress={clearAllFilters}>
                  <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => router.push('/properties/create')}
                >
                  <MaterialIcons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addFirstBtnText}>Add Property</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => router.push('/properties/create')}
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
              <Text style={styles.modalTitle}>Filter Properties</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Property Type Filter */}
              <Text style={styles.filterSectionLabel}>Property Type</Text>
              <View style={styles.filterChipsWrap}>
                {PROPERTY_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.filterChip, selectedType === t && styles.filterChipSelected]}
                    onPress={() => setSelectedType(t)}
                  >
                    <Text style={[styles.filterChipText, selectedType === t && styles.filterChipTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status Filter */}
              <Text style={styles.filterSectionLabel}>Status</Text>
              <View style={styles.filterChipsWrap}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterChip, selectedStatus === s && styles.filterChipSelected]}
                    onPress={() => setSelectedStatus(s)}
                  >
                    <Text style={[styles.filterChipText, selectedStatus === s && styles.filterChipTextSelected]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Landlord Filter */}
              <Text style={styles.filterSectionLabel}>Landlord</Text>
              <View style={styles.landlordFilterList}>
                <TouchableOpacity
                  style={[styles.landlordFilterItem, selectedLandlordId === 'All' && styles.landlordFilterItemSelected]}
                  onPress={() => setSelectedLandlordId('All')}
                >
                  <Text style={[styles.landlordFilterText, selectedLandlordId === 'All' && styles.landlordFilterTextSelected]}>
                    All Landlords
                  </Text>
                </TouchableOpacity>
                {landlords.map((l) => (
                  <TouchableOpacity
                    key={l._id}
                    style={[styles.landlordFilterItem, selectedLandlordId === l._id && styles.landlordFilterItemSelected]}
                    onPress={() => setSelectedLandlordId(l._id)}
                  >
                    <Text style={[styles.landlordFilterText, selectedLandlordId === l._id && styles.landlordFilterTextSelected]}>
                      {l.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalResetBtn} onPress={clearAllFilters}>
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchPropertiesData();
                }}
              >
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
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
  headerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 68,
    height: 46,
    borderRadius: 6,
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
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#0284c7',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  propertyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  propertyType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  highlightText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rentLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rentAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  viewDetailsWrap: {
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
    maxHeight: '80%',
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
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  landlordFilterList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  landlordFilterItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  landlordFilterItemSelected: {
    backgroundColor: '#e0f2fe',
  },
  landlordFilterText: {
    fontSize: 13,
    color: '#334155',
  },
  landlordFilterTextSelected: {
    color: '#0284c7',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  modalResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalApplyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
