import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import AvatarSelector from '../components/AvatarSelector';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, User } from '../types';
import { apiService } from '../services/api';
import { formatMemberSince } from '../utils/dateUtils';

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
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // First try to get fresh user data from backend, fallback to stored data
      let userData = null;
      try {
        userData = await apiService.getProfile();
        console.log('ProfileScreen: Fresh user data from backend:', userData);
      } catch (profileError) {
        console.log('ProfileScreen: Failed to get fresh profile, using stored data');
        userData = await apiService.getStoredUser();
        console.log('ProfileScreen: Stored user data:', userData);
      }
      
      setUser(userData);
    } catch (error: any) {
      console.error('ProfileScreen: Error loading profile data:', error);
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
      
      // Trigger immediate auth check to update UI
      if ((global as any).forceAuthCheck) {
        (global as any).forceAuthCheck();
      }
    } catch (error: any) {
      console.log('Logout error:', error);
      // Even if API call fails, we still want to clear local data
      await apiService.clearAuthData();
      
      // Still trigger auth check even if API call failed
      if ((global as any).forceAuthCheck) {
        (global as any).forceAuthCheck();
      }
    } finally {
      setLoggingOut(false);
    }
  };

  const handleAvatarPress = () => {
    setShowAvatarSelector(true);
  };

  const handleAvatarSelect = async (avatarSeed: string | null) => {
    setUpdatingAvatar(true);
    try {
      const updatedUser = await apiService.updateAvatar(avatarSeed);
      setUser(updatedUser);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
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
          // animation="fadeInDown"
          animation="fadeInRight"
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
          // animation="fadeInUp"
          animation="fadeInRight"
          duration={layout.animation.normal}
          delay={100}
        >
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.avatarTouchable}
                onPress={handleAvatarPress}
                disabled={updatingAvatar}
              >
                <Avatar 
                  seed={user?.avatar_seed} 
                  size={150} 
                  style={styles.avatarStyle}
                />
                <View style={styles.avatarEditIndicator}>
                  <Ionicons name="camera" size={16} color={colors.background} />
                </View>
                {updatingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <Ionicons name="refresh" size={20} color={colors.background} />
                  </View>
                )}
              </TouchableOpacity>
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
                  Member since {user?.created_at ? formatMemberSince(user.created_at) : 'Unknown'}
                </Text>
              </View>
            </View>
          </Card>
        </Animatable.View>

        {/* Stats Cards */}
        <Animatable.View
          animation="fadeInRight"
          // animation="fadeInUp"
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
        {/* <Animatable.View
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
        </Animatable.View> */}

        {/* Logout Button */}
        <Animatable.View
          // animation="fadeInUp"
          animation="fadeInRight"
          duration={layout.animation.normal}
          delay={400}
          style={styles.logoutContainer}
        >
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="primary"
            loading={loggingOut}
            fullWidth
            icon="log-out-outline"
          />
        </Animatable.View>

        {/* App Info */}
        <Animatable.View
          // animation="fadeIn"
          animation="fadeInRight"
          duration={layout.animation.slow}
          delay={500}
          style={styles.appInfoContainer}
        >
          <Text style={styles.appInfo}>BookSwap v1.0.0</Text>
          <Text style={styles.appInfo}>Made with ❤️ for book lovers</Text>
        </Animatable.View>
      </ScrollView>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentSeed={user?.avatar_seed}
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
  scrollContent: {
    padding: spacing.component.screenPadding,
  },
  centerContainer: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
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
    justifyContent:"center",
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
    // backgroundColor:"red",
  },
  profileHeader: {
    gap:spacing.lg,
    // flexDirection: 'row',
    alignItems: 'center',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarStyle: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
  avatarEditIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
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
    justifyContent:'center',
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
    bottom:'auto',
    // marginTop:spacing['5xl'],
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
