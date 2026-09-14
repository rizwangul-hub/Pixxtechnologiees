import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPayments, Payment } from '@/src/services/paymentService';
import { PaymentCard } from '@/src/components/PaymentCard';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import DatabaseLoading from '../components/DatabaseLoading';

export default function PaymentsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchPayments = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (searchParams?.tenantId) params.tenantId = searchParams.tenantId;
      if (searchParams?.propertyId) params.propertyId = searchParams.propertyId;
      if (searchParams?.tenancyId) params.tenancyId = searchParams.tenancyId;
      if (searchParams?.paymentMethod) params.paymentMethod = searchParams.paymentMethod;

      const res = await getPayments(params);
      if (res.success) {
        setPayments(res.data);
      } else {
        setError('Failed to load payments.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to load payments.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, searchParams]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const renderItem = ({ item }: { item: Payment }) => <PaymentCard payment={item} />;

  return (
    <View style={styles.container}>
      {/* Top Header with Safe Area Inset */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.topHeaderTitle}>Payments</Text>
          <Text style={styles.topHeaderSubtitle}>{payments.length} Records</Text>
        </View>
        <TouchableOpacity
          style={styles.collectRentBtn}
          onPress={() => router.push('/(tabs)/tenants')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.collectRentBtnText}>Collect Rent</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <View style={styles.searchBoxWrap}>
            <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tenant or property..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={fetchPayments}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <MaterialIcons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, statusFilter ? styles.filterBtnActive : null]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="filter-list" size={20} color={statusFilter ? '#ffffff' : '#0284c7'} />
            <Text style={[styles.filterBtnText, statusFilter ? styles.filterBtnTextActive : null]}>
              {statusFilter || 'Filter'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <DatabaseLoading />
        ) : error ? (
          <View style={styles.centered}>
            <MaterialIcons name="error-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPayments}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.centered}>
            <MaterialIcons name="payment" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No payments found</Text>
            <Text style={styles.stateText}>Payments will appear here when schedules or rents are recorded.</Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => router.push('/(tabs)/tenants')}
            >
              <Text style={styles.emptyActionBtnText}>Go to Tenants to Collect Rent</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filter Payments</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Payment Status</Text>
            <View style={styles.filterOptionsGrid}>
              {['All', 'Pending', 'Partially Paid', 'Paid', 'Received', 'Partially Received', 'Overdue'].map((s) => {
                const isSelected = (s === 'All' && !statusFilter) || statusFilter === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.modalOptionPill, isSelected && styles.modalOptionPillActive]}
                    onPress={() => setStatusFilter(s === 'All' ? '' : s)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setStatusFilter('');
                }}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchPayments();
                }}
              >
                <Text style={styles.modalApplyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeaderLeft: { flex: 1 },
  topHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  topHeaderSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  collectRentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    minHeight: 44,
  },
  collectRentBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  contentWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  searchBoxWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', height: '100%' },
  clearSearchBtn: { padding: 4 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  filterBtnActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  filterBtnText: { color: '#0284c7', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#ffffff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 },
  stateText: { marginTop: 6, color: '#64748b', textAlign: 'center', fontSize: 13 },
  emptyActionBtn: { marginTop: 16, backgroundColor: '#e0f2fe', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyActionBtnText: { color: '#0284c7', fontWeight: '700', fontSize: 13 },
  errorText: { color: '#ef4444', marginTop: 8, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#0284c7', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  listContent: { paddingTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  modalOptionPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  modalOptionPillActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  modalOptionText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  modalOptionTextActive: { color: '#ffffff', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalResetBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  modalResetBtnText: { color: '#64748b', fontWeight: '600' },
  modalApplyBtn: { backgroundColor: '#0284c7', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  modalApplyBtnText: { color: '#fff', fontWeight: '700' },
});

