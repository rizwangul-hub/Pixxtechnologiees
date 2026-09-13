// app/components/ReportCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props<T> {
  item: T;
  onPress: (item: T) => void;
  titleExtractor: (item: T) => string;
  subtitleExtractor?: (item: T) => string;
}

export default function ReportCard<T>({ item, onPress, titleExtractor, subtitleExtractor }: Props<T>) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.content}>
        <Text style={styles.title}>{titleExtractor(item)}</Text>
        {subtitleExtractor && <Text style={styles.subtitle}>{subtitleExtractor(item)}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
});
