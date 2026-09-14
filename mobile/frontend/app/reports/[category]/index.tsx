// app/reports/[category]/index.tsx
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
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterBar from '../../components/FilterBar';
import ExportButtonGroup from '../../components/ExportButtonGroup';
import * as reportService from '../../../src/services/reportService';
import * as tenantService from '../../../src/services/tenantService';
import { ReportFilterParams } from '../../../src/services/reportService';
import { formatCurrencyGBP, formatDateUK } from '../../../src/utils/formatters';
import { StatusBadge } from '../../../src/components/StatusBadge';

type Category = 'property' | 'tenant' | 'payments' | 'expenses' | 'mortgage' | 'compliance';

const categoryTitles: Record<Category, string> = {
  property: 'Property Report',
  tenant: 'Tenant Report',
  payments: 'Payment & Rent Report',
  expenses: 'Expense Report',
  mortgage: 'Mortgage Report',
  compliance: 'Compliance Report',
};

export default function ReportCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: Category }>();
  const catKey = (category as Category) || 'property';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState<ReportFilterParams>({});

  const downloadMap: Record<Category, (format: 'pdf' | 'word' | 'excel', params?: ReportFilterParams) => Promise<any>> = {
    property: (format, params) => reportService.downloadPropertyReport('all', format, params),
    tenant: (format, params) => reportService.downloadTenantStatement('all', format, params),
    payments: (format, params) => reportService.downloadPaymentReport(format, params),
    expenses: (format, params) => reportService.downloadExpenseReport(format, params),
    mortgage: (format, params) => reportService.downloadMortgageReport(format, params),
    compliance: (format, params) => reportService.downloadComplianceReport(format, params),
  };

  const fetchReport = useCallback(async () => {
    try {
      setError(null);
      let res: any = null;

      switch (catKey) {
        case 'property':
          res = await reportService.getPropertyReport('all', filters);
          break;
        case 'tenant':
          res = await tenantService.getTenants(filters);
          break;
        case 'payments':
          res = await reportService.getPaymentReport(filters);
          break;
        case 'expenses':
          res = await reportService.getExpenseReport(filters);
          break;
        case 'mortgage':
          res = await reportService.getMortgageReport(filters);
          break;
        case 'compliance':
          res = await reportService.getExpiringSoonDocuments(filters);
          break;
        default:
          res = null;
      }

      const data = res?.data?.data ?? res?.data ?? null;
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load report data:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [catKey, filters]);

  useEffect(() => {
    setLoading(true);
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const renderSummary = () => {
    if (!reportData) return null;
    const summary = reportData.summary || {};

    switch (catKey) {
      case 'property': {
        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Properties</Text>
              <Text style={styles.summaryValue}>{summary.totalProperties ?? 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Occupied</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.occupiedUnits ?? 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Available</Text>
              <Text style={[styles.summaryValue, { color: '#0284c7' }]}>{summary.availableUnits ?? 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Rent</Text>
              <Text style={styles.summaryValue}>{summary.totalRentFormatted ?? formatCurrencyGBP(summary.totalRent)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.totalPaidFormatted ?? formatCurrencyGBP(summary.totalPaid)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{summary.outstandingFormatted ?? formatCurrencyGBP(summary.outstanding)}</Text>
            </View>
          </View>
        );
      }
      case 'tenant': {
        const tenants = Array.isArray(reportData) ? reportData : reportData?.data ?? [];
        const totalTenants = tenants.length;
        const activeTenants = tenants.filter((t: any) => t.status === 'Active' || !t.status).length;
        const totalRent = tenants.reduce((acc: number, t: any) => acc + (t.rent || t.monthlyRent || 0), 0);
        const totalBalance = tenants.reduce((acc: number, t: any) => acc + (t.balance || 0), 0);
        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Tenants</Text>
              <Text style={styles.summaryValue}>{totalTenants}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Active Tenants</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{activeTenants}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Rent</Text>
              <Text style={styles.summaryValue}>{formatCurrencyGBP(totalRent)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: totalBalance > 0 ? '#dc2626' : '#059669' }]}>{formatCurrencyGBP(totalBalance)}</Text>
            </View>
          </View>
        );
      }
      case 'payments': {
        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Records</Text>
              <Text style={styles.summaryValue}>{summary.totalRecords ?? 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Due</Text>
              <Text style={styles.summaryValue}>{formatCurrencyGBP(summary.totalExpected)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{formatCurrencyGBP(summary.totalPaid)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{formatCurrencyGBP(summary.totalRemaining)}</Text>
            </View>
          </View>
        );
      }
      case 'expenses': {
        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Property Expenses</Text>
              <Text style={styles.summaryValue}>{formatCurrencyGBP(summary.totalPropertyExpenses)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Agent Expenses</Text>
              <Text style={styles.summaryValue}>{formatCurrencyGBP(summary.totalAgentExpenses)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{formatCurrencyGBP(summary.grandTotalExpenses)}</Text>
            </View>
          </View>
        );
      }
      case 'mortgage': {
        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Original Loan</Text>
              <Text style={styles.summaryValue}>{summary.totalOriginalLoanFormatted ?? formatCurrencyGBP(summary.totalOriginalLoan)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{summary.totalOutstandingFormatted ?? formatCurrencyGBP(summary.totalOutstanding)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Monthly Payments</Text>
              <Text style={styles.summaryValue}>{summary.totalMonthlyPaymentsFormatted ?? formatCurrencyGBP(summary.totalMonthlyPayments)}</Text>
            </View>
          </View>
        );
      }
      case 'compliance': {
        const docs = Array.isArray(reportData) ? reportData : (reportData?.data || []);
        const totalDocs = docs.length;
        const expiringCount = docs.filter((d: any) => d.status === 'Expiring Soon').length;
        const expiredCount = docs.filter((d: any) => d.status === 'Expired').length;
        const validCount = docs.filter((d: any) => d.status === 'Valid' || d.status === 'No Expiry Date').length;

        return (
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Documents</Text>
              <Text style={styles.summaryValue}>{totalDocs}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Valid</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>{validCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Expiring Soon</Text>
              <Text style={[styles.summaryValue, { color: '#d97706' }]}>{expiringCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Expired</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{expiredCount}</Text>
            </View>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const getRows = () => {
    if (!reportData) return [];
    switch (catKey) {
      case 'property':
        return reportData.propertiesBreakdown || reportData.properties || reportData.unitsBreakdown || [];
      case 'tenant':
        return Array.isArray(reportData) ? reportData : reportData?.data ?? [];
      case 'payments':
        return reportData.payments || [];
      case 'expenses': {
        const propExp = reportData.propertyExpenses || [];
        const agentExp = reportData.agentExpenses || [];
        return [...propExp, ...agentExp];
      }
      case 'mortgage':
        return reportData.rows || reportData.mortgages || [];
      case 'compliance':
        return Array.isArray(reportData) ? reportData : (reportData.data || []);
      default:
        return [];
    }
  };

  const renderRow = (row: any, index: number) => {
    switch (catKey) {
      case 'property': {
        const name = row.propertyName || row.name || 'Property';
        const type = row.type || 'Residential';
        const address = row.propertyAddress || row.address || '-';
        const landlord = row.landlordName || '-';
        const rent = row.rent ? formatCurrencyGBP(row.rent) : (row.monthlyRent ? formatCurrencyGBP(row.monthlyRent) : '£0.00');
        const status = row.status || (row.isOccupied ? 'Occupied' : 'Available');

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{name}</Text>
              <View style={[styles.miniBadge, { backgroundColor: status === 'Occupied' ? '#ecfdf5' : '#e0f2fe' }]}>
                <Text style={[styles.miniBadgeText, { color: status === 'Occupied' ? '#059669' : '#0284c7' }]}>{status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Type: {type}</Text>
            <Text style={styles.cardSubtitle}>Address: {address}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Landlord: <Text style={styles.cardBold}>{landlord}</Text></Text>
              <Text style={styles.cardAmount}>{rent}/mo</Text>
            </View>
          </View>
        );
      }
      case 'tenant': {
        const name = row.tenantName || row.name || row.fullName || 'Tenant';
        const phone = row.phone || '-';
        const email = row.email || '-';
        const prop = row.propertyName || '-';
        const rent = row.rent ? formatCurrencyGBP(row.rent) : '£0.00';
        const status = row.status || 'Active';

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{name}</Text>
              <View style={[styles.miniBadge, { backgroundColor: status === 'Active' ? '#ecfdf5' : '#fef2f2' }]}>
                <Text style={[styles.miniBadgeText, { color: status === 'Active' ? '#059669' : '#dc2626' }]}>{status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Phone: {phone} • Email: {email}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Property: <Text style={styles.cardBold}>{prop}</Text></Text>
              <Text style={styles.cardAmount}>{rent}</Text>
            </View>
          </View>
        );
      }
      case 'payments': {
        const tenant = row.tenantName || 'Tenant';
        const prop = row.propertyName || 'Property';
        const date = formatDateUK(row.dueDate) || row.billingMonth || '-';
        const amount = formatCurrencyGBP(row.amount);
        const paid = formatCurrencyGBP(row.paidAmount);
        const remaining = formatCurrencyGBP(row.remainingAmount ?? (row.amount - (row.paidAmount || 0)));
        const method = row.paymentMethod || 'Cash';

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{tenant}</Text>
              <StatusBadge status={row.status || 'Pending'} />
            </View>
            <Text style={styles.cardSubtitle}>Property: {prop}</Text>
            <Text style={styles.cardSubtitle}>Due Date: {date} • Method: {method}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Paid: <Text style={[styles.cardBold, { color: '#059669' }]}>{paid}</Text> / Rem: <Text style={[styles.cardBold, { color: '#dc2626' }]}>{remaining}</Text></Text>
              <Text style={styles.cardAmount}>{amount}</Text>
            </View>
          </View>
        );
      }
      case 'expenses': {
        const date = formatDateUK(row.date) || '-';
        const prop = row.propertyName || 'Property';
        const category = row.category || 'General';
        const desc = row.description || '-';
        const amount = formatCurrencyGBP(row.amount);
        const status = row.status || 'Recorded';

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{category}</Text>
              <View style={[styles.miniBadge, { backgroundColor: '#f1f5f9' }]}>
                <Text style={[styles.miniBadgeText, { color: '#475569' }]}>{status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Date: {date} • Property: {prop}</Text>
            <Text style={styles.cardSubtitle}>Description: {desc}</Text>
            <View style={styles.rowBetween}>
              <View />
              <Text style={[styles.cardAmount, { color: '#dc2626' }]}>{amount}</Text>
            </View>
          </View>
        );
      }
      case 'mortgage': {
        const facility = row.mortgageAccountNumber || row.mortgageReference || row.facilityId || 'Facility';
        const lender = row.lenderName || 'Lender';
        const type = row.mortgageType || 'Mortgage';
        const original = row.originalLoanAmountFormatted ?? formatCurrencyGBP(row.originalLoanAmount);
        const outstanding = row.currentOutstandingBalanceFormatted ?? formatCurrencyGBP(row.currentOutstandingBalance);
        const payment = row.monthlyPaymentFormatted ?? formatCurrencyGBP(row.monthlyPayment);
        const secProps = Array.isArray(row.securedProperties) ? row.securedProperties.join(', ') : (row.securedProperties || '-');

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{lender}</Text>
              <View style={[styles.miniBadge, { backgroundColor: '#f5f3ff' }]}>
                <Text style={[styles.miniBadgeText, { color: '#7c3aed' }]}>{type}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Facility Ref: {facility}</Text>
            <Text style={styles.cardSubtitle}>Secured: {secProps}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Outstanding: <Text style={[styles.cardBold, { color: '#dc2626' }]}>{outstanding}</Text></Text>
              <Text style={styles.cardAmount}>Orig: {original}</Text>
            </View>
            <Text style={[styles.cardSubtitle, { marginTop: 4 }]}>Monthly Payment: {payment}</Text>
          </View>
        );
      }
      case 'compliance': {
        const docName = row.documentName || 'Document';
        const tenant = row.tenantName || 'Tenant';
        const prop = row.propertyName || '-';
        const expiry = row.expiryDate ? formatDateUK(row.expiryDate) : 'No Expiry Date';
        const status = row.status || (row.expiryDate ? 'Valid' : 'No Expiry Date');

        const badgeColor =
          status === 'Expired' ? '#fee2e2' : status === 'Expiring Soon' ? '#fef3c7' : '#ecfdf5';
        const textColor =
          status === 'Expired' ? '#dc2626' : status === 'Expiring Soon' ? '#d97706' : '#059669';

        return (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.cardTitle}>{docName}</Text>
              <View style={[styles.miniBadge, { backgroundColor: badgeColor }]}>
                <Text style={[styles.miniBadgeText, { color: textColor }]}>{status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Tenant: {tenant} • Property: {prop}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Expiry Date: <Text style={styles.cardBold}>{expiry}</Text></Text>
            </View>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const rows = getRows();

  return (
    <View style={styles.screen}>
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{categoryTitles[catKey] || 'Report'}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
        showsVerticalScrollIndicator={false}
      >
        <FilterBar onApply={setFilters} />

        <View style={styles.exportSection}>
          <Text style={styles.sectionHeading}>Export Report</Text>
          <ExportButtonGroup
            download={downloadMap[catKey]}
            params={filters}
            filename={`${catKey}_report_${Date.now()}`}
          />
        </View>

        {loading && !refreshing && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Generating {categoryTitles[catKey]}...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color="#ef4444" />
            <Text style={styles.errorTitle}>Unable to load report</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            {renderSummary()}

            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>
              Records ({rows.length})
            </Text>

            {rows.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="insert-drive-file" size={44} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No records found</Text>
                <Text style={styles.emptySubtitle}>No matching data found for the selected filters.</Text>
              </View>
            ) : (
              rows.map(renderRow)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  backBtn: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  refreshBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  exportSection: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  dataCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  cardBold: {
    fontWeight: '600',
    color: '#1e293b',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});
