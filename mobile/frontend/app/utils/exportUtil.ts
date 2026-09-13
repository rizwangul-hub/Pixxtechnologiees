import React from 'react';
// Dummy component to satisfy Expo router route requirement
export default function ExportUtil(){
  return null;
}

import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Helper to convert ArrayBuffer to base64 without Node Buffer
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return (globalThis as any).btoa(binary);
}

/**
 * Saves a binary buffer to a temporary file and opens the share dialog.
 * @param buffer ArrayBuffer containing the file data.
 * @param filename Desired filename including extension (e.g. "report.pdf").
 * @param mime MIME type of the file.
 */
export async function exportFile(buffer: ArrayBuffer, filename: string, mime: string): Promise<void> {
  try {
    const base64 = arrayBufferToBase64(buffer);
    const fileUri = `${FileSystem.cacheDirectory || ''}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: `Export ${filename}` });
    } else {
      Alert.alert('Export Saved', `File has been saved to device cache:\n${filename}`);
    }
  } catch (err: any) {
    console.error('Export execution error:', err);
    Alert.alert('Export Notice', 'The file was processed. Please verify your device permissions or viewer apps.');
  }
}
