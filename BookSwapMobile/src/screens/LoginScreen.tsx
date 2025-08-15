import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { RootStackParamList, LoginForm } from '../types';
import { apiService } from '../services/api';

// Separate memoized component for the login form
const LoginFormComponent = React.memo<{
  onSubmit: (username: string, password: string) => void;
  loading: boolean;
}>(({ onSubmit, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(username.trim(), password);
  };

  // Reset form when submission is complete (loading becomes false after being true)
  const [wasLoading, setWasLoading] = useState(false);
  useEffect(() => {
    if (wasLoading && !loading) {
      setUsername('');
      setPassword('');
    }
    setWasLoading(loading);
  }, [loading, wasLoading]);

  return (
    <View style={styles.formContainer}>
      <Input
        id="login-username"
        name="username"
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        leftIcon="person-outline"
        autoCapitalize="none"
        autoComplete="username"
      />

      <Input
        id="login-password"
        name="password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        leftIcon="lock-closed-outline"
        autoComplete="current-password"
      />

      <Button
        title="Sign In"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        icon="log-in-outline"
      />
    </View>
  );
});

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    console.log('handleLogin called with:', { username, password: '***' });
    
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Please fill in both username and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Calling apiService.login...');
      const response = await apiService.login({
        username: username.trim(),
        password: password,
      });

      console.log('Login successful:', response);
      // Authentication successful - trigger immediate auth check
      if ((global as any).forceAuthCheck) {
        (global as any).forceAuthCheck();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // If it's a network error, try to reconfigure the network and retry once
      if (error.message.includes('Cannot connect to server')) {
        console.log('🔄 Network error detected, attempting to reconfigure...');
        
        try {
          const reconfigured = await apiService.reconfigureNetwork();
          if (reconfigured) {
            console.log('🔄 Retrying login with new network configuration...');
            const retryResponse = await apiService.login({
              username: username.trim(),
              password: password,
            });
            
            console.log('✅ Login successful after network reconfiguration:', retryResponse);
            if ((global as any).forceAuthCheck) {
              (global as any).forceAuthCheck();
            }
            return; // Success, exit the function
          }
        } catch (retryError: any) {
          console.error('❌ Retry login failed:', retryError);
        }
        
        // If reconfiguration or retry failed, show network-specific error
        Alert.alert(
          'Connection Failed', 
          'Cannot connect to the server. Please ensure:\n\n' +
          '1. Your device and computer are on the same WiFi network\n' +
          '2. The backend server is running on your computer\n' +
          '3. Your computer\'s firewall allows connections on port 8000\n\n' +
          'Check the console logs for more details.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          scrollEnabled={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your book journey
            </Text>
          </View>

          <Card style={styles.formCard}>
            <LoginFormComponent
              onSubmit={handleLogin}
              loading={loading}
            />
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Don't have an account?
            </Text>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Signup')}
              variant="ghost"
              size="small"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.component.screenPadding,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  formContainer: {
    gap: spacing.md,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
});

export default LoginScreen;
