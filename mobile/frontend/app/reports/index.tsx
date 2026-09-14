// app/reports/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define categories that have backend support
const reportCategories = [
  { title: 'Property Report', icon: 'home', route: '/reports/property', desc: 'Occupancy, rents, and portfolio status' },
  { title: 'Tenant Report', icon: 'person', route: '/reports/tenant', desc: 'Tenant statements, accounts, and balances' },
  { title: 'Payment / Rent Report', icon: 'payment', route: '/reports/payments', desc: 'Rent collection, due dates, and arrears' },
  { title: 'Expense Report', icon: 'receipt', route: '/reports/expenses', desc: 'Property and operational expenditures' },
  { title: 'Mortgage Report', icon: 'account-balance', route: '/reports/mortgage', desc: 'Loan facilities, balances, and liabilities' },
  { title: 'Compliance Report', icon: 'verified', route: '/reports/compliance', desc: 'Document expiries and certifications' },
];

export default function ReportsHome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subHeader}>Generate and review operational, financial, and compliance reports</Text>
        {reportCategories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => router.push(cat.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name={cat.icon as any} size={24} color="#0284c7" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{cat.title}</Text>
              <Text style={styles.desc}>{cat.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  screenTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center' },
  container: {
    padding: 16,
  },
  subHeader: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  desc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
});
