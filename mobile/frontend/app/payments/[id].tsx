import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getPaymentById, PaymentDetailResponse } from '@/src/services/paymentService';
import { StatusBadge } from '@/src/components/StatusBadge';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentDetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayment = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await getPaymentById(id);
      if (res && res.success) {
        setPayment(res.data);
      } else {
        setError('Failed to load payment details');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading payment...</Text>
      </View>
    );
  }

  if (error || !payment) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Payment Not Found</Text>
        <Text style={styles.errorSubtitle}>{error || 'Unable to load payment.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
  customerId: tenantIdRaw,
  propertyId: propertyIdRaw,
  tenancyId: tenancyIdRaw,
  amount,
  paidAmount,
  remainingAmount,
  dueDate,
  paidDate,
  billingMonth,
  billingYear,
  status,
  paymentMethod,
  reference,
  notes,
  customer,
  property,
  tenancy,
} = payment ?? {};

  const getDisplayValue = (value: any, fallback = 'N/A') => {
    if (value && typeof value === 'object') {
      return value.fullName || value.name || value.propertyName || value.reference || value._id || value.id || fallback;
    }
    return value || fallback;
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Payment Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Tenant</Text>
              <Text style={styles.value}>{getDisplayValue(customer || tenantIdRaw)}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Property</Text>
              <Text style={styles.value}>{getDisplayValue(property || propertyIdRaw)}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Tenancy</Text>
              <Text style={styles.value}>{getDisplayValue(tenancy || tenancyIdRaw)}</Text>
            </View>
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Billing Period</Text>
            <Text style={styles.value}>{billingMonth}/{billingYear}</Text>
          </View>
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Amount Due</Text>
            <Text style={styles.value}>{formatCurrencyGBP(amount)}</Text>
          </View>
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Paid Amount</Text>
            <Text style={styles.value}>{formatCurrencyGBP(paidAmount)}</Text>
          </View>
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Remaining</Text>
            <Text style={styles.value}>{formatCurrencyGBP(remainingAmount)}</Text>
          </View>
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Due Date</Text>
            <Text style={styles.value}>{formatDateUK(dueDate)}</Text>
          </View>
          {paidDate ? (
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Paid Date</Text>
              <Text style={styles.value}>{formatDateUK(paidDate)}</Text>
            </View>
          ) : null}
          <View style={styles.rowSpaceBetween}>
            <Text style={styles.boldLabel}>Status</Text>
            <StatusBadge status={status} />
          </View>
          {paymentMethod ? (
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Method</Text>
              <Text style={styles.value}>{paymentMethod}</Text>
            </View>
          ) : null}
          {reference ? (
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Reference</Text>
              <Text style={styles.value}>{reference}</Text>
            </View>
          ) : null}
          {notes ? (
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}
        </View>
        {remainingAmount > 0 && (
          <TouchableOpacity style={styles.recordBtn} onPress={() => router.push(`/payments/record/${payment._id}` as any)}>
            <MaterialIcons name="add-circle-outline" size={20} color="#0284c7" />
            <Text style={styles.recordBtnText}>Record Payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerBackBtn: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  boldLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 14, color: '#334155' },
  notesWrap: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#334155' },
  recordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#e0f2fe', marginTop: 8 },
  recordBtnText: { marginLeft: 6, color: '#0284c7', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  backBtn: { backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
