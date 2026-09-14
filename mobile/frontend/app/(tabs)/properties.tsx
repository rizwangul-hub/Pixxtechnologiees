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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProperties, PropertyItem } from '@/src/services/propertyService';
import { getLandlordsList } from '@/src/services/landlordService';
import { LandlordBrief } from '@/src/services/propertyService';
import DatabaseLoading from '../components/DatabaseLoading';

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
      {/* Top Header */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8 },
        ]}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.screenTitle}>Properties</Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            {loading ? 'Loading properties...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} listed`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/properties/create')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnHeaderText}>Add</Text>
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
