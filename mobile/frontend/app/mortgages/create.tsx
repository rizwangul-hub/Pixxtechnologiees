import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMortgage, Mortgage } from '@/src/services/mortgageService';

export default function MortgageCreateScreen() {
  const insets = useSafeAreaInsets();
  const [lenderName, setLenderName] = useState('');
  const [originalLoanAmount, setOriginalLoanAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState(''); // expected yyyy-mm-dd
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [mortgageType, setMortgageType] = useState('Individual Property');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!lenderName || !originalLoanAmount || !monthlyPayment || !startDate || !nextPaymentDate) {
      Alert.alert('Validation', 'Please fill all required fields marked with *');
      return;
    }
    const payload = {
      lenderName,
      originalLoanAmount: Number(originalLoanAmount),
      monthlyPayment: Number(monthlyPayment),
      startDate,
      nextPaymentDate,
      mortgageType,
    } as any;
    try {
      setLoading(true);
      const res = await createMortgage(payload);
      if (res && res.success) {
        Alert.alert('Success', 'Mortgage created successfully');
        router.replace('/mortgages' as any);
      } else {
        Alert.alert('Error', res?.message || 'Creation failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Mortgage</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={styles.label}>Lender Name *</Text>
            <TextInput
              style={styles.input}
              value={lenderName}
              onChangeText={setLenderName}
              placeholder="e.g. Barclays, Nationwide"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Original Loan Amount (£) *</Text>
            <TextInput
              style={styles.input}
              value={originalLoanAmount}
              onChangeText={setOriginalLoanAmount}
              keyboardType="numeric"
              placeholder="e.g. 250000"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Monthly Payment (£) *</Text>
            <TextInput
              style={styles.input}
              value={monthlyPayment}
              onChangeText={setMonthlyPayment}
              keyboardType="numeric"
              placeholder="e.g. 1500"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-01-01"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Next Payment Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={nextPaymentDate}
              onChangeText={setNextPaymentDate}
              placeholder="2024-02-01"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Mortgage Type</Text>
            <TextInput
              style={styles.input}
              value={mortgageType}
              onChangeText={setMortgageType}
              placeholder="Individual Property or Collective / Group"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Create Mortgage</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  container: { flexGrow: 1, padding: 16 },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 13, color: '#334155', fontWeight: '600', marginTop: 12 },
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
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#0284c7',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#94a3b8' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

