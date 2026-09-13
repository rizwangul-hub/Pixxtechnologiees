import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { exportFile } from '../utils/exportUtil';
import { ReportFilterParams } from '../../src/services/reportService';

interface Props {
  download: (format: 'pdf' | 'word' | 'excel', params?: ReportFilterParams) => Promise<any>;
  params?: ReportFilterParams;
  filename: string;
}

export default function ExportButtonGroup({ download, params, filename }: Props) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePress = async (format: 'pdf' | 'word' | 'excel') => {
    if (isMounted.current) {
      setLoading((previous) => ({ ...previous, [format]: true }));
    }

    try {
      const result = await download(format, params);
      const buffer: ArrayBuffer = result?.data ?? result;
      if (!buffer || (buffer as any).byteLength === 0) {
        Alert.alert('Export Notice', `No ${format.toUpperCase()} export data available for this report.`);
        return;
      }
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      const extMap: Record<string, string> = { pdf: 'pdf', word: 'docx', excel: 'xlsx' };
      await exportFile(buffer, `${filename}.${extMap[format]}`, mimeMap[format]);
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Unavailable',
        error?.response?.data?.message || `Unable to export ${format.toUpperCase()} report from server. Please try another format.`
      );
    } finally {
      if (isMounted.current) {
        setLoading((previous) => ({ ...previous, [format]: false }));
      }
    }
  };

  return (
    <View style={styles.container}>
      {(['pdf', 'word', 'excel'] as const).map((format) => (
        <TouchableOpacity
          key={format}
          style={styles.button}
          onPress={() => handlePress(format)}
          disabled={!!loading[format]}
        >
          {loading[format] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons
              name={format === 'pdf' ? 'picture-as-pdf' : format === 'word' ? 'description' : 'grid-on'}
              size={24}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
});
