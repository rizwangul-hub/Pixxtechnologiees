import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getPropertyById,
  getPropertyMortgages,
  archiveProperty,
  restoreProperty,
  PropertyItem,
} from '@/src/services/propertyService';

const { width: screenWidth } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Photo viewer modal
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const res = await getPropertyById(id);
      if (res && res.data) {
        setProperty(res.data);
      }
      const mortRes = await getPropertyMortgages(id);
      if (mortRes && mortRes.data) {
        setMortgages(mortRes.data);
      }
    } catch (err: any) {
      console.log('Error loading property detail:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load property details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleArchiveToggle = () => {
    if (!property) return;
    const isArchived = property.isArchived;

    Alert.alert(
      isArchived ? 'Restore Property' : 'Archive Property',
      isArchived
        ? 'Do you want to restore this property to active listings?'
        : 'Are you sure you want to archive this property? Historical tenancies and payments will remain preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Restore' : 'Archive',
          style: isArchived ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isArchived) {
                await restoreProperty(property._id);
                Alert.alert('Restored', 'Property has been restored successfully.');
              } else {
                await archiveProperty(property._id);
                Alert.alert('Archived', 'Property has been archived successfully.');
              }
              loadDetails();
            } catch (e: any) {
              Alert.alert('Action Failed', e.response?.data?.message || e.message || 'Error occurred.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (errorMessage || !property) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Property Not Found</Text>
        <Text style={styles.errorSubtitle}>{errorMessage || 'Unable to load property data.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.images || [];
  const addressLine = [property.address, property.city, property.county, property.postcode, property.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.name}
        </Text>
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() => router.push(`/properties/edit/${property._id}` as any)}
        >
          <MaterialIcons name="edit" size={20} color="#0284c7" />
          <Text style={styles.headerEditText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Gallery Carousel / Thumbnails */}
        {images.length > 0 ? (
          <View style={styles.gallerySection}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => setSelectedPhotoIndex(idx)}
                >
                  <Image source={{ uri: img.url }} style={styles.carouselImage} resizeMode="cover" />
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {idx + 1} / {images.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <MaterialIcons name="add-photo-alternate" size={36} color="#94a3b8" />
            <Text style={styles.noPhotoText}>No property photos uploaded</Text>
          </View>
        )}

        {/* Status and Title Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>{property.name}</Text>
              <Text style={styles.typeSubtitle}>{property.type || property.assetType || 'Property'}</Text>
            </View>
            <View style={[styles.statusBadge, property.isArchived && { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.statusBadgeText, property.isArchived && { color: '#64748b' }]}>
                {property.isArchived ? 'Archived' : (property.status || 'Available')}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.metaLabel}>Monthly Rent</Text>
              <Text style={styles.priceValue}>
                £{Number(property.monthlyRent || property.price || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            {property.salePrice && property.salePrice > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Sale Price</Text>
                <Text style={styles.salePriceValue}>
                  £{Number(property.salePrice).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Location & Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Location & Dimensions</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={18} color="#64748b" style={styles.detailIcon} />
            <Text style={styles.detailText}>{addressLine || 'Address not provided'}</Text>
          </View>
          {property.floor ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="layers" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>Floor: {property.floor}</Text>
            </View>
          ) : null}
          {property.size ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="square-foot" size={18} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Size: {property.size} {property.sizeUnit || 'sq ft'}
              </Text>
            </View>
          ) : null}
          {property.description ? (
            <View style={styles.descriptionWrap}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{property.description}</Text>
            </View>
          ) : null}
          {property.notes ? (
            <View style={styles.descriptionWrap}>
              <Text style={styles.descriptionLabel}>Internal Notes</Text>
              <Text style={styles.descriptionText}>{property.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Landlord Information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Landlord (Owner)</Text>
          {property.landlordId ? (
            <View>
              <Text style={styles.entityName}>{property.landlordId.fullName}</Text>
              {property.landlordId.phone ? (
                <View style={styles.detailRow}>
                  <MaterialIcons name="phone" size={16} color="#64748b" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{property.landlordId.phone}</Text>
                </View>
              ) : null}
              {property.landlordId.email ? (
                <View style={styles.detailRow}>
                  <MaterialIcons name="email" size={16} color="#64748b" style={styles.detailIcon} />
                  <Text style={styles.detailText}>{property.landlordId.email}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.emptyDetailText}>No landlord attached</Text>
          )}
        </View>

        {/* Tenancy & Current Tenant */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Tenancy Information</Text>
          {property.activeTenancy || property.tenant ? (
            <View>
              <View style={styles.detailRow}>
                <MaterialIcons name="person" size={18} color="#059669" style={styles.detailIcon} />
                <Text style={[styles.detailText, { fontWeight: '700', color: '#0f172a' }]}>
                  {property.tenant?.fullName || property.tenantName || 'Active Tenant'}
                </Text>
              </View>
              {property.activeTenancy ? (
                <>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={16} color="#64748b" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      Period: {property.activeTenancy.startDate ? new Date(property.activeTenancy.startDate).toLocaleDateString('en-GB') : '-'}
                      {' to '}
                      {property.activeTenancy.endDate ? new Date(property.activeTenancy.endDate).toLocaleDateString('en-GB') : '-'}
                    </Text>
                  </View>
                  {property.activeTenancy.paymentDueDay ? (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="calendar-today" size={16} color="#64748b" style={styles.detailIcon} />
                      <Text style={styles.detailText}>
                        Rent Due Day: Day {property.activeTenancy.paymentDueDay} of month
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.detailRow}>
              <MaterialIcons name="info-outline" size={18} color="#94a3b8" style={styles.detailIcon} />
              <Text style={styles.emptyDetailText}>No active tenancy. Property is currently vacant.</Text>
            </View>
          )}
        </View>

        {/* Agent Assignment */}
        {property.agentName || property.agent ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Assigned Agent</Text>
            <Text style={styles.entityName}>{property.agentName}</Text>
            {property.agentFee ? (
              <Text style={styles.detailText}>Monthly Commission: £{property.agentFee}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Secured Mortgages Facility */}
        {mortgages.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Secured Mortgages</Text>
            {mortgages.map((m, idx) => {
              const isCollective = m.mortgageType === 'Collective / Group' || (m.properties && m.properties.length > 1);
              const allocatedProp = m.properties?.find((p: any) => (p.propertyId?._id || p.propertyId) === property._id);

              return (
                <View key={idx} style={[styles.mortgageItem, idx !== mortgages.length - 1 && styles.mortgageBorder]}>
                  <View style={styles.mortgageHeader}>
                    <Text style={styles.mortgageRef}>{m.mortgageReference || m.mortgageAccountNumber || 'Mortgage'}</Text>
                    <View style={styles.mortgageTypeBadge}>
                      <Text style={styles.mortgageTypeBadgeText}>
                        {isCollective ? 'Collective Facility' : 'Individual'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.mortgageLender}>Lender: {m.lenderName || 'Not specified'}</Text>
                  <Text style={styles.mortgageBalance}>
                    Facility Outstanding: £{Number(m.currentOutstandingBalance || 0).toLocaleString('en-GB')}
                  </Text>
                  {isCollective && allocatedProp?.allocatedAmount ? (
                    <Text style={styles.allocatedText}>
                      This property allocation: £{Number(allocatedProp.allocatedAmount).toLocaleString('en-GB')}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Archive / Restore Button */}
        <TouchableOpacity
          style={[styles.archiveBtn, property.isArchived && styles.restoreBtn]}
          onPress={handleArchiveToggle}
        >
          <MaterialIcons
            name={property.isArchived ? 'unarchive' : 'archive'}
            size={20}
            color={property.isArchived ? '#0284c7' : '#ef4444'}
          />
          <Text style={[styles.archiveBtnText, property.isArchived && styles.restoreBtnText]}>
            {property.isArchived ? 'Restore Property' : 'Archive Property'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fullscreen Photo Viewer Modal */}
      {selectedPhotoIndex !== null && (
        <Modal visible={true} transparent={true} onRequestClose={() => setSelectedPhotoIndex(null)}>
          <View style={styles.fullscreenModal}>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedPhotoIndex(null)}
            >
              <MaterialIcons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Image
              source={{ uri: images[selectedPhotoIndex]?.url }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            <Text style={styles.fullscreenCounter}>
              {selectedPhotoIndex + 1} of {images.length}
            </Text>
          </View>
        </Modal>
      )}
    </View>
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
    flex: 1,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  headerEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gallerySection: {
    backgroundColor: '#000000',
  },
  carouselScroll: {
    width: screenWidth,
    height: 240,
  },
  carouselImage: {
    width: screenWidth,
    height: 240,
  },
  imageCounter: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  noPhotoPlaceholder: {
    height: 120,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  noPhotoText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  typeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  statusBadgeText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  salePriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  descriptionWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyDetailText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  mortgageItem: {
    paddingVertical: 10,
  },
  mortgageBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mortgageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mortgageRef: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  mortgageTypeBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mortgageTypeBadgeText: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '600',
  },
  mortgageLender: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mortgageBalance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 4,
  },
  allocatedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  archiveBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  restoreBtn: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  restoreBtnText: {
    color: '#0284c7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: screenWidth,
    height: '75%',
  },
  fullscreenCounter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
  },
});
