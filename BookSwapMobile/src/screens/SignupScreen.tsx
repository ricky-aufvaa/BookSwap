import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import AvatarSelector from '../components/AvatarSelector';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { RootStackParamList, SignupForm } from '../types';
import { apiService } from '../services/api';

// Separate memoized component for the signup form
const SignupFormComponent = React.memo<{
  onSubmit: (username: string, email: string, city: string, password: string, confirmPassword: string) => void;
  loading: boolean;
  selectedAvatarSeed: string | null;
  onShowAvatarSelector: () => void;
}>(({ onSubmit, loading, selectedAvatarSeed, onShowAvatarSelector }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(username.trim(), email.trim(), city.trim(), password, confirmPassword);
  };

  // Reset form when submission is complete (loading becomes false after being true)
  const [wasLoading, setWasLoading] = useState(false);
  useEffect(() => {
    if (wasLoading && !loading) {
      setUsername('');
      setEmail('');
      setCity('');
      setPassword('');
      setConfirmPassword('');
    }
    setWasLoading(loading);
  }, [loading, wasLoading]);

  return (
    <View style={styles.formContainer}>
      {/* Avatar Selection */}
      <View style={styles.avatarSection}>
        <Text style={styles.avatarSectionTitle}>Choose Your Avatar (Optional)</Text>
        <TouchableOpacity 
          style={styles.avatarSelector}
          onPress={onShowAvatarSelector}
        >
          <Avatar seed={selectedAvatarSeed || undefined} size={60} />
          <View style={styles.avatarSelectorText}>
            <Text style={styles.avatarSelectorTitle}>
              {selectedAvatarSeed ? `Avatar ${selectedAvatarSeed}` : 'Select Avatar'}
            </Text>
            <Text style={styles.avatarSelectorSubtitle}>
              {selectedAvatarSeed ? 'Tap to change' : 'Tap to choose'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <Input
        id="signup-username"
        name="username"
        placeholder="Choose a username"
        value={username}
        onChangeText={setUsername}
        leftIcon="person-outline"
        autoCapitalize="none"
        autoComplete="username"
      />

      <Input
        id="signup-email"
        name="email"
        placeholder="Enter your email address"
        value={email}
        onChangeText={setEmail}
        leftIcon="mail-outline"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />

      <Input
        id="signup-city"
        name="city"
        placeholder="Enter your city"
        value={city}
        onChangeText={setCity}
        leftIcon="location-outline"
        autoCapitalize="words"
        autoComplete="off"
      />

      <Input
        id="signup-password"
        name="password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        leftIcon="lock-closed-outline"
        autoComplete="new-password"
        autoCapitalize="none"
      />

      <Input
        id="signup-confirm-password"
        name="confirmPassword"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        leftIcon="lock-closed-outline"
        autoComplete="new-password"
        autoCapitalize="none"
      />

      <Button
        title="Create Account"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        icon="person-add-outline"
      />
    </View>
  );
});

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;
type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
  route: SignupScreenRouteProp;
}

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleSignup = async (username: string, email: string, city: string, password: string, confirmPassword: string) => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'City is required');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // First create the account
      await apiService.signup({
        username: username.trim(),
        email: email.trim(),
        password: password,
        city: city.trim(),
        avatar_seed: selectedAvatarSeed || undefined,
      });

      // Then immediately login to get proper authentication
      await apiService.login({
        username: username.trim(),
        password: password,
      });

      // Show success dialog and navigate after dismissal
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Trigger auth check to automatically navigate to home screen
              if ((global as any).forceAuthCheck) {
                (global as any).forceAuthCheck();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
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
          scrollEnabled={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Join BookSwap</Text>
            <Text style={styles.subtitle}>
              Create an account to start sharing books with your community
            </Text>
          </View>

          <Card style={styles.formCard}>
            <SignupFormComponent
              onSubmit={handleSignup}
              loading={loading}
              selectedAvatarSeed={selectedAvatarSeed}
              onShowAvatarSelector={() => setShowAvatarSelector(true)}
            />
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Already have an account?
            </Text>
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              size="small"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={(seed) => {
          setSelectedAvatarSeed(seed);
          setShowAvatarSelector(false);
        }}
        currentSeed={selectedAvatarSeed || undefined}
        title="Choose Your Avatar"
      />
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
    gap: spacing.md
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  avatarSection: {
    marginBottom: spacing.md,
  },
  avatarSectionTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  avatarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarSelectorText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  avatarSelectorTitle: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  avatarSelectorSubtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
});

export default SignupScreen;
