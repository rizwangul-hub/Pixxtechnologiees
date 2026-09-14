import React, { useContext, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { AuthProvider, AuthContext } from '@/src/context/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { token, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
      const timer = setTimeout(() => {
        if (!token) {
          router.replace('/(auth)/login');
        } else {
          router.replace('/(tabs)');
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, token]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Info' }} />
      </Stack>

      {isLoading && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.splashContainer}>
            <Image
              source={require('@/assets/images/loading.png')}
              style={styles.splashImage}
              resizeMode="contain"
            />
            <ActivityIndicator size="large" color="#0284c7" style={styles.spinner} />
          </View>
        </View>
      )}
      <StatusBar style="dark" />
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashImage: {
    width: '80%',
    height: 260,
  },
  spinner: {
    marginTop: 24,
  },
});
