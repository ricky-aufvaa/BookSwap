import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import Button from '../components/Button';
import Input from '../components/Input';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecentBooks();
  }, []);

  const loadRecentBooks = async () => {
    try {
      setLoading(true);
      const books = await apiService.getMyBooks();
      setRecentBooks(books.slice(0, 3)); // Show only recent 3 books
    } catch (error) {
      console.error('Error loading recent books:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentBooks();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { initialQuery: searchQuery.trim() });
      setSearchQuery('');
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

  const QuickActionCard = ({ icon, title, subtitle, onPress, color = '#4F46E5' }) => (
    <TouchableOpacity style={[styles.actionCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.actionCardContent}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const BookCard = ({ book }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        {book.author && <Text style={styles.bookAuthor}>by {book.author}</Text>}
      </View>
      <Ionicons name="book" size={20} color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.username}!</Text>
          <Text style={styles.location}>📍 {user?.city}</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Find a Book</Text>
          <View style={styles.searchContainer}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for books (e.g., 1984, Harry Potter)"
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
            />
            <Button
              title="Search"
              onPress={handleSearch}
              disabled={!searchQuery.trim()}
              style={styles.searchButton}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <QuickActionCard
            icon="search"
            title="Browse Books"
            subtitle="Discover books available in your city"
            onPress={() => navigation.navigate('Search')}
            color="#10B981"
          />
          <QuickActionCard
            icon="add-circle"
            title="Add Your Books"
            subtitle="Share your books with others"
            onPress={() => navigation.navigate('MyBooks')}
            color="#F59E0B"
          />
          <QuickActionCard
            icon="people"
            title="Find Book Owners"
            subtitle="Connect with book owners nearby"
            onPress={() => navigation.navigate('Search')}
            color="#8B5CF6"
          />
        </View>

        {/* Recent Books */}
        {recentBooks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Recent Books</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyBooks')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentBooks.map((book, index) => (
              <BookCard key={book.id || index} book={book} />
            ))}
          </View>
        )}

        {/* Popular Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Book Requests</Text>
          <Text style={styles.sectionSubtitle}>
            These books are frequently requested in {user?.city}
          </Text>
          {['1984', 'To Kill a Mockingbird', 'The Great Gatsby'].map((title, index) => (
            <TouchableOpacity
              key={index}
              style={styles.popularBookCard}
              onPress={() => handleRequestBook(title)}
            >
              <View style={styles.popularBookInfo}>
                <Text style={styles.popularBookTitle}>{title}</Text>
                <Text style={styles.popularBookSubtitle}>Tap to request</Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
            </TouchableOpacity>
          ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
  section: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
  },
  popularBookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularBookInfo: {
    flex: 1,
  },
  popularBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  popularBookSubtitle: {
    fontSize: 14,
    color: '#4F46E5',
  },
});

export default HomeScreen;
