import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../components/Button';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { RootStackParamList } from '../types';

type ResetSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetSuccess'>;
type ResetSuccessScreenRouteProp = RouteProp<RootStackParamList, 'ResetSuccess'>;

interface Props {
  navigation: ResetSuccessScreenNavigationProp;
  route: ResetSuccessScreenRouteProp;
}

const ResetSuccessScreen: React.FC<Props> = ({ navigation }) => {
  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.successCard}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={80} 
              color={colors.success || '#4CAF50'} 
            />
          </View>
          
          <Text style={styles.title}>Password Reset Successful!</Text>
          
          <Text style={styles.message}>
            Your password has been successfully reset. You can now log in with your new password.
          </Text>
          
          <Button
            title="Go to Login"
            onPress={handleGoToLogin}
            fullWidth
            icon="log-in-outline"
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.component.screenPadding,
  },
  successCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...textStyles.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
});

export default ResetSuccessScreen;
