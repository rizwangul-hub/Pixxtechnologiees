import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { getMortgages, Mortgage } from '@/src/services/mortgageService';
import { MaterialIcons } from '@expo/vector-icons';

export default function MortgageListScreen() {
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
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{mortgage.lenderName || 'Mortgage'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mortgage.mortgageType}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>Outstanding: £{Number(mortgage.currentOutstandingBalance).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mortgages</Text>
        <TouchableOpacity onPress={() => router.push('/mortgages/create' as any)}>
          <MaterialIcons name="add" size={24} color="#0284c7" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        {mortgages.map(renderItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  listContainer: { padding: 16 },
  itemContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  badge: { backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#7c3aed' },
  itemSubtitle: { marginTop: 4, fontSize: 14, color: '#64748b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: '#64748b', marginTop: 6 },
  retryBtn: { marginTop: 16, backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
