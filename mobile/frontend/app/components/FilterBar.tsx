// app/components/FilterBar.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { ReportFilterParams } from '../../src/services/reportService';
import { formatDateUK } from '../../src/utils/formatters';

interface Props {
  onApply: (filters: ReportFilterParams) => void;
}

export default function FilterBar({ onApply }: Props) {
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const applyFilters = () => {
    const params: ReportFilterParams = {};
    if (fromDate) params.fromDate = fromDate.toISOString().split('T')[0];
    if (toDate) params.toDate = toDate.toISOString().split('T')[0];
    onApply(params);
  };

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    onApply({});
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFrom(true)}>
          <MaterialIcons name="event" size={16} color="#0284c7" />
          <Text style={styles.dateBtnText}>
            {fromDate ? formatDateUK(fromDate.toISOString()) : 'From'}
          </Text>
        </TouchableOpacity>

        {showFrom && (
          <DateTimePicker
            value={fromDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setShowFrom(false);
              if (selected) setFromDate(selected);
            }}
          />
        )}

        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTo(true)}>
          <MaterialIcons name="event" size={16} color="#0284c7" />
          <Text style={styles.dateBtnText}>
            {toDate ? formatDateUK(toDate.toISOString()) : 'To'}
          </Text>
        </TouchableOpacity>

        {showTo && (
          <DateTimePicker
            value={toDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setShowTo(false);
              if (selected) setToDate(selected);
            }}
          />
        )}

        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>

        {(fromDate || toDate) && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <MaterialIcons name="close" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dateBtnText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
});
