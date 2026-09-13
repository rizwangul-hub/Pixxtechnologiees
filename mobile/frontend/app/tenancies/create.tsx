import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getTenants, TenantItem } from '@/src/services/tenantService';
import { getProperties, PropertyItem } from '@/src/services/propertyService';
import { getAgentsList, AgentItem } from '@/src/services/agentService';
import { createTenancy } from '@/src/services/tenancyService';

export default function CreateTenancyScreen() {
  const params = useLocalSearchParams<{ tenantId?: string; propertyId?: string }>();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Available lists
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);

  // Selected values
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);

  // Modals state
  const [tenantModalVisible, setTenantModalVisible] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [agentModalVisible, setAgentModalVisible] = useState(false);

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('1');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [companyMonthlyAmount, setCompanyMonthlyAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [tenantsRes, propsRes, agentsData] = await Promise.all([
          getTenants({ status: 'Active', limit: 200 }),
          getProperties({ limit: 200 }),
          getAgentsList(),
        ]);

        if (tenantsRes.data) {
          setTenants(tenantsRes.data);
          if (params.tenantId) {
            const match = tenantsRes.data.find((t) => t._id === params.tenantId);
            if (match) setSelectedTenant(match);
          }
        }

        if (propsRes.data) {
          // Filter to properties that are Available or not currently Occupied
          const availableProps = propsRes.data.filter((p) => p.status !== 'Occupied' && !p.isArchived);
          setProperties(availableProps);
          if (params.propertyId) {
            const match = propsRes.data.find((p) => p._id === params.propertyId);
            if (match) {
              setSelectedProperty(match);
              if (match.monthlyRent) setMonthlyRent(String(match.monthlyRent));
            }
          }
        }

        setAgents(agentsData);
      } catch (err) {
        console.log('Error loading initial data for tenancy:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [params.tenantId, params.propertyId]);

  const handleSelectProperty = (prop: PropertyItem) => {
    setSelectedProperty(prop);
    if (prop.monthlyRent) setMonthlyRent(String(prop.monthlyRent));
    setPropertyModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedTenant) {
      Alert.alert('Required Field', 'Please select a Tenant.');
      return;
    }

    if (!selectedProperty) {
      Alert.alert('Required Field', 'Please select a Property.');
      return;
    }

    if (!startDate) {
      Alert.alert('Required Field', 'Please enter a Start Date.');
      return;
    }

    const rentVal = Number(monthlyRent);
    if (isNaN(rentVal) || rentVal <= 0) {
      Alert.alert('Invalid Rent', 'Monthly rent must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedTenant._id,
        propertyId: selectedProperty._id,
        startDate,
        endDate: endDate.trim() || undefined,
        monthlyRent: rentVal,
        paymentDueDay: Number(paymentDueDay) || 1,
        securityDeposit: Number(securityDeposit) || 0,
        openingBalance: Number(openingBalance) || 0,
        agentId: selectedAgent ? selectedAgent._id : null,
        companyMonthlyAmount: Number(companyMonthlyAmount) || 0,
        notes: notes.trim(),
      };

      const res = await createTenancy(payload);
      if (res && res.success) {
        Alert.alert('Success', 'Tenancy agreement created successfully! Property is now Occupied.', [
          {
            text: 'OK',
            onPress: () => router.replace('/tenancies' as any),
          },
        ]);
      }
    } catch (err: any) {
      console.log('Create tenancy error:', err);
      const msg = err.response?.data?.message || 'Failed to create tenancy.';
      Alert.alert('Creation Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading available properties and tenants...</Text>
      </View>
    );
  }

  const filteredTenants = tenants.filter((t) =>
    (t.fullName || t.name || '').toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const filteredProperties = properties.filter((p) => {
    const q = propertySearch.toLowerCase();
    const name = (p.name || (p as any).propertyName || '').toLowerCase();
    const addr = (p.address || '').toLowerCase();
    return name.includes(q) || addr.includes(q);
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Tenancy</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.headerSaveBtn, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Tenant Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Tenant (Required) *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setTenantModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerSubText}>Selected Tenant:</Text>
              <Text style={[styles.pickerValueText, !selectedTenant && { color: '#94a3b8' }]}>
                {selectedTenant ? (selectedTenant.fullName || selectedTenant.name) : 'Tap to choose tenant...'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={26} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* Property Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Property (Required) *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setPropertyModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerSubText}>Selected Property (Available):</Text>
              <Text style={[styles.pickerValueText, !selectedProperty && { color: '#94a3b8' }]}>
                {selectedProperty ? (selectedProperty.name || (selectedProperty as any).propertyName) : 'Tap to choose available property...'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={26} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* Lease Dates & Rent */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Lease Terms & Rent</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>End Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Monthly Rent (£) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Due Day (1-31)</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={paymentDueDay}
                onChangeText={setPaymentDueDay}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Security Deposit (£)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={securityDeposit}
                onChangeText={setSecurityDeposit}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Opening Balance (£)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={openingBalance}
                onChangeText={setOpeningBalance}
              />
            </View>
          </View>
        </View>

        {/* Agent Assignment (Optional) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Managing Agent (Optional)</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setAgentModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerSubText}>Assigned Agent:</Text>
              <Text style={[styles.pickerValueText, !selectedAgent && { color: '#94a3b8' }]}>
                {selectedAgent ? (selectedAgent.fullName || selectedAgent.name) : 'None / Self-managed'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={26} color="#0284c7" />
          </TouchableOpacity>

          {selectedAgent && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Company Monthly Amount (£)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={companyMonthlyAmount}
                onChangeText={setCompanyMonthlyAmount}
              />
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Agreement Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Special clauses, renewal terms..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Create Tenancy</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Tenant Modal */}
      <Modal
        visible={tenantModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTenantModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tenant</Text>
              <TouchableOpacity onPress={() => setTenantModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tenant..."
                placeholderTextColor="#94a3b8"
                value={tenantSearch}
                onChangeText={setTenantSearch}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {filteredTenants.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  style={[
                    styles.itemRow,
                    selectedTenant?._id === t._id && styles.itemRowActive,
                  ]}
                  onPress={() => {
                    setSelectedTenant(t);
                    setTenantModalVisible(false);
                  }}
                >
                  <Text style={styles.itemName}>{t.fullName || t.name}</Text>
                  {t.phone ? <Text style={styles.itemSub}>{t.phone}</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Property Modal */}
      <Modal
        visible={propertyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPropertyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Available Property</Text>
              <TouchableOpacity onPress={() => setPropertyModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <MaterialIcons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search property..."
                placeholderTextColor="#94a3b8"
                value={propertySearch}
                onChangeText={setPropertySearch}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {filteredProperties.map((p) => (
                <TouchableOpacity
                  key={p._id}
                  style={[
                    styles.itemRow,
                    selectedProperty?._id === p._id && styles.itemRowActive,
                  ]}
                  onPress={() => handleSelectProperty(p)}
                >
                  <Text style={styles.itemName}>{p.name || (p as any).propertyName}</Text>
                  <Text style={styles.itemSub}>{p.address || 'Address not listed'}</Text>
                </TouchableOpacity>
              ))}
              {filteredProperties.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8' }}>No available properties found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Agent Modal */}
      <Modal
        visible={agentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAgentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agent</Text>
              <TouchableOpacity onPress={() => setAgentModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => {
                  setSelectedAgent(null);
                  setAgentModalVisible(false);
                }}
              >
                <Text style={styles.itemName}>None / Self-managed</Text>
              </TouchableOpacity>
              {agents.map((a) => (
                <TouchableOpacity
                  key={a._id}
                  style={[styles.itemRow, selectedAgent?._id === a._id && styles.itemRowActive]}
                  onPress={() => {
                    setSelectedAgent(a);
                    setAgentModalVisible(false);
                  }}
                >
                  <Text style={styles.itemName}>{a.fullName || a.name}</Text>
                  {a.agencyName ? <Text style={styles.itemSub}>{a.agencyName}</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSaveBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerSubText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  pickerValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  multilineInput: {
    height: 64,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  itemRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemRowActive: {
    backgroundColor: '#f0f9ff',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
