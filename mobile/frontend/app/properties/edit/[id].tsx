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
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getPropertyById, updateProperty, PropertyItem } from '@/src/services/propertyService';
import { getLandlordsList } from '@/src/services/landlordService';
import { uploadImageToBackend } from '@/src/services/uploadService';
import { LandlordBrief } from '@/src/services/propertyService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PROPERTY_TYPES = ['Shop', 'Office', 'House', 'Flat', 'Apartment', 'Building', 'Room', 'Other'];
const STATUS_OPTIONS = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

export default function EditPropertyScreen() {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8;
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('Shop');
  const [selectedStatus, setSelectedStatus] = useState('Available');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postcode, setPostcode] = useState('');
  const [floor, setFloor] = useState('Ground');
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('sq ft');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Landlord selection
  const [landlords, setLandlords] = useState<LandlordBrief[]>([]);
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordBrief | null>(null);
  const [landlordModalVisible, setLandlordModalVisible] = useState(false);
  const [landlordSearch, setLandlordSearch] = useState('');

  // Images
  const [images, setImages] = useState<{ url: string; public_id?: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [propRes, landlordsData] = await Promise.all([
          getPropertyById(id),
          getLandlordsList(),
        ]);
        setLandlords(landlordsData);

        if (propRes && propRes.data) {
          const p = propRes.data;
          setName(p.name || '');
          setSelectedType(p.type || p.assetType || 'Shop');
          setSelectedStatus(p.status === 'Archived' ? 'Available' : (p.status || 'Available'));
          setMonthlyRent(String(p.monthlyRent ?? p.price ?? ''));
          setSalePrice(p.salePrice ? String(p.salePrice) : '');
          setAddress(p.address || '');
          setCity(p.city || 'London');
          setCounty(p.county || '');
          setPostcode(p.postcode || '');
          setFloor(p.floor || 'Ground');
          setSize(p.size || '');
          setSizeUnit(p.sizeUnit || 'sq ft');
          setDescription(p.description || '');
          setNotes(p.notes || '');
          setImages(p.images || []);

          if (p.landlordId) {
            setSelectedLandlord(p.landlordId);
          }
        }
      } catch (err) {
        Alert.alert('Load Error', 'Failed to load property data for editing.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedAsset = result.assets[0];
        setUploadingImage(true);
        try {
          const uploadRes = await uploadImageToBackend(pickedAsset.uri, pickedAsset.fileName || undefined);
          if (uploadRes && uploadRes.url) {
            setImages((prev) => [...prev, { url: uploadRes.url, public_id: uploadRes.public_id }]);
          }
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.response?.data?.message || uploadErr.message || 'Image upload failed.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (e: any) {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!id) return;
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a Property Name.');
      return;
    }

    if (!selectedLandlord) {
      Alert.alert('Required Field', 'Please select a Landlord.');
      return;
    }

    const rentVal = Number(monthlyRent);
    if (isNaN(rentVal) || rentVal < 0) {
      Alert.alert('Invalid Rent', 'Monthly rent must be a positive number.');
      return;
    }

    const saleVal = salePrice ? Number(salePrice) : 0;
    if (isNaN(saleVal) || saleVal < 0) {
      Alert.alert('Invalid Price', 'Sale price must be a positive number.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: name.trim(),
        landlordId: selectedLandlord._id,
        type: selectedType,
        assetType: selectedType,
        status: selectedStatus,
        assetStatus: selectedStatus,
        monthlyRent: rentVal,
        price: rentVal,
        salePrice: saleVal,
        address: address.trim(),
        city: city.trim() || 'London',
        county: county.trim(),
        postcode: postcode.trim(),
        country: 'United Kingdom',
        floor: floor.trim(),
        size: size.trim(),
        sizeUnit,
        description: description.trim(),
        notes: notes.trim(),
        images,
      };

      const res = await updateProperty(id, payload);
      if (res && res.success) {
        Alert.alert('Success', 'Property updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(`/properties/${id}` as any),
          },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || (err.response?.data?.errors && err.response.data.errors[0]) || 'Failed to update property.';
      Alert.alert('Update Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLandlords = landlords.filter((l) =>
    l.fullName.toLowerCase().includes(landlordSearch.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading property information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <TouchableOpacity
          onPress={handleUpdate}
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Landlord Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Landlord (Owner) *</Text>
          <TouchableOpacity
            style={styles.landlordPickerBtn}
            onPress={() => setLandlordModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerSubText}>Selected Landlord:</Text>
              <Text style={[styles.pickerValueText, !selectedLandlord && { color: '#94a3b8' }]}>
                {selectedLandlord ? selectedLandlord.fullName : 'Choose landlord...'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={26} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Property Details</Text>

          <Text style={styles.label}>Property Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Property Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, selectedType === t && styles.chipSelected]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={[styles.chipText, selectedType === t && styles.chipTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusChipsWrap}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedStatus === s && styles.chipSelected]}
                onPress={() => setSelectedStatus(s)}
              >
                <Text style={[styles.chipText, selectedStatus === s && styles.chipTextSelected]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Financial Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Financial Terms</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Monthly Rent (£) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Sale Price (£)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={salePrice}
                onChangeText={setSalePrice}
              />
            </View>
          </View>
        </View>

        {/* Location & Address */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Address & Dimensions</Text>

          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>City / Town</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Postcode</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="characters"
                value={postcode}
                onChangeText={setPostcode}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>County</Text>
              <TextInput
                style={styles.input}
                value={county}
                onChangeText={setCounty}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Floor</Text>
              <TextInput
                style={styles.input}
                value={floor}
                onChangeText={setFloor}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: 8 }}>
              <Text style={styles.label}>Size</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={size}
                onChangeText={setSize}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={sizeUnit}
                onChangeText={setSizeUnit}
              />
            </View>
          </View>
        </View>

        {/* Photos Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Property Photos</Text>

          <View style={styles.photosGrid}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageThumbContainer}>
                <Image source={{ uri: img.url }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(idx)}
                >
                  <MaterialIcons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}

            {uploadingImage && (
              <View style={[styles.imageThumb, styles.uploadingThumb]}>
                <ActivityIndicator size="small" color="#0284c7" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          <View style={styles.uploadButtonsRow}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickImage(false)}
              disabled={uploadingImage}
            >
              <MaterialIcons name="photo-library" size={20} color="#0284c7" />
              <Text style={styles.pickBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickImage(true)}
              disabled={uploadingImage}
            >
              <MaterialIcons name="photo-camera" size={20} color="#0284c7" />
              <Text style={styles.pickBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description & Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Additional Information</Text>

          <Text style={styles.label}>Public Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Internal Notes (Private)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Bottom Save Button */}
        <TouchableOpacity
          style={[styles.submitButton, { minHeight: 48 }, submitting && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Update Property</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Landlord Selector Modal */}
      <Modal
        visible={landlordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLandlordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.landlordModalCard, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Landlord</Text>
              <TouchableOpacity onPress={() => setLandlordModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <MaterialIcons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search landlord by name..."
                placeholderTextColor="#94a3b8"
                value={landlordSearch}
                onChangeText={setLandlordSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {filteredLandlords.map((l) => (
                <TouchableOpacity
                  key={l._id}
                  style={[
                    styles.landlordSelectRow,
                    selectedLandlord?._id === l._id && styles.landlordSelectRowActive,
                  ]}
                  onPress={() => {
                    setSelectedLandlord(l);
                    setLandlordModalVisible(false);
                  }}
                >
                  <View style={styles.landlordAvatar}>
                    <Text style={styles.landlordAvatarText}>{l.fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.landlordSelectName}>{l.fullName}</Text>
                    {l.phone ? <Text style={styles.landlordSelectPhone}>{l.phone}</Text> : null}
                  </View>
                  {selectedLandlord?._id === l._id && (
                    <MaterialIcons name="check" size={22} color="#0284c7" />
                  )}
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
    height: 72,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  landlordPickerBtn: {
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  imageThumbContainer: {
    position: 'relative',
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  uploadingThumb: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0284c7',
  },
  uploadingText: {
    fontSize: 10,
    color: '#0284c7',
    marginTop: 4,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
    gap: 6,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
  landlordModalCard: {
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
  modalSearchBox: {
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
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  landlordSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  landlordSelectRowActive: {
    backgroundColor: '#f0f9ff',
  },
  landlordAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  landlordAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  landlordSelectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  landlordSelectPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
