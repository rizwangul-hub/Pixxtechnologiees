import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/src/context/AuthContext';
import { router } from 'expo-router';

export default function MoreTab() {
  const insets = useSafeAreaInsets();
  const { manager, signOut } = useContext(AuthContext);

  const modules = [
    { title: 'Tenants', icon: 'people', status: 'Active', route: '/(tabs)/tenants' },
    { title: 'Landlords', icon: 'person', status: 'Available via Properties', route: '/properties?landlord=All' },
    { title: 'Tenancies', icon: 'assignment', status: 'Active', route: '/tenancies' },
    { title: 'Expenses', icon: 'receipt-long', status: 'Active', route: '/expenses' },
    { title: 'Documents', icon: 'folder-shared', status: 'Active', route: '/documents' },
    { title: 'Reports', icon: 'analytics', status: 'Active', route: '/reports' },
  ];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 16) + 12,
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header with UK Pixxtechnologies Logo & Branding */}
      <View style={styles.topHeader}>
        <View style={styles.headerBrandWrap}>
          <Image
            source={require('@/assets/images/logo1.jpg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.brandTitle}>UK Pixxtechnologies</Text>
            <Text style={styles.headerSubtitle}>System Hub & Management</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {manager?.name && manager.name.toLowerCase() !== 'manager' ? manager.name.charAt(0).toUpperCase() : 'F'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.managerName}>{manager?.name && manager.name.toLowerCase() !== 'manager' ? manager.name : 'Fahad'}</Text>
          <Text style={styles.managerEmail}>{manager?.email || 'manager@pixxtechnolgies.com'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Modules</Text>
      <View style={styles.menuGroup}>
        {modules.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.menuItem, idx !== modules.length - 1 && styles.menuItemBorder]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name={item.icon as any} size={22} color="#0284c7" />
              <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text
                style={[
                  styles.badgeText,
                  item.status === 'Active'
                    ? { color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
                    : { color: '#0284c7', backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
                ]}
              >
                {item.status}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
          <View style={styles.menuLeft}>
            <MaterialIcons name="logout" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  managerEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
