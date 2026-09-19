import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMortgages, getMortgageSummary, Mortgage, MortgageSummary } from '@/src/services/mortgageService';
import { getLandlordsList } from '@/src/services/landlordService';
import { LandlordBrief } from '@/src/services/propertyService';
import { MaterialIcons } from '@expo/vector-icons';

interface LandlordMortgageGroup {
  landlordId: string;
  landlordName: string;
  landlordLogoUrl?: string;
  mortgages: Mortgage[];
  totalOriginalLoan: number;
  totalOutstanding: number;
  totalMonthlyPayment: number;
  activeCount: number;
  individualCount: number;
  collectiveCount: number;
}

export default function MortgagesTabScreen() {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8;

  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [summary, setSummary] = useState<MortgageSummary | null>(null);
  const [landlords, setLandlords] = useState<LandlordBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'grouped' by landlord or 'flat' list
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Search & Type Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'Individual Property' | 'Collective / Group'>('All');

  const fetchMortgagesData = useCallback(async () => {
    try {
      setError(null);
      const [mRes, sRes, lList] = await Promise.all([
        getMortgages(),
        getMortgageSummary().catch(() => null),
        getLandlordsList().catch(() => []),
      ]);

      if (mRes && mRes.success) {
        setMortgages(mRes.data || []);
      } else if (Array.isArray(mRes)) {
        setMortgages(mRes);
      } else if (mRes && mRes.data) {
        setMortgages(mRes.data);
      } else {
        setError('Failed to load mortgages');
      }

      if (sRes && sRes.success && sRes.data) {
        setSummary(sRes.data);
      }

      if (Array.isArray(lList)) {
        setLandlords(lList);
      }
    } catch (e: any) {
      console.error('Failed to load mortgages:', e);
      setError(e?.response?.data?.message || e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMortgagesData();
    }, [fetchMortgagesData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMortgagesData();
  };

  const filteredMortgages = useMemo(() => {
    return mortgages.filter((m) => {
      if (selectedType !== 'All' && m.mortgageType !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const lender = (m.lenderName || '').toLowerCase();
      const ref = (m.mortgageAccountNumber || '').toLowerCase();
      const mRef = (m.mortgageReference || '').toLowerCase();
      const type = (m.mortgageType || '').toLowerCase();
      const landlordObj = (m.landlordId && typeof m.landlordId === 'object') ? (m.landlordId as any) : null;
      const landlordName = (landlordObj?.fullName || landlordObj?.name || '').toLowerCase();
      const securedNames = (m.properties || [])
        .map((p: any) => (p.propertyId?.name || '').toLowerCase())
        .join(' ');

      return (
        lender.includes(q) ||
        ref.includes(q) ||
        mRef.includes(q) ||
        type.includes(q) ||
        landlordName.includes(q) ||
        securedNames.includes(q)
      );
    });
  }, [mortgages, selectedType, searchQuery]);

  // Group mortgages by landlord (matching web version)
  const groupedByLandlord = useMemo<LandlordMortgageGroup[]>(() => {
    const groupsMap: Record<string, LandlordMortgageGroup> = {};

    filteredMortgages.forEach((m) => {
      const landlordObj = (m.landlordId && typeof m.landlordId === 'object') ? (m.landlordId as any) : null;
      const landlordId = landlordObj
        ? (landlordObj._id || landlordObj.id || 'unassigned').toString()
        : (m.landlordId ? (m.landlordId as any).toString() : 'unassigned');

      let matchedLandlord = landlordObj;
      if (!matchedLandlord && landlords.length > 0) {
        matchedLandlord = landlords.find((l) => (l._id || (l as any).id)?.toString() === landlordId);
      }

      const landlordName =
        matchedLandlord?.fullName ||
        matchedLandlord?.name ||
        (landlordId !== 'unassigned' ? 'Landlord' : 'General Portfolio (Unassigned)');
      const landlordLogoUrl =
        matchedLandlord?.logo?.url || matchedLandlord?.logoUrl || '';

      if (!groupsMap[landlordId]) {
        groupsMap[landlordId] = {
          landlordId,
          landlordName,
          landlordLogoUrl,
          mortgages: [],
          totalOriginalLoan: 0,
          totalOutstanding: 0,
          totalMonthlyPayment: 0,
          activeCount: 0,
          individualCount: 0,
          collectiveCount: 0,
        };
      }

      const group = groupsMap[landlordId];
      group.mortgages.push(m);
      group.totalOriginalLoan += Number(m.originalLoanAmount) || 0;
      group.totalOutstanding += Number(m.currentOutstandingBalance) || 0;
      if (m.status === 'Active') {
        group.totalMonthlyPayment += Number(m.monthlyPayment) || 0;
        group.activeCount += 1;
      }
      if (m.mortgageType === 'Collective / Group') {
        group.collectiveCount += 1;
      } else {
        group.individualCount += 1;
      }
    });

    return Object.values(groupsMap);
  }, [filteredMortgages, landlords]);

  const totalOutstanding = useMemo(() => {
    return mortgages.reduce((sum, m) => sum + (Number(m.currentOutstandingBalance) || 0), 0);
  }, [mortgages]);

  const totalMonthly = useMemo(() => {
    return mortgages
      .filter((m) => m.status === 'Active')
      .reduce((sum, m) => sum + (Number(m.monthlyPayment) || 0), 0);
  }, [mortgages]);

  const renderMortgageCard = (mortgage: Mortgage, showLandlordName = false) => {
    const isCollective = mortgage.mortgageType === 'Collective / Group';
    const securedCount = mortgage.properties?.length || (mortgage.propertyId ? 1 : 0);
    const refDisplay = mortgage.mortgageReference || mortgage.mortgageAccountNumber || '-';

    const landlordObj = (mortgage.landlordId && typeof mortgage.landlordId === 'object')
      ? (mortgage.landlordId as any)
      : null;
    const landlordName = landlordObj?.fullName || landlordObj?.name || 'Landlord';

    return (
      <TouchableOpacity
        key={mortgage._id}
        style={styles.itemContainer}
        onPress={() => router.push(`/mortgages/${mortgage._id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {mortgage.lenderName || 'Mortgage Facility'}
            </Text>
            <Text style={styles.itemRefText} numberOfLines={1}>
              Ref: {refDisplay}
            </Text>
            {showLandlordName && (
              <View style={styles.landlordInlineRow}>
                <MaterialIcons name="person" size={13} color="#64748b" />
                <Text style={styles.landlordInlineText} numberOfLines={1}>
                  {landlordName}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.badge,
              isCollective ? styles.badgeCollective : styles.badgeIndividual,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isCollective ? styles.badgeTextCollective : styles.badgeTextIndividual,
              ]}
            >
              {isCollective ? 'Collective' : 'Individual'}
            </Text>
          </View>
        </View>

        <View style={styles.itemMetricsRow}>
          <View style={styles.itemMetricCol}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={styles.metricValueDebt}>
              £{Number(mortgage.currentOutstandingBalance || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.itemMetricCol}>
            <Text style={styles.metricLabel}>Monthly Payment</Text>
            <Text style={styles.metricValue}>
              £{Number(mortgage.monthlyPayment || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.footerLeft}>
            <MaterialIcons
              name={isCollective ? 'domain' : 'business'}
              size={15}
              color="#64748b"
            />
            <Text style={styles.itemFooterText}>
              {isCollective
                ? `${securedCount} Secured Properties`
                : '1 Secured Property'}
            </Text>
          </View>

          <View style={styles.footerRight}>
            <Text
              style={[
                styles.statusTag,
                mortgage.status === 'Active' ? styles.statusActive : styles.statusOther,
              ]}
            >
              {mortgage.status || 'Active'}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Top Header with Pixxtechnologiees Logo & Branding */}
      <View style={[styles.topHeader, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerBrandWrap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.brandTitle}>Pixxtechnologiees</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {loading ? 'Loading mortgages...' : `${mortgages.length} facilities • £${totalOutstanding.toLocaleString('en-GB', { maximumFractionDigits: 0 })} debt`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => router.push('/mortgages/create' as any)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnHeaderText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle Switcher (Grouped by Landlord vs All Mortgages) */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'grouped' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('grouped')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="group-work"
            size={16}
            color={viewMode === 'grouped' ? '#0f172a' : '#64748b'}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'grouped' && styles.viewModeBtnTextActive]}>
            Grouped by Landlord
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'flat' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('flat')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="view-list"
            size={16}
            color={viewMode === 'flat' ? '#0f172a' : '#64748b'}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'flat' && styles.viewModeBtnTextActive]}>
            All Mortgages List
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Debt</Text>
          <Text style={styles.kpiDebtValue} numberOfLines={1}>
            £{totalOutstanding.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Monthly Outflow</Text>
          <Text style={styles.kpiValue} numberOfLines={1}>
            £{totalMonthly.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Facilities</Text>
          <Text style={styles.kpiValue}>
            {mortgages.length}
          </Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bank, landlord, ref, property..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type Filter Tabs */}
      <View style={styles.filterChipsRow}>
        {(['All', 'Individual Property', 'Collective / Group'] as const).map((typeKey) => {
          const isSelected = selectedType === typeKey;
          const label = typeKey === 'All' ? 'All Types' : typeKey === 'Individual Property' ? 'Individual' : 'Collective';
          return (
            <TouchableOpacity
              key={typeKey}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedType(typeKey)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading mortgage facilities...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Mortgages</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMortgagesData}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 70 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredMortgages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-balance" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Mortgages Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedType !== 'All'
                  ? 'No mortgage facilities match your current search or filter.'
                  : 'Track bank mortgage loans, outstanding debt, and repayments here.'}
              </Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => router.push('/mortgages/create' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.createFirstBtnText}>Add Mortgage Facility</Text>
              </TouchableOpacity>
            </View>
          ) : viewMode === 'grouped' ? (
            /* GROUPED BY LANDLORD VIEW */
            groupedByLandlord.map((group) => (
              <View key={group.landlordId} style={styles.landlordGroupCard}>
                {/* Landlord Banner Header */}
                <View style={styles.landlordBanner}>
                  <View style={styles.landlordBannerLeft}>
                    {group.landlordLogoUrl ? (
                      <Image source={{ uri: group.landlordLogoUrl }} style={styles.landlordAvatarImg} />
                    ) : (
                      <View style={styles.landlordAvatarCircle}>
                        <MaterialIcons name="person" size={20} color="#ffffff" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.landlordName} numberOfLines={1}>
                        {group.landlordName}
                      </Text>
                      <Text style={styles.landlordSubtitle}>
                        Landlord Mortgage Portfolio
                      </Text>
                    </View>
                  </View>

                  {/* Direct Mortgage Report Button */}
                  <TouchableOpacity
                    style={styles.landlordReportBtn}
                    onPress={() => router.push(`/reports/mortgage?landlordId=${group.landlordId}` as any)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="analytics" size={15} color="#059669" />
                    <Text style={styles.landlordReportBtnText}>Report</Text>
                  </TouchableOpacity>
                </View>

                {/* Landlord Quick Metrics Chips Bar */}
                <View style={styles.landlordMetricsChipsBar}>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricChipText}>
                      {group.mortgages.length} {group.mortgages.length === 1 ? 'Facility' : 'Facilities'}
                    </Text>
                  </View>
                  <View style={[styles.metricChip, styles.metricChipDebt]}>
                    <Text style={styles.metricChipDebtText}>
                      Debt: £{group.totalOutstanding.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  <View style={[styles.metricChip, styles.metricChipMonthly]}>
                    <Text style={styles.metricChipMonthlyText}>
                      £{group.totalMonthlyPayment.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/mo
                    </Text>
                  </View>
                </View>

                {/* Facilities List inside this Landlord Group */}
                <View style={styles.groupItemsContainer}>
                  {group.mortgages.map((m) => renderMortgageCard(m, false))}
                </View>

                {/* Landlord Group Summary Footer */}
                <View style={styles.landlordFooter}>
                  <View style={styles.footerSummaryCol}>
                    <Text style={styles.footerLabel}>Total Borrowed</Text>
                    <Text style={styles.footerVal}>
                      £{group.totalOriginalLoan.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  <View style={styles.footerSummaryCol}>
                    <Text style={styles.footerLabel}>Remaining Debt</Text>
                    <Text style={[styles.footerVal, { color: '#b45309' }]}>
                      £{group.totalOutstanding.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                  <View style={styles.footerSummaryCol}>
                    <Text style={styles.footerLabel}>Monthly Outflow</Text>
                    <Text style={[styles.footerVal, { color: '#047857' }]}>
                      £{group.totalMonthlyPayment.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/mo
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            /* FLAT LIST VIEW */
            filteredMortgages.map((m) => renderMortgageCard(m, true))
          )}
        </ScrollView>
      )}
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
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 68,
    height: 46,
    borderRadius: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtnHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeBtnTextActive: {
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  kpiDebtValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#b45309',
    marginTop: 2,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 8,
    fontWeight: '500',
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  landlordGroupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  landlordBanner: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  landlordBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  landlordAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  landlordAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginRight: 10,
  },
  landlordName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  landlordSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  landlordReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  landlordReportBtnText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  landlordMetricsChipsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  metricChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  metricChipDebt: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  metricChipDebtText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  metricChipMonthly: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  metricChipMonthlyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  groupItemsContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  landlordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  footerSummaryCol: {
    alignItems: 'flex-start',
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  footerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemRefText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  landlordInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  landlordInlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeIndividual: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeCollective: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextIndividual: {
    color: '#059669',
  },
  badgeTextCollective: {
    color: '#7c3aed',
  },
  itemMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    gap: 10,
    marginBottom: 8,
  },
  itemMetricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  metricValueDebt: {
    fontSize: 13,
    fontWeight: '900',
    color: '#b45309',
    marginTop: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  itemFooterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTag: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },
  statusOther: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  createFirstBtn: {
    marginTop: 16,
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  createFirstBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    color: '#ef4444',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
