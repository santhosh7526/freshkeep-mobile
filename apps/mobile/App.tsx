import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, PantryProvider } from '@freshkeep/shared';
import { AppNavigator } from './navigation/AppNavigator';

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
