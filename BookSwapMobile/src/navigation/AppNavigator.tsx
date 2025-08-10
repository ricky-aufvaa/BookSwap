import React, { useState, useEffect } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { RootStackParamList } from '../types';
import { apiService } from '../services/api';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for app state changes to re-check auth when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkAuthStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);


  const checkAuthStatus = async () => {
    try {
      console.log('AppNavigator: Checking auth status...');
      const token = await apiService.getStoredToken();
      console.log('AppNavigator: Token found:', token ? 'Yes' : 'No');
      
      if (token && token !== 'undefined' && token !== 'null') {
        // Validate token with backend
        console.log('AppNavigator: Validating token with backend...');
        const validation = await apiService.validateToken();
        console.log('AppNavigator: Token validation result:', validation);
        setIsAuthenticated(validation.valid);
      } else {
        console.log('AppNavigator: No valid token found, setting authenticated to false');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('AppNavigator: Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose checkAuthStatus globally for login to trigger
  useEffect(() => {
    (global as any).forceAuthCheck = checkAuthStatus;
    return () => {
      delete (global as any).forceAuthCheck;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.loadingContent}
        >
          <Ionicons name="book" size={64} color={colors.accent} />
          <Animatable.Text
            animation="fadeIn"
            delay={500}
            style={styles.loadingText}
          >
            BookSwap
          </Animatable.Text>
          <Animatable.Text
            animation="fadeIn"
            delay={1000}
            style={styles.loadingSubtext}
          >
            Share books, build community
          </Animatable.Text>
        </Animatable.View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="ChatList" 
              component={ChatListScreen}
              options={{
                headerShown: true,
                title: 'Messages',
                headerStyle: {
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                  ...textStyles.h3,
                },
              }}
            />
            <Stack.Screen 
              name="ChatRoom" 
              component={ChatRoomScreen}
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                  ...textStyles.h3,
                },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...textStyles.h1,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default AppNavigator;
