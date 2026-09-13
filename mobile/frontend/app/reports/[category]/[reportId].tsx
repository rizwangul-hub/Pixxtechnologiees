// app/reports/[category]/[reportId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ExportButtonGroup from '../../components/ExportButtonGroup';
import * as reportService from '../../../src/services/reportService';
import { formatCurrencyGBP, formatDateUK } from '../../../src/utils/formatters';

type Category = 'property' | 'tenant' | 'payments' | 'expenses' | 'mortgage' | 'compliance';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { category, reportId } = useLocalSearchParams<{ category: Category; reportId: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!category) return;
    try {
      setLoading(true);
      setError(null);
      let resp: any = null;
      switch (category) {
        case 'property':
          resp = await reportService.getPropertyReport(reportId);
          break;
        case 'tenant':
          resp = await reportService.getTenantStatement(reportId);
          break;
        case 'payments':
          resp = await reportService.getPaymentReport({ propertyId: reportId });
          break;
        case 'expenses':
          resp = await reportService.getExpenseReport({ propertyId: reportId });
          break;
        case 'mortgage':
          resp = await reportService.getMortgageReport({ mortgageId: reportId });
          break;
        case 'compliance':
          resp = await reportService.getExpiringSoonDocuments();
          break;
        default:
          resp = null;
      }
      setDetail(resp?.data?.data ?? resp?.data ?? {});
    } catch (e: any) {
      console.error('Failed to load report detail', e);
      setError(e?.message || 'Error loading report detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [category, reportId]);

  const downloadMap: Record<Category, (format: 'pdf' | 'word' | 'excel') => Promise<any>> = {
    property: (format) => reportService.downloadPropertyReport(reportId, format),
    tenant: (format) => reportService.downloadTenantStatement(reportId, format),
    payments: (format) => reportService.downloadPaymentReport(format),
    expenses: (format) => reportService.downloadExpenseReport(format),
    mortgage: (format) => reportService.downloadMortgageReport(format),
    compliance: (format) => reportService.downloadComplianceReport(format),
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Record Detail</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Loading record details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color="#ef4444" />
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardCategory}>Category: {String(category).toUpperCase()}</Text>
              <Text style={styles.cardTitle}>Reference: {reportId}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Record Information</Text>
              {Object.entries(detail || {})
                .filter(([k, v]) => typeof v !== 'object' && !k.startsWith('_'))
                .slice(0, 10)
                .map(([k, v], idx) => (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.infoKey}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                    <Text style={styles.infoValue}>
                      {String(k).toLowerCase().includes('amount') || String(k).toLowerCase().includes('rent')
                        ? formatCurrencyGBP(v as any)
                        : String(k).toLowerCase().includes('date')
                        ? formatDateUK(v as any)
                        : String(v)}
                    </Text>
                  </View>
                ))}
            </View>

            <ExportButtonGroup
              download={downloadMap[category as Category]}
              filename={`${category}-${reportId}`}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardCategory: { fontSize: 12, fontWeight: '700', color: '#0284c7', textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoKey: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  errorBox: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 10, borderColor: '#fecaca', borderWidth: 1 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginTop: 8 },
  errorMsg: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 14, backgroundColor: '#0284c7', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
