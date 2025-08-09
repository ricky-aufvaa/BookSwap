import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
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
    
    // Set up an interval to periodically check auth status (more frequent for logout detection)
    const interval = setInterval(checkAuthStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await apiService.getStoredToken();
      
      if (token && token !== 'undefined' && token !== 'null') {
        // Validate token with backend
        const validation = await apiService.validateToken();
        setIsAuthenticated(validation.valid);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Stack.Screen name="Main" component={TabNavigator} />
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
