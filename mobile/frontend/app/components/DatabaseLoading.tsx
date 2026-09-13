import React from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';

export default function DatabaseLoading() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/loading.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#0284c7" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 240,
    height: 240,
  },
  spinner: {
    marginTop: 20,
  },
});
