import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getTenancies, TenancyItem } from '@/src/services/tenancyService';

export default function TenanciesScreen() {
  const [tenancies, setTenancies] = useState<TenancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTenanciesData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await getTenancies();
      if (res && res.data) {
        setTenancies(res.data);
      } else {
        setTenancies([]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load tenancies.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTenanciesData();
    }, [fetchTenanciesData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenanciesData();
  };

  const filteredTenancies = tenancies.filter((t) => {
    const q = searchQuery.toLowerCase();
    const tenantName = (t.customerId?.fullName || t.customerId?.name || '').toLowerCase();
    const propName = (t.propertyId?.name || (t.propertyId as any)?.propertyName || '').toLowerCase();
    const landlordName = (t.landlordId?.fullName || '').toLowerCase();
    return tenantName.includes(q) || propName.includes(q) || landlordName.includes(q);
  });

  const renderCard = ({ item }: { item: TenancyItem }) => {
    const tenantName = item.customerId?.fullName || item.customerId?.name || 'Unknown Tenant';
    const propName = item.propertyId?.name || (item.propertyId as any)?.propertyName || 'Unknown Property';
    const landlordName = item.landlordId?.fullName || 'Landlord';

    const isActive = item.status === 'Active';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/tenancies/${item._id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.propTitle} numberOfLines={1}>
              {propName}
            </Text>
            <Text style={styles.tenantSubtitle} numberOfLines={1}>
              Tenant: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{tenantName}</Text>
            </Text>
          </View>
          <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeEnded]}>
            <Text style={[styles.statusBadgeText, isActive ? styles.badgeActiveText : styles.badgeEndedText]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={15} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>Landlord: {landlordName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={15} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : '-'}
              {' → '}
              {item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : 'Ongoing'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.rentLabel}>Monthly Rent</Text>
            <Text style={styles.rentAmount}>
              £{Number(item.monthlyRent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.viewRow}>
            <Text style={styles.viewText}>View Tenancy</Text>
            <MaterialIcons name="chevron-right" size={18} color="#0284c7" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Tenancy Agreements</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/tenancies/create' as any)}
        >
          <MaterialIcons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by tenant, property, landlord..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading tenancies...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchTenanciesData(); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTenancies}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="assignment-late" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Tenancies Found</Text>
              <Text style={styles.emptySub}>Create a new lease agreement connecting a tenant and property.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
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
  backBtn: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  propTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  tenantSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  badgeEnded: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeEndedText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    gap: 4,
    marginBottom: 8,
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
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rentLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  rentAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 13,
    fontWeight: '600',
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
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
