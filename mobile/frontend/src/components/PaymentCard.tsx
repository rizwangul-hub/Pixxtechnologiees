import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';

/**
 * Props for a payment card.
 */
export interface PaymentCardProps {
  payment: {
    _id: string;
    customerId?: any; // tenant object
    propertyId?: any; // property object
    tenancyId?: any; // tenancy object
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    billingMonth: number;
    billingYear: number;
    status: string;
  };
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const router = useRouter();
  const billingPeriod = `${payment.billingMonth}/${payment.billingYear}`;
  const tenantName = payment.customerId?.fullName || payment.customerId?.name || 'Tenant';
  const propertyName = payment.propertyId?.name || 'Property';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/payments/${payment._id}` as any)}
    >
      <View style={styles.row}>
        <Text style={styles.title}>{tenantName}</Text>
        <StatusBadge status={payment.status as any} />
      </View>
      <Text style={styles.sub}>{propertyName}</Text>
      <Text style={styles.sub}>Billing: {billingPeriod}</Text>
      <Text style={styles.amount}>Due: {formatCurrencyGBP(payment.amount)}</Text>
      <Text style={styles.amount}>Paid: {formatCurrencyGBP(payment.paidAmount)}</Text>
      <Text style={styles.amount}>Remaining: {formatCurrencyGBP(payment.remainingAmount)}</Text>
      <Text style={styles.sub}>Due Date: {formatDateUK(payment.dueDate)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  sub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginTop: 4,
  },
});
