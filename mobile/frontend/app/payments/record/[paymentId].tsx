import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPaymentById, recordPayment } from '@/src/services/paymentService';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Picker } from '@react-native-picker/picker';

export default function RecordPaymentScreen() {
  const insets = useSafeAreaInsets();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Online' | 'Other'>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPayment = useCallback(async () => {
    if (!paymentId) return;
    try {
      setError(null);
      const res = await getPaymentById(paymentId);
      if (res && res.success) {
        setPayment(res.data);
        setAmountPaid(String(res.data.remainingAmount ?? ''));
      } else {
        setError('Failed to load payment');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const handleSubmit = async () => {
    if (!payment) return;
    const amountNum = Number(amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    if (payment.remainingAmount != null && amountNum > payment.remainingAmount) {
      Alert.alert('Exceeds remaining', `Maximum amount is ${formatCurrencyGBP(payment.remainingAmount)}`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        amountPaid: amountNum,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      };
      const res = await recordPayment(paymentId, payload);
      if (res && res.success) {
        Alert.alert('Success', 'Payment recorded successfully.');
        router.replace(`/payments/${paymentId}` as any);
      } else {
        Alert.alert('Error', (res && res.message) || 'Failed to record payment');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

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

  const { remainingAmount, dueDate, billingMonth, billingYear, status } = payment;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Record Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Payment Information</Text>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Billing Period</Text>
              <Text style={styles.value}>{billingMonth}/{billingYear}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Due Date</Text>
              <Text style={styles.value}>{formatDateUK(dueDate)}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Remaining Amount</Text>
              <Text style={[styles.value, { color: '#0284c7', fontWeight: '700' }]}>{formatCurrencyGBP(remainingAmount)}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Status</Text>
              <StatusBadge status={status} />
            </View>

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Amount to Pay (£) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={setAmountPaid}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={paymentMethod} onValueChange={value => setPaymentMethod(value as any)}>
                <Picker.Item label="Cash" value="Cash" />
                <Picker.Item label="Bank Transfer" value="Bank Transfer" />
                <Picker.Item label="Online" value="Online" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Reference (optional)</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="Reference / Transaction ID"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any payment notes..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Confirm & Save Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  boldLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 14, color: '#334155' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },
  inputLabel: { marginTop: 12, fontSize: 13, color: '#334155', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#fff',
    minHeight: 46,
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#0284c7',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  backBtn: { backgroundColor: '#0284c7', minHeight: 44, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});

