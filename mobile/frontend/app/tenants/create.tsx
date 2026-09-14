import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createTenant } from '@/src/services/tenantService';
import { uploadImageToBackend } from '@/src/services/uploadService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TENANT_TYPES = ['Individual', 'Company / Business', 'Organization'];

export default function CreateTenantScreen() {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 12) + 8;
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
  const [submitting, setSubmitting] = useState(false);

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
        setUploadingImage(true);
        try {
          const res = await uploadImageToBackend(result.assets[0].uri);
          if (res && res.url) {
            setProfileImage(res.url);
          }
        } catch (e: any) {
          Alert.alert('Upload Failed', 'Failed to upload tenant avatar image.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (e) {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter Tenant Name.');
      return;
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email format.');
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
        status: 'Active',
      };

      const res = await createTenant(payload);
      if (res && res.success) {
        Alert.alert('Success', 'Tenant created successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/tenants'),
          },
        ]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || (err.response?.data?.errors && err.response.data.errors[0]) || 'Failed to create tenant.';
      Alert.alert('Creation Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Tenant</Text>
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Card */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={() => handlePickImage(false)}
            disabled={uploadingImage}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                {uploadingImage ? (
                  <ActivityIndicator color="#0284c7" />
                ) : (
                  <>
                    <MaterialIcons name="add-a-photo" size={28} color="#0284c7" />
                    <Text style={styles.avatarPickerText}>Add Photo</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
          {profileImage ? (
            <TouchableOpacity onPress={() => setProfileImage('')} style={styles.removeAvatarBtn}>
              <Text style={styles.removeAvatarText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Tenant Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Smith"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

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
          <TextInput
            style={styles.input}
            placeholder="+44 7123 456789"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="tenant@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Address & ID */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Address & Identification</Text>

          <Text style={styles.label}>Residential Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>City / Town</Text>
          <TextInput
            style={styles.input}
            placeholder="London"
            placeholderTextColor="#94a3b8"
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>ID / Reg No / National Insurance</Text>
          <TextInput
            style={styles.input}
            placeholder="Passport / ID number"
            placeholderTextColor="#94a3b8"
            value={cnicOrReg}
            onChangeText={setCnicOrReg}
          />

          <Text style={styles.label}>Emergency Contact (Name & Phone)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jane Smith (+44...)"
            placeholderTextColor="#94a3b8"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />

          <Text style={styles.label}>Internal Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Private tenant records, background info..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { minHeight: 48 }, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Create Tenant</Text>
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
  removeAvatarBtn: {
    marginTop: 8,
  },
  removeAvatarText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
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
    marginBottom: 4,
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
});
