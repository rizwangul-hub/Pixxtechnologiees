import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getMortgageById, deleteMortgage, Mortgage, getMortgagePayments, MortgagePayment } from '@/src/services/mortgageService';

export default function MortgageDetailScreen() {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{mortgage.mortgageReference || 'Mortgage Detail'}</Text>
        <TouchableOpacity onPress={() => router.push(`/mortgages/edit/${mortgage._id}` as any)} style={styles.headerEditBtn}>
          <MaterialIcons name="edit" size={20} color="#0284c7" />
          <Text style={styles.headerEditText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        {/* Mortgage Overview */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Mortgage Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Lender</Text>
            <Text style={styles.value}>{mortgage.lenderName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Original Loan</Text>
            <Text style={styles.value}>£{Number(mortgage.originalLoanAmount).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding</Text>
            <Text style={styles.value}>£{Number(mortgage.currentOutstandingBalance).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monthly Payment</Text>
            <Text style={styles.value}>£{Number(mortgage.monthlyPayment).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Next Payment Due</Text>
            <Text style={styles.value}>{new Date(mortgage.nextPaymentDate).toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{mortgage.status}</Text>
          </View>
        </View>

        {/* Secured Properties */}
        {allocatedProps.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Secured Properties</Text>
            {allocatedProps.map((p, idx) => (
              <View key={idx} style={styles.propItem}>
                <Text style={styles.propTitle}>Property ID: {p.propertyId}</Text>
                {p.allocatedAmount !== undefined && (
                  <Text style={styles.propDetail}>Allocated Amount: £{Number(p.allocatedAmount).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
                )}
                {p.notes && <Text style={styles.propDetail}>Notes: {p.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Payments List */}
        <View style={styles.card}>
          <View style={styles.paymentHeader}>
            <Text style={styles.sectionHeader}>Payments</Text>
            <TouchableOpacity onPress={() => router.push(`/mortgages/${mortgage._id}/payments/create` as any)}>
              <MaterialIcons name="add" size={24} color="#0284c7" />
            </TouchableOpacity>
          </View>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded.</Text>
          ) : (
            payments.map((pay) => (
              <View key={pay._id} style={styles.paymentItem}>
                <Text style={styles.paymentDate}>{new Date(pay.paymentDate).toLocaleDateString('en-GB')}</Text>
                <Text style={styles.paymentAmount}>£{Number(pay.totalPayment).toLocaleString('en-GB', {minimumFractionDigits: 2})}</Text>
                <Text style={styles.paymentMethod}>Method: {pay.paymentMethod || 'N/A'}</Text>
              </View>
            ))
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color="#ef4444" />
          <Text style={styles.deleteBtnText}>Delete Mortgage</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerBackBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center' },
  headerEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#e0f2fe' },
  headerEditText: { fontSize: 13, fontWeight: '700', color: '#0284c7' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#64748b' },
  value: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  propItem: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4 },
  propTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  propDetail: { fontSize: 12, color: '#64748b' },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  paymentDate: { fontSize: 12, color: '#64748b' },
  paymentAmount: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  paymentMethod: { fontSize: 12, color: '#64748b' },
  emptyText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8 },
  deleteBtnText: { marginLeft: 6, color: '#dc2626', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: '#64748b', marginTop: 6 },
  backBtn: { marginTop: 16, backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
