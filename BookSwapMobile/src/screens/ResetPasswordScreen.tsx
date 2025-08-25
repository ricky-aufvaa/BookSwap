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

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

interface Props {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleVerifyCode = async () => {
    if (!resetCode.trim()) {
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }

    if (resetCode.trim().length !== 6 || !resetCode.trim().match(/^\d+$/)) {
      Alert.alert('Error', 'Reset code must be a 6-digit number');
      return;
    }

    setVerifyingCode(true);
    try {
      await apiService.verifyResetCode({
        email,
        reset_code: resetCode.trim(),
      });
      
      Alert.alert('Success', 'Reset code verified! You can now set your new password.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim()) {
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }

    if (resetCode.trim().length !== 6 || !resetCode.trim().match(/^\d+$/)) {
      Alert.alert('Error', 'Reset code must be a 6-digit number');
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Error', 'Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.resetPassword({
        email,
        reset_code: resetCode.trim(),
        new_password: newPassword,
      });
      
      Alert.alert(
        'Password Reset Successful',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetSuccess');
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

  const handleResendCode = async () => {
    try {
      await apiService.forgotPassword({ email });
      Alert.alert('Code Resent', 'A new reset code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email} and your new password.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formContainer}>
              <Input
                id="reset-code"
                name="resetCode"
                placeholder="Enter 6-digit reset code"
                value={resetCode}
                onChangeText={setResetCode}
                leftIcon="key-outline"
                keyboardType="numeric"
                autoCapitalize="none"
              />

              <Button
                title="Verify Code"
                onPress={handleVerifyCode}
                loading={verifyingCode}
                variant="outline"
                size="small"
                icon="checkmark-circle-outline"
              />

              <View style={styles.divider} />

              <Input
                id="new-password"
                name="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                autoComplete="new-password"
                autoCapitalize="none"
              />

              <Input
                id="confirm-password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                autoComplete="new-password"
                autoCapitalize="none"
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                icon="refresh-outline"
              />
            </View>
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Didn't receive the code?
            </Text>
            <Button
              title="Resend Code"
              onPress={handleResendCode}
              variant="ghost"
              size="small"
            />
          </View>

          <View style={styles.footerContainer}>
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  footerContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
});

export default ResetPasswordScreen;
