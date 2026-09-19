import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { formatCurrencyGBP, formatDateUK } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

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
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>{tenantName}</Text>
        <StatusBadge status={payment.status as any} />
      </View>
      <Text style={styles.sub} numberOfLines={1}>{propertyName}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Period: {billingPeriod}</Text>
        <Text style={styles.infoText}>Due: {formatDateUK(payment.dueDate)}</Text>
      </View>
      <View style={styles.amountsRow}>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Due</Text>
          <Text style={styles.amountValue}>{formatCurrencyGBP(payment.amount)}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={[styles.amountValue, { color: '#059669' }]}>{formatCurrencyGBP(payment.paidAmount)}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={[styles.amountValue, { color: payment.remainingAmount > 0 ? '#dc2626' : '#059669' }]}>
            {formatCurrencyGBP(payment.remainingAmount)}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.editQuickBtn}
          onPress={() => router.push(`/payments/edit/${payment._id}` as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="edit" size={14} color="#0284c7" />
          <Text style={styles.editQuickText}>Edit</Text>
        </TouchableOpacity>
        <View style={styles.viewDetailLink}>
          <Text style={styles.viewDetailText}>Details</Text>
          <MaterialIcons name="chevron-right" size={16} color="#94a3b8" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
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
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  editQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 4,
  },
  editQuickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

