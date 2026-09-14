import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMortgages, Mortgage } from '@/src/services/mortgageService';
import { MaterialIcons } from '@expo/vector-icons';

export default function MortgageListScreen() {
  const insets = useSafeAreaInsets();
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMortgages = useCallback(async () => {
    try {
      setError(null);
      const res = await getMortgages();
      if (res && res.success) {
        setMortgages(res.data);
      } else {
        setError('Failed to load mortgages');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMortgages();
  }, [fetchMortgages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMortgages();
  };

  const renderItem = (mortgage: Mortgage) => (
    <TouchableOpacity
      key={mortgage._id}
      style={styles.itemContainer}
      onPress={() => router.push(`/mortgages/${mortgage._id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle} numberOfLines={1}>{mortgage.lenderName || 'Mortgage'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mortgage.mortgageType}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>
        Outstanding: £{Number(mortgage.currentOutstandingBalance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemFooterText}>Monthly: £{Number(mortgage.monthlyPayment).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading mortgages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Error loading mortgages</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMortgages}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mortgages</Text>
        <TouchableOpacity
          onPress={() => router.push('/mortgages/create' as any)}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
        showsVerticalScrollIndicator={false}
      >
        {mortgages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Mortgages Found</Text>
            <Text style={styles.emptySubtitle}>Track lender loans, balances, and monthly payments here.</Text>
            <TouchableOpacity
              style={styles.createFirstBtn}
              onPress={() => router.push('/mortgages/create' as any)}
            >
              <Text style={styles.createFirstBtnText}>Add First Mortgage</Text>
            </TouchableOpacity>
          </View>
        ) : (
          mortgages.map(renderItem)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center' },
  addBtn: {
    backgroundColor: '#0284c7',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: { padding: 16 },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#0284c7' },
  itemSubtitle: { fontSize: 14, fontWeight: '700', color: '#dc2626', marginTop: 4 },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemFooterText: { fontSize: 12, color: '#64748b' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6 },
  createFirstBtn: { marginTop: 16, backgroundColor: '#0284c7', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  createFirstBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, color: '#ef4444' },
  errorSubtitle: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
