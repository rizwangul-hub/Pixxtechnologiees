import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Received' | 'Partially Received' | 'Overdue';
}

const statusColors: Record<Props['status'], {bg: string; text: string}> = {
  Pending: {bg: '#fef3c7', text: '#92400e'},
  'Partially Paid': {bg: '#fff3cd', text: '#856404'},
  Paid: {bg: '#d1fae5', text: '#047857'},
  Received: {bg: '#d1fae5', text: '#047857'},
  'Partially Received': {bg: '#fff3cd', text: '#856404'},
  Overdue: {bg: '#fee2e2', text: '#991b1b'},
};

export const StatusBadge: React.FC<Props> = ({status}) => {
  const colors = statusColors[status] || {bg: '#e5e7eb', text: '#374151'};
  return (
    <View style={[styles.badge, {backgroundColor: colors.bg}]}>
      <Text style={[styles.text, {color: colors.text}]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
