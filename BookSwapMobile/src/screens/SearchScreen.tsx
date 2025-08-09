import React, { useState, useEffect } from 'react';
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
import BookCard from '../components/BookCard';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, GoogleBook } from '../types';
import { apiService } from '../services/api';

type SearchScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Search'>;
type SearchScreenRouteProp = RouteProp<TabParamList, 'Search'>;

interface Props {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearch();
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      const results = await apiService.searchBooks(searchQuery.trim());
      setSearchResults(results);
    } catch (error: any) {
      Alert.alert('Search Failed', error.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: GoogleBook) => {
    // Navigate to book details or show owners
    if (book.available_in_city) {
      // Show book owners
      Alert.alert(
        'Book Available',
        `This book is available from ${book.local_owners_count} owner(s) in your city. Would you like to see who owns it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Show Owners',
            onPress: () => {
              // Navigate to owners screen (we'll implement this later)
              Alert.alert('Feature Coming Soon', 'Book owners list will be available soon!');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Book Not Available',
        'This book is not currently available in your city. You can add it to your wishlist or check back later.',
        [
          { text: 'OK' },
          {
            text: 'Add to Wishlist',
            onPress: () => {
              Alert.alert('Feature Coming Soon', 'Wishlist feature will be available soon!');
            },
          },
        ]
      );
    }
  };

  const renderBookItem = ({ item, index }: { item: GoogleBook; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={layout.animation.normal}
      delay={index * 50}
    >
      <BookCard
        book={item}
        onPress={() => handleBookPress(item)}
        showAvailability={true}
      />
    </Animatable.View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching books...</Text>
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
              <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>Discover Books</Text>
              <Text style={styles.emptyStateSubtitle}>
                Search for books to find what's available in your community or discover new titles
              </Text>
            </View>
          </Card>
        </Animatable.View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <Animatable.View
          animation="fadeIn"
          duration={layout.animation.normal}
          style={styles.centerContainer}
        >
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyStateContent}>
              <Ionicons name="book-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>No Books Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try searching with different keywords or check your spelling
              </Text>
            </View>
          </Card>
        </Animatable.View>
      );
    }

    return null;
  };

  const availableCount = searchResults.filter(book => book.available_in_city).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={layout.animation.normal}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Search Books</Text>
          <Text style={styles.subtitle}>
            Find books available in your community
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
            id="search-books"
            name="search"
            placeholder="Search for books, authors, or titles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search-outline"
            autoCapitalize="none"
            autoComplete="off"
          />
        </Animatable.View>

        {/* Results Summary */}
        {hasSearched && searchResults.length > 0 && (
          <Animatable.View
            animation="fadeIn"
            duration={layout.animation.normal}
            style={styles.summaryContainer}
          >
            <Text style={styles.summaryText}>
              Found {searchResults.length} books
              {availableCount > 0 && (
                <Text style={styles.availableText}>
                  {' '}• {availableCount} available locally
                </Text>
              )}
            </Text>
          </Animatable.View>
        )}

        {/* Results List */}
        <FlatList
          data={searchResults}
          renderItem={renderBookItem}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onEndReachedThreshold={0.1}
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
  },
  summaryContainer: {
    marginBottom: spacing.md,
  },
  summaryText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  availableText: {
    color: colors.success,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
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

export default SearchScreen;
