// app/documents/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getExpiringSoonDocuments, getExpiredDocuments, TenantDocument } from '@/src/services/documentService';
import { formatDateUK } from '@/src/utils/formatters';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const [expiringRes, expiredRes] = await Promise.allSettled([
        getExpiringSoonDocuments(),
        getExpiredDocuments(),
      ]);

      const expiringList = expiringRes.status === 'fulfilled' && expiringRes.value?.data ? expiringRes.value.data : [];
      const expiredList = expiredRes.status === 'fulfilled' && expiredRes.value?.data ? expiredRes.value.data : [];

      const combinedMap = new Map();
      [...expiredList, ...expiringList].forEach((doc) => {
        if (doc && doc._id) combinedMap.set(doc._id, doc);
      });

      setDocuments(Array.from(combinedMap.values()));
    } catch (e: any) {
      console.error('Failed to load documents:', e);
      setError(e?.response?.data?.message || e?.message || 'Unable to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const expiredCount = documents.filter((d) => d.status === 'Expired').length;
  const expiringCount = documents.filter((d) => d.status === 'Expiring Soon').length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Documents & Compliance</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
      >
        {/* KPI Banner */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: '#fecaca' }]}>
            <Text style={styles.kpiLabel}>Expired</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{expiredCount}</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#fde68a' }]}>
            <Text style={styles.kpiLabel}>Expiring Soon</Text>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>{expiringCount}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Loading compliance documents...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={44} color="#ef4444" />
            <Text style={styles.errorTitle}>Error Loading Documents</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDocuments}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="verified-user" size={48} color="#059669" />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySubtitle}>No expiring or expired tenant documents requiring attention.</Text>
          </View>
        ) : (
          documents.map((doc, index) => {
            const docName = doc.documentName || 'Document';
            const tenant = doc.tenantName || 'Tenant';
            const prop = doc.propertyName || 'Property';
            const expiryStr = doc.expiryDate ? formatDateUK(doc.expiryDate) : 'No Expiry Date';
            const status = doc.status || 'Expiring Soon';

            const badgeColor =
              status === 'Expired' ? '#fee2e2' : status === 'Expiring Soon' ? '#fef3c7' : '#ecfdf5';
            const textColor =
              status === 'Expired' ? '#dc2626' : status === 'Expiring Soon' ? '#d97706' : '#059669';

            return (
              <View key={doc._id || index} style={styles.docCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{docName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                    <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>Tenant: {tenant}</Text>
                <Text style={styles.cardSub}>Property: {prop}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>
                    Expiry: <Text style={{ fontWeight: '600', color: '#1e293b' }}>{expiryStr}</Text>
                  </Text>
                  {doc.daysRemaining !== undefined && doc.daysRemaining !== null ? (
                    <Text style={[styles.daysText, { color: doc.daysRemaining < 0 ? '#dc2626' : '#d97706' }]}>
                      {doc.daysRemaining < 0 ? `${Math.abs(doc.daysRemaining)} days overdue` : `${doc.daysRemaining} days left`}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
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
  refreshBtn: { padding: 6 },
  content: { padding: 16, paddingBottom: 40 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  kpiLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorBox: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 12, borderColor: '#fecaca', borderWidth: 1, marginTop: 20 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginTop: 8 },
  errorMsg: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 14, backgroundColor: '#0284c7', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyBox: { alignItems: 'center', padding: 36, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#059669', marginTop: 10 },
  emptySubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  docCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardDate: { fontSize: 12, color: '#64748b' },
  daysText: { fontSize: 12, fontWeight: '700' },
});
