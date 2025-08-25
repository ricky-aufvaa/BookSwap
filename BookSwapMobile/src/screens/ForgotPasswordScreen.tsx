import React, { useState } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { RootStackParamList } from '../types';
import { apiService } from '../services/api';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;
type ForgotPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
  route: ForgotPasswordScreenRouteProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.forgotPassword({ email: email.trim() });
      
      Alert.alert(
        'Reset Code Sent',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetPassword', { email: email.trim() });
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formContainer}>
              <Input
                id="forgot-email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />

              <Button
                title="Send Reset Code"
                onPress={handleForgotPassword}
                loading={loading}
                fullWidth
                icon="mail-outline"
              />
            </View>
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Remember your password?
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
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
    maxWidth: 320,
    lineHeight: 24,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  formContainer: {
    gap: spacing.md,
  },
  footerContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
});

export default ForgotPasswordScreen;
