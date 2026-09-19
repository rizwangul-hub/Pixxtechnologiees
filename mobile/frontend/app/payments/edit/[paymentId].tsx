import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPaymentById, updatePayment, resetPayment, deletePayment } from '@/src/services/paymentService';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Picker } from '@react-native-picker/picker';

export default function EditPaymentScreen() {
  const insets = useSafeAreaInsets();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Online' | 'Other'>('Bank Transfer');
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
        setPaidAmount(String(res.data.paidAmount ?? 0));
        setPaidDate(String(res.data.paidDate || res.data.dueDate || '').slice(0, 10));
        if (res.data.paymentMethod) {
          setPaymentMethod(res.data.paymentMethod as any);
        }
        setReference(res.data.reference || '');
        setNotes(res.data.notes || '');
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

  const handleSave = async () => {
    if (!payment) return;
    const amountNum = Number(paidAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      Alert.alert('Invalid amount', 'Please enter 0 or a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        paidAmount: amountNum,
        paidDate: paidDate || undefined,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
      };

      const res = await updatePayment(paymentId, payload);
      if (res && res.success) {
        Alert.alert('Success', 'Payment updated successfully.');
        router.replace(`/payments/${paymentId}` as any);
      } else {
        Alert.alert('Error', (res && res.message) || 'Failed to update payment');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Payment to Unpaid',
      'Are you sure you want to reset this payment back to unpaid?\n\nThis will clear the received amount and restore the full remaining rent balance. Use this if the payment was recorded by mistake or is duplicate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Unpaid',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await resetPayment(paymentId);
              if (res && res.success) {
                Alert.alert('Payment Reset', 'Payment has been reset back to unpaid status.');
                router.replace(`/payments/${paymentId}` as any);
              } else {
                Alert.alert('Error', res?.message || 'Failed to reset payment');
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Network error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Payment Record',
      'Are you sure you want to permanently delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await deletePayment(paymentId);
              if (res && res.success) {
                Alert.alert('Deleted', 'Payment record deleted successfully.');
                router.replace('/(tabs)/payments' as any);
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete payment');
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Network error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
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

  const tenantName = payment.customerId?.fullName || payment.customerId?.name || 'Tenant';
  const propertyName = payment.propertyId?.propertyName || payment.propertyId?.name || 'Property';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Edit Received Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 50 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Payment Summary</Text>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Tenant</Text>
              <Text style={styles.value}>{tenantName}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Property</Text>
              <Text style={styles.value}>{propertyName}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Billing Period</Text>
              <Text style={styles.value}>{payment.billingMonth}/{payment.billingYear}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Total Rent Obligation</Text>
              <Text style={[styles.value, { fontWeight: '700' }]}>{formatCurrencyGBP(payment.amount)}</Text>
            </View>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.boldLabel}>Current Status</Text>
              <StatusBadge status={payment.status} />
            </View>

            <View style={styles.divider} />

            {/* Editable fields */}
            <Text style={styles.inputLabel}>Received Amount (£) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={paidAmount}
              onChangeText={setPaidAmount}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.inputHint}>Enter 0 or tap 'Reset to Unpaid' to revert wrong payment.</Text>

            <Text style={styles.inputLabel}>Payment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={paidDate}
              onChangeText={setPaidDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val)}
                style={styles.picker}
              >
                <Picker.Item label="Bank Transfer" value="Bank Transfer" />
                <Picker.Item label="Cash" value="Cash" />
                <Picker.Item label="Online" value="Online" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Reference / Transaction ID</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="e.g. Bank statement or receipt ref"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Notes / Correction Reason</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Corrected typo in amount from bank"
              placeholderTextColor="#94a3b8"
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.disabledBtn]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Rollback & Delete Actions */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleReset}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <MaterialIcons name="restore" size={18} color="#d97706" />
                <Text style={styles.resetBtnText}>Reset to Unpaid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <MaterialIcons name="delete-outline" size={18} color="#dc2626" />
                <Text style={styles.deleteBtnText}>Delete Record</Text>
              </TouchableOpacity>
            </View>
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
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4, alignItems: 'center' },
  boldLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 14, color: '#334155' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 12, marginBottom: 6 },
  inputHint: { fontSize: 11, color: '#64748b', marginTop: 4, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc', overflow: 'hidden' },
  picker: { height: 50, color: '#0f172a' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    marginTop: 20,
    gap: 8,
  },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.6 },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
  },
  resetBtnText: { color: '#d97706', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  deleteBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  errorSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  backBtn: { backgroundColor: '#0284c7', minHeight: 44, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
