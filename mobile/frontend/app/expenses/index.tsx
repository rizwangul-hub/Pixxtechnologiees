// app/expenses/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getExpenses, Expense } from '@/src/services/expenseService';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setError(null);
      const res = await getExpenses();
      const list = res?.data ?? (Array.isArray(res) ? res : []);
      setExpenses(list);
    } catch (e: any) {
      console.error('Failed to load expenses:', e);
      setError(e?.response?.data?.message || e?.message || 'Unable to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        {/* KPI Banner */}
        <View style={styles.kpiCard}>
          <View>
            <Text style={styles.kpiLabel}>Total Recorded Expenses</Text>
            <Text style={styles.kpiValue}>{formatCurrencyGBP(totalAmount)}</Text>
          </View>
          <View style={styles.kpiCountBadge}>
            <Text style={styles.kpiCountText}>{expenses.length} Records</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Loading expenses...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={44} color="#ef4444" />
            <Text style={styles.errorTitle}>Error Loading Expenses</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchExpenses}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="receipt-long" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Expenses Found</Text>
            <Text style={styles.emptySubtitle}>There are currently no operational expenses recorded.</Text>
          </View>
        ) : (
          expenses.map((item, index) => {
            const propName = item.propertyId?.name || item.propertyId?.title || 'Property';
            const supplier = item.supplier || 'General Supplier';
            const category = item.category || 'General';
            const dateStr = formatDateUK(item.date);
            const status = item.status || 'Recorded';

            return (
              <View key={item._id || index} style={styles.expenseCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{category}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status === 'Paid' ? '#ecfdf5' : '#fff7ed' }]}>
                    <Text style={[styles.statusText, { color: status === 'Paid' ? '#059669' : '#c2410c' }]}>{status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>Supplier: {supplier}</Text>
                <Text style={styles.cardSub}>Property: {propName}</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>Date: {dateStr}</Text>
                  <Text style={styles.cardAmount}>{formatCurrencyGBP(item.amount)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  refreshBtn: { padding: 6 },
  content: { padding: 16, paddingBottom: 40 },
  kpiCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#dc2626', marginTop: 2 },
  kpiCountBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  kpiCountText: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorBox: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 12, borderColor: '#fecaca', borderWidth: 1, marginTop: 20 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginTop: 8 },
  errorMsg: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 14, backgroundColor: '#0284c7', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyBox: { alignItems: 'center', padding: 36, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 10 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  expenseCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#334155', marginTop: 4, fontStyle: 'italic' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  cardAmount: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
});
