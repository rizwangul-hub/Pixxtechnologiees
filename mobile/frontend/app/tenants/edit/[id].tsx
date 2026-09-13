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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getTenantById, updateTenant } from '@/src/services/tenantService';
import { uploadImageToBackend } from '@/src/services/uploadService';

const TENANT_TYPES = ['Individual', 'Company / Business', 'Organization'];

export default function EditTenantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('Individual');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('London');
  const [cnicOrReg, setCnicOrReg] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [profileImage, setProfileImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const res = await getTenantById(id);
        if (res && res.data) {
          const t = res.data;
          setName(t.fullName || t.name || '');
          setType(t.type || 'Individual');
          setPhone(t.phone || '');
          setEmail(t.email || '');
          setAddress(t.address || '');
          setCity(t.city || 'London');
          setCnicOrReg(t.cnicOrReg || t.cnicOrId || '');
          setEmergencyContact(t.emergencyContact || '');
          setNotes(t.notes || '');
          setProfileImage(t.profileImage || '');
        }
      } catch (err) {
        Alert.alert('Load Error', 'Failed to load tenant details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Library permission required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadingImage(true);
      try {
        const res = await uploadImageToBackend(result.assets[0].uri);
        if (res && res.url) setProfileImage(res.url);
      } catch (e) {
        Alert.alert('Upload Failed', 'Failed to upload photo.');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter Tenant Name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        type,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        city: city.trim() || 'London',
        cnicOrReg: cnicOrReg.trim(),
        emergencyContact: emergencyContact.trim(),
        profileImage,
        notes: notes.trim(),
      };

      const res = await updateTenant(id, payload);
      if (res && res.success) {
        Alert.alert('Success', 'Tenant updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(`/tenants/${id}` as any),
          },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update tenant.';
      Alert.alert('Update Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading tenant info...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Tenant</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <TouchableOpacity style={styles.avatarPicker} onPress={handlePickImage} disabled={uploadingImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="add-a-photo" size={28} color="#0284c7" />
                <Text style={styles.avatarPickerText}>Change Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Tenant Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Tenant Type</Text>
          <View style={styles.chipsRow}>
            {TENANT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipSelected]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Address & ID */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Address & ID</Text>

          <Text style={styles.label}>Residential Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />

          <Text style={styles.label}>City / Town</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} />

          <Text style={styles.label}>ID / Reg No</Text>
          <TextInput style={styles.input} value={cnicOrReg} onChangeText={setCnicOrReg} />

          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput style={styles.input} value={emergencyContact} onChangeText={setEmergencyContact} />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Update Tenant</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  avatarPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickerText: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
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
    height: 64,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  chipsRow: {
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
  },
  chipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
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
});
