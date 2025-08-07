import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import Button from '../components/Button';
import Input from '../components/Input';

const SearchScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (route.params?.initialQuery) {
      handleSearch();
    }
  }, [route.params?.initialQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await apiService.searchBooks(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search books. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBook = async (bookTitle) => {
    try {
      await apiService.requestBook(bookTitle);
      Alert.alert(
        'Request Sent!',
        `Your request for "${bookTitle}" has been sent. We'll notify you if someone in ${user.city} has this book.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send book request. Please try again.');
    }
  };

  const handleFindOwners = async (bookTitle) => {
    try {
      const owners = await apiService.searchBookOwners(bookTitle);
      if (owners.length > 0) {
        navigation.navigate('BookOwners', { 
          bookTitle, 
          owners 
        });
      } else {
        Alert.alert(
          'No Owners Found',
          `No one in ${user.city} currently owns "${bookTitle}". Would you like to request it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Request Book', onPress: () => handleRequestBook(bookTitle) }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'No Owners Found',
        `No one in ${user.city} currently owns "${bookTitle}". Would you like to request it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Book', onPress: () => handleRequestBook(bookTitle) }
        ]
      );
    }
  };

  const BookResultCard = ({ book }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookHeader}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.authors && book.authors.length > 0 && (
            <Text style={styles.bookAuthor}>by {book.authors.join(', ')}</Text>
          )}
          {book.publishedDate && (
            <Text style={styles.bookYear}>Published: {book.publishedDate}</Text>
          )}
        </View>
        {book.available_in_city && (
          <View style={styles.availableBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </View>

      {book.description && (
        <Text style={styles.bookDescription} numberOfLines={3}>
          {book.description}
        </Text>
      )}

      <View style={styles.bookActions}>
        {book.available_in_city ? (
          <>
            <Button
              title={`Find Owners (${book.local_owners_count || 0})`}
              onPress={() => handleFindOwners(book.title)}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
            <Button
              title="Request"
              onPress={() => handleRequestBook(book.title)}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          </>
        ) : (
          <Button
            title="Request Book"
            onPress={() => handleRequestBook(book.title)}
            variant="outline"
            size="small"
            style={styles.actionButton}
          />
        )}
      </View>

      {book.available_in_city && (
        <View style={styles.cityInfo}>
          <Ionicons name="location" size={14} color="#6B7280" />
          <Text style={styles.cityText}>
            {book.local_owners_count} {book.local_owners_count === 1 ? 'person' : 'people'} in {user.city} {book.local_owners_count === 1 ? 'has' : 'have'} this book
          </Text>
        </View>
      )}
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {hasSearched ? 'No books found' : 'Search for books'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasSearched 
          ? 'Try searching with different keywords'
          : 'Enter a book title, author, or keyword to get started'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for books..."
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
          />
          <Button
            title="Search"
            onPress={handleSearch}
            disabled={!searchQuery.trim() || loading}
            loading={loading}
            style={styles.searchButton}
          />
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Searching books...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <Text style={styles.resultsLocation}>in {user.city}</Text>
            </View>
            {searchResults.map((book, index) => (
              <BookResultCard key={book.id || index} book={book} />
            ))}
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    minWidth: 80,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultsLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  bookYear: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  bookDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  bookActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cityText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SearchScreen;
