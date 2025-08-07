import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
          }
        }
      ]
    );
  };

  const ProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.username}>{user?.username}</Text>
      <View style={styles.locationContainer}>
        <Ionicons name="location" size={16} color="#6B7280" />
        <Text style={styles.location}>{user?.city}</Text>
      </View>
    </View>
  );

  const MenuSection = ({ title, children }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, color = '#4F46E5' }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color = '#4F46E5' }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <ProfileHeader />

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <StatCard
            icon="library"
            value="0"
            label="Books Owned"
            color="#10B981"
          />
          <StatCard
            icon="swap-horizontal"
            value="0"
            label="Books Swapped"
            color="#F59E0B"
          />
          <StatCard
            icon="heart"
            value="0"
            label="Requests Made"
            color="#EF4444"
          />
        </View>

        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
          <MenuItem
            icon="location-outline"
            title="Change City"
            subtitle={`Currently in ${user?.city}`}
            onPress={() => Alert.alert('Coming Soon', 'City change will be available soon!')}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
          />
        </MenuSection>

        {/* App Section */}
        <MenuSection title="App">
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with BookSwap"
            onPress={() => Alert.alert('Help', 'For support, please contact us at support@bookswap.com')}
            color="#8B5CF6"
          />
          <MenuItem
            icon="information-circle-outline"
            title="About BookSwap"
            subtitle="Learn more about our app"
            onPress={() => Alert.alert('About', 'BookSwap v1.0\nConnect with book lovers in your city and exchange books easily!')}
            color="#06B6D4"
          />
          <MenuItem
            icon="star-outline"
            title="Rate App"
            subtitle="Help us improve BookSwap"
            onPress={() => Alert.alert('Thank You!', 'Thanks for using BookSwap! Rating feature will be available soon.')}
            color="#F59E0B"
          />
        </MenuSection>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            loading={loading}
            style={styles.logoutButton}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>BookSwap v1.0</Text>
          <Text style={styles.appDescription}>
            Made with ❤️ for book lovers everywhere
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dangerSection: {
    padding: 24,
    marginTop: 32,
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProfileScreen;
