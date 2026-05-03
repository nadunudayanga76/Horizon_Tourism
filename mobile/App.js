import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </LanguageProvider>
    </AuthProvider>
  );
}
