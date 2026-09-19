import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

export default function DatabaseLoading() {
  return (
    <View style={styles.container}>
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
  spinner: {
    marginTop: 0,
  },
});
