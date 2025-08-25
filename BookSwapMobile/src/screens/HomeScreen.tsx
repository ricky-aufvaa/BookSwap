import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import BookCard from '../components/BookCard';
import Avatar from '../components/Avatar';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, Book, User } from '../types';
import { apiService } from '../services/api';

type HomeScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<TabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // First try to get fresh user data from backend, fallback to stored data
      let userData = null;
      try {
        userData = await apiService.getProfile();
        console.log('HomeScreen: Fresh user data from backend:', userData);
      } catch (profileError) {
        console.log('HomeScreen: Failed to get fresh profile, using stored data');
        userData = await apiService.getStoredUser();
        console.log('HomeScreen: Stored user data:', userData);
      }

      const booksData = await apiService.getMyBooks();

      setUser(userData);
      setRecentBooks(booksData.slice(0, 3)); // Show only recent 3 books
      setTotalBooks(booksData.length)
    } catch (error: any) {
      console.error('HomeScreen: Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.loadingCard}
          >
            <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.loadingText}>Loading your library...</Text>
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
          <View style={styles.userSection}>
            <Avatar 
              seed={user?.avatar_seed} 
              size={50} 
              style={styles.headerAvatar}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.username || 'Reader'}!
              </Text>
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                {' '}{user?.city || 'Unknown City'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Button
              title="Search Books"
              onPress={() => navigation.navigate('Search')}
              variant="primary"
              size="small"
              icon="search-outline"
            />
          </View>
        </Animatable.View>

        {/* Quick Stats */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={100}
        >
          <Card style={styles.statsCard}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalBooks}</Text>
                <Text style={styles.statLabel}>Books Owned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Books Shared</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Books Borrowed</Text>
              </View>
            </View>
          </Card>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={200}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Card onPress={() => navigation.navigate('MyBooks')} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Ionicons name="library-outline" size={32} color={colors.accent} />
                <Text style={styles.actionTitle}>My Library</Text>
                <Text style={styles.actionSubtitle}>Manage your books</Text>
              </View>
            </Card>
            
            <Card onPress={() => navigation.navigate('Search')} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Ionicons name="search-outline" size={32} color={colors.success} />
                <Text style={styles.actionTitle}>Find Books</Text>
                <Text style={styles.actionSubtitle}>Search & discover</Text>
              </View>
            </Card>
          </View>
        </Animatable.View>

        {/* Recent Books */}
        {recentBooks.length > 0 && (
          <Animatable.View
            animation="fadeInUp"
            duration={layout.animation.normal}
            delay={300}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Recent Books</Text>
              <Button
                title="View All"
                onPress={() => navigation.navigate('MyBooks')}
                variant="secondary"
                size="small"
              />
            </View>
            
            <View style={styles.booksContainer}>
              {recentBooks.map((book, index) => (
                <Animatable.View
                  key={book.id}
                  animation="fadeInUp"
                  duration={layout.animation.normal}
                  delay={400 + index * 100}
                >
                  <BookCard
                    book={book}
                    showOwner={false}
                    showAvailability={false}
                  />
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>
        )}

        {/* Empty State */}
        {recentBooks.length === 0 && (
          <Animatable.View
            animation="fadeIn"
            duration={layout.animation.slow}
            delay={300}
            style={styles.emptyStateContainer}
          >
            <Card style={styles.emptyStateCard}>
              <View style={styles.emptyStateContent}>
                <Ionicons name="book-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>Start Your Library</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Add your first book to begin sharing with your community
                </Text>
                <Button
                  title="Add Your First Book"
                  onPress={() => navigation.navigate('MyBooks')}
                  icon="add-outline"
                />
              </View>
            </Card>
          </Animatable.View>
        )}
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
  loadingContainer: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  location: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  headerActions: {
    marginLeft: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.lg,
    borderRadius: 22
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...textStyles.h3,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md
  },
  actionCard: {
    flex: 1,
  },
  actionContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  actionTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  booksContainer: {
    gap: spacing.sm,
  },
  emptyStateContainer: {
    marginTop: spacing.xl,
  },
  emptyStateCard: {
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
});

export default HomeScreen;
