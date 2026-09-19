import React, { useContext, useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { AuthProvider, AuthContext } from '@/src/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { token, isLoading } = useContext(AuthContext);
  const [showInitialSplash, setShowInitialSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    try {
      const { requireOptionalNativeModule } = require('expo');
      const DevMenuPreferences = requireOptionalNativeModule?.('DevMenuPreferences');
      DevMenuPreferences?.setPreferencesAsync?.({ showFloatingActionButton: false });
    } catch {}
    const splashTimer = setTimeout(() => {
      setShowInitialSplash(false);
    }, 2200);
    return () => clearTimeout(splashTimer);
  }, []);

  const isAppLoading = isLoading || showInitialSplash;

  useEffect(() => {
    if (!isAppLoading) {
      if (!token) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAppLoading, token]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar hidden={isAppLoading} style="dark" />

      {isAppLoading ? (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={require('@/assets/images/loading.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
