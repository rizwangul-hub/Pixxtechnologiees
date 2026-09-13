import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { createMortgage, Mortgage } from '@/src/services/mortgageService';

export default function MortgageCreateScreen() {
  const [lenderName, setLenderName] = useState('');
  const [originalLoanAmount, setOriginalLoanAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState(''); // expected yyyy-mm-dd
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [mortgageType, setMortgageType] = useState('Individual Property');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!lenderName || !originalLoanAmount || !monthlyPayment || !startDate || !nextPaymentDate) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }
    const payload = {
      lenderName,
      originalLoanAmount: Number(originalLoanAmount),
      monthlyPayment: Number(monthlyPayment),
      startDate,
      nextPaymentDate,
      mortgageType,
    } as any; // additional optional fields omitted
    try {
      setLoading(true);
      const res = await createMortgage(payload);
      if (res && res.success) {
        Alert.alert('Success', 'Mortgage created');
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Mortgage</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Lender Name *</Text>
        <TextInput style={styles.input} value={lenderName} onChangeText={setLenderName} placeholder="Lender" />
        <Text style={styles.label}>Original Loan Amount *</Text>
        <TextInput style={styles.input} value={originalLoanAmount} onChangeText={setOriginalLoanAmount} keyboardType="numeric" placeholder="e.g., 250000" />
        <Text style={styles.label}>Monthly Payment *</Text>
        <TextInput style={styles.input} value={monthlyPayment} onChangeText={setMonthlyPayment} keyboardType="numeric" placeholder="e.g., 1500" />
        <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2023-01-01" />
        <Text style={styles.label}>Next Payment Date (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={nextPaymentDate} onChangeText={setNextPaymentDate} placeholder="2023-02-01" />
        <Text style={styles.label}>Mortgage Type</Text>
        <TextInput style={styles.input} value={mortgageType} onChangeText={setMortgageType} placeholder="Individual Property or Collective / Group" />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 6 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 13, color: '#64748b', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8, marginTop: 4 },
  submitBtn: { marginTop: 20, backgroundColor: '#0284c7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
