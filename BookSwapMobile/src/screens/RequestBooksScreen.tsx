import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import Input from '../components/Input';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, User } from '../types';
import { apiService } from '../services/api';

type RequestBooksScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'RequestBooks'>;
type RequestBooksScreenRouteProp = RouteProp<TabParamList, 'RequestBooks'>;

interface Props {
  navigation: RequestBooksScreenNavigationProp;
  route: RequestBooksScreenRouteProp;
}

const RequestBooksScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookOwners, setBookOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a book title to search');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const owners = await apiService.searchBookOwners(searchQuery.trim());
      setBookOwners(owners);
    } catch (error: any) {
      Alert.alert('Search Failed', error.message);
      setBookOwners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = (owner: User) => {
    Alert.alert(
      'Contact Owner',
      `Would you like to contact ${owner.username} about "${searchQuery}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact',
          onPress: () => {
            // In a real app, this would open a messaging interface or contact method
            Alert.alert(
              'Contact Information',
              `You can reach out to ${owner.username} in ${owner.city} about the book "${searchQuery}". In a full implementation, this would provide contact details or messaging functionality.`
            );
          },
        },
      ]
    );
  };

  const renderOwnerItem = ({ item, index }: { item: User; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={layout.animation.normal}
      delay={index * 100}
    >
      <Card style={styles.ownerCard}>
        <View style={styles.ownerInfo}>
          <View style={styles.ownerHeader}>
            <Ionicons name="person-circle-outline" size={40} color={colors.accent} />
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{item.username}</Text>
              <Text style={styles.ownerLocation}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                {' '}{item.city}
              </Text>
            </View>
          </View>
          <Button
            title="Contact"
            onPress={() => handleContactOwner(item)}
            variant="primary"
            size="small"
            icon="chatbubble-outline"
          />
        </View>
      </Card>
    </Animatable.View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching for book owners...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <Animatable.View
          animation="fadeIn"
          duration={layout.animation.slow}
          style={styles.centerContainer}
        >
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="book-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>Request Books</Text>
              <Text style={styles.emptyStateSubtitle}>
                Search for books you want to borrow and connect with people in your city who own them
              </Text>
            </View>
          </Card>
        </Animatable.View>
      );
    }

    if (bookOwners.length === 0) {
      return (
        <Animatable.View
          animation="fadeIn"
          duration={layout.animation.normal}
          style={styles.centerContainer}
        >
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="sad-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>No Owners Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                No one in your city currently owns "{searchQuery}". Try searching for a different book or check back later.
              </Text>
            </View>
          </Card>
        </Animatable.View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={layout.animation.normal}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Request Books</Text>
          <Text style={styles.subtitle}>
            Find and connect with book owners in your city
          </Text>
        </Animatable.View>

        {/* Search Input */}
        <Animatable.View
          animation="fadeInUp"
          duration={layout.animation.normal}
          delay={100}
          style={styles.searchContainer}
        >
          <Input
            id="request-book-search"
            name="bookTitle"
            placeholder="Enter the book title you're looking for..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="book-outline"
            autoCapitalize="words"
            autoComplete="off"
          />
          <Button
            title="Search Owners"
            onPress={handleSearch}
            loading={loading}
            fullWidth
            icon="search-outline"
          />
        </Animatable.View>

        {/* Results Summary */}
        {hasSearched && bookOwners.length > 0 && (
          <Animatable.View
            animation="fadeIn"
            duration={layout.animation.normal}
            style={styles.summaryContainer}
          >
            <Text style={styles.summaryText}>
              Found {bookOwners.length} owner{bookOwners.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
          </Animatable.View>
        )}

        {/* Owners List */}
        <FlatList
          data={bookOwners}
          renderItem={renderOwnerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
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
    padding: spacing.component.screenPadding,
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
  searchContainer: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  summaryContainer: {
    marginBottom: spacing.md,
  },
  summaryText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  ownerCard: {
    marginBottom: spacing.md,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  ownerName: {
    ...textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ownerLocation: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateCard: {
    width: '100%',
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
    maxWidth: 280,
  },
});

export default RequestBooksScreen;
