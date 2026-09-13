import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getPayments, Payment } from '@/src/services/paymentService';
import { PaymentCard } from '@/src/components/PaymentCard';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import DatabaseLoading from '../components/DatabaseLoading';

export default function PaymentsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

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
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search payments..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchPayments}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <DatabaseLoading />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPayments}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.stateText}>No payments found.</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Payments</Text>
            <Text style={styles.modalLabel}>Status</Text>
            {['Pending', 'Partially Paid', 'Paid', 'Received', 'Partially Received', 'Overdue'].map((s) => (
              <TouchableOpacity key={s} style={styles.modalOption} onPress={() => setStatusFilter(s)}>
                <Text style={styles.modalOptionText}>{s}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setFilterModalVisible(false); fetchPayments(); }}>
                <Text style={styles.modalBtnText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  headerRow: { flexDirection: 'row', marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtn: { marginLeft: 8, backgroundColor: '#0284c7', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
  filterBtnText: { color: '#fff', fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8, color: '#64748b' },
  errorText: { color: '#ef4444', marginBottom: 12 },
  retryBtn: { backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: '#fff' },
  listContent: { paddingBottom: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalLabel: { fontSize: 14, marginTop: 8 },
  modalOption: { paddingVertical: 6 },
  modalOptionText: { fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { backgroundColor: '#0284c7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  modalBtnText: { color: '#fff' },
});
