import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, User } from '../types';
import { apiService } from '../services/api';

type ProfileScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<TabParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await apiService.getStoredUser();
      setUser(userData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Call the backend logout API first to invalidate the token
      await apiService.logout();
      console.log('Logout successful');
    } catch (error: any) {
      console.log('Logout error:', error);
      // Even if API call fails, we still want to clear local data
      await apiService.clearAuthData();
    } finally {
      setLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.loadingCard}
          >
            <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </Animatable.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={layout.animation.normal}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Manage your account and preferences
          </Text>
        </Animatable.View>

        {/* Profile Card */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={100}
        >
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person"
                  size={48}
                  color={colors.background}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{user?.username}</Text>
                <View style={styles.locationContainer}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.location}>{user?.city}</Text>
                </View>
                <Text style={styles.joinDate}>
                  Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </Text>
              </View>
            </View>
          </Card>
        </Animatable.View>

        {/* Stats Cards */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={200}
          style={styles.statsContainer}
        >
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="library-outline" size={32} color={colors.accent} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Books Owned</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="swap-horizontal-outline" size={32} color={colors.success} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Books Shared</Text>
            </View>
          </Card>
        </Animatable.View>

        {/* Menu Options */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={300}
          style={styles.menuContainer}
        >
          <Text style={styles.sectionTitle}>Settings</Text>

          <Card style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
            </View>
          </Card>

          <Card style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="shield-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Privacy</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
            </View>
          </Card>

          <Card style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
            </View>
          </Card>

          <Card style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>About</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </Animatable.View>

        {/* Logout Button */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={400}
          style={styles.logoutContainer}
        >
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            loading={loggingOut}
            fullWidth
            icon="log-out-outline"
          />
        </Animatable.View>

        {/* App Info */}
        <Animatable.View
          animation="fadeIn"
          duration={layout.animation.slow}
          delay={500}
          style={styles.appInfoContainer}
        >
          <Text style={styles.appInfo}>BookSwap v1.0.0</Text>
          <Text style={styles.appInfo}>Made with ❤️ for book lovers</Text>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.component.screenPadding,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  headerContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  joinDate: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuCard: {
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  logoutContainer: {
    marginBottom: spacing.xl,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  appInfo: {
    ...textStyles.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

export default ProfileScreen;
