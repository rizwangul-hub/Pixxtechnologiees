import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMortgageById, deleteMortgage, Mortgage, getMortgagePayments, MortgagePayment } from '@/src/services/mortgageService';

export default function MortgageDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mortgage, setMortgage] = useState<Mortgage | null>(null);
  const [payments, setPayments] = useState<MortgagePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const mortRes = await getMortgageById(id);
      if (mortRes && mortRes.success) setMortgage(mortRes.data);
      const payRes = await getMortgagePayments(id);
      if (payRes && payRes.success) setPayments(payRes.data);
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = async () => {
    Alert.alert('Delete Mortgage', 'Are you sure you want to delete this mortgage? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteMortgage(id as string);
            if (res && res.success) {
              Alert.alert('Deleted', 'Mortgage deleted successfully');
              router.replace('/mortgages' as any);
            } else {
              Alert.alert('Failed', res?.message || 'Deletion failed');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Deletion error');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading mortgage details...</Text>
      </View>
    );
  }

  if (error || !mortgage) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Mortgage Not Found</Text>
        <Text style={styles.errorSubtitle}>{error || 'Unable to load mortgage data.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allocatedProps = mortgage.properties || [];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{mortgage.mortgageReference || mortgage.lenderName || 'Mortgage Detail'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Mortgage Overview */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Mortgage Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Lender</Text>
            <Text style={styles.value}>{mortgage.lenderName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mortgage Type</Text>
            <Text style={styles.value}>{mortgage.mortgageType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Original Loan</Text>
            <Text style={styles.value}>£{Number(mortgage.originalLoanAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding Balance</Text>
            <Text style={[styles.value, { color: '#dc2626', fontWeight: '700' }]}>
              £{Number(mortgage.currentOutstandingBalance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monthly Payment</Text>
            <Text style={styles.value}>£{Number(mortgage.monthlyPayment).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Next Payment Due</Text>
            <Text style={styles.value}>{new Date(mortgage.nextPaymentDate).toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: '#0284c7', fontWeight: '700' }]}>{mortgage.status}</Text>
          </View>
        </View>

        {/* Secured Properties */}
        {allocatedProps.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Secured Properties</Text>
            {allocatedProps.map((p, idx) => {
              const propObj = typeof p.propertyId === 'object' && p.propertyId !== null ? p.propertyId as any : null;
              const propName = propObj?.name || propObj?.propertyName || (typeof p.propertyId === 'string' ? p.propertyId : 'Property');
              const propAddress = propObj?.address ? `${propObj.address}${propObj.city ? `, ${propObj.city}` : ''}` : null;

              return (
                <View key={idx} style={styles.propItem}>
                  <Text style={styles.propTitle}>{propName}</Text>
                  {propAddress && <Text style={styles.propDetail}>{propAddress}</Text>}
                  {p.allocatedAmount !== undefined && (
                    <Text style={styles.propDetail}>
                      Allocated Amount: £{Number(p.allocatedAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </Text>
                  )}
                  {p.notes && <Text style={styles.propDetail}>Notes: {p.notes}</Text>}
                </View>
              );
            })}
          </View>
        ) : mortgage.propertyId ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Secured Property</Text>
            <View style={styles.propItem}>
              <Text style={styles.propTitle}>
                {typeof mortgage.propertyId === 'object'
                  ? (mortgage.propertyId as any).name || (mortgage.propertyId as any).propertyName || 'Property'
                  : String(mortgage.propertyId)}
              </Text>
              {typeof mortgage.propertyId === 'object' && (mortgage.propertyId as any).address ? (
                <Text style={styles.propDetail}>
                  {[(mortgage.propertyId as any).address, (mortgage.propertyId as any).city].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Payments List */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Payments</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded.</Text>
          ) : (
            payments.map((pay) => (
              <View key={pay._id} style={styles.paymentItem}>
                <Text style={styles.paymentDate}>{new Date(pay.paymentDate).toLocaleDateString('en-GB')}</Text>
                <Text style={styles.paymentAmount}>£{Number(pay.totalPayment).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.paymentMethod}>Method: {pay.paymentMethod || 'N/A'}</Text>
              </View>
            ))
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <MaterialIcons name="delete" size={20} color="#dc2626" />
          <Text style={styles.deleteBtnText}>Delete Mortgage</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  label: { fontSize: 13, color: '#64748b' },
  value: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  propItem: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 },
  propTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  propDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  paymentDate: { fontSize: 12, color: '#64748b' },
  paymentAmount: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  paymentMethod: { fontSize: 12, color: '#64748b' },
  emptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginVertical: 6 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    marginTop: 8,
  },
  deleteBtnText: { marginLeft: 6, color: '#dc2626', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, color: '#ef4444' },
  errorSubtitle: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' },
  backBtn: { marginTop: 16, backgroundColor: '#0284c7', minHeight: 44, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
