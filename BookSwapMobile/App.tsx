import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { UnreadMessagesProvider } from './src/contexts/UnreadMessagesContext';
import { colors } from './src/constants/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnreadMessagesProvider>
        <AppNavigator />
      </UnreadMessagesProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
    </GestureHandlerRootView>
  );
}
