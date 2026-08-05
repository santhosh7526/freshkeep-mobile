import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, PantryProvider } from '@freshkeep/shared';
import { AppNavigator } from './navigation/AppNavigator';
// @ts-ignore - TypeScript sometimes doesn't pick up the React Native exports of Firebase
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '@freshkeep/shared';

// Initialize React Native persistence for Firebase Auth synchronously
// so it happens before any component renders.
try {
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  // Ignore auth/already-initialized if hot-reloading
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PantryProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </PantryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
