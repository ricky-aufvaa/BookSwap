import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

import Button from '../components/Button';
import Input from '../components/Input';
import BookCard from '../components/BookCard';
import Card from '../components/Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { TabParamList, Book, AddBookForm } from '../types';
import { apiService } from '../services/api';

// Separate memoized component for the add book form
const AddBookFormComponent = React.memo<{
  onSubmit: (title: string, author: string) => void;
  loading: boolean;
}>(({ onSubmit, loading }) => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  const handleSubmit = () => {
    onSubmit(bookTitle.trim(), bookAuthor.trim());
  };

  // Reset form when submission is complete (loading becomes false after being true)
  const [wasLoading, setWasLoading] = useState(false);
  useEffect(() => {
    if (wasLoading && !loading) {
      setBookTitle('');
      setBookAuthor('');
    }
    setWasLoading(loading);
  }, [loading, wasLoading]);

  return (
    <View style={styles.formContainer}>
      <Input
        id="add-book-title"
        name="title"
        placeholder="Enter the book title"
        value={bookTitle}
        onChangeText={setBookTitle}
        leftIcon="book-outline"
        autoCapitalize="words"
        autoComplete="off"
      />

      <Input
        id="add-book-author"
        name="author"
        placeholder="Enter the author's name"
        value={bookAuthor}
        onChangeText={setBookAuthor}
        leftIcon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
      />

      <Button
        title="Add Book"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        icon="add-outline"
      />
    </View>
  );
});

type MyBooksScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'MyBooks'>;
type MyBooksScreenRouteProp = RouteProp<TabParamList, 'MyBooks'>;

interface Props {
  navigation: MyBooksScreenNavigationProp;
  route: MyBooksScreenRouteProp;
}

const MyBooksScreen: React.FC<Props> = ({ navigation }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingBook, setAddingBook] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const booksData = await apiService.getMyBooks();
      setBooks(booksData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const handleAddBook = async (title: string, author: string) => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Error', 'Please fill in both title and author fields');
      return;
    }

    setAddingBook(true);
    try {
      const newBook = await apiService.addBook({
        title: title.trim(),
        author: author.trim(),
      });

      setBooks(prev => [newBook, ...prev]);
      setShowAddModal(false);
      
      Alert.alert('Success', 'Book added to your library!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setAddingBook(false);
    }
  };

  const renderBookItem = ({ item, index }: { item: Book; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={layout.animation.normal}
      delay={index * 50}
    >
      <BookCard
        book={item}
        showOwner={false}
        showAvailability={false}
      />
    </Animatable.View>
  );

  const renderEmptyState = () => (
    <Animatable.View
      animation="fadeIn"
      duration={layout.animation.slow}
      style={styles.centerContainer}
    >
      <Card style={styles.emptyStateCard}>
        <View style={styles.emptyStateContent}>
          <Ionicons name="library-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyStateTitle}>Your Library is Empty</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start building your collection by adding books you own and want to share
          </Text>
          <Button
            title="Add Your First Book"
            onPress={() => setShowAddModal(true)}
            icon="add-outline"
          />
        </View>
      </Card>
    </Animatable.View>
  );

  const renderAddBookModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Button
            title="Cancel"
            onPress={() => setShowAddModal(false)}
            variant="ghost"
            size="small"
          />
          <Text style={styles.modalTitle}>Add Book</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        <View style={styles.modalContent}>
          <Animatable.View
            animation="fadeInUp"
            duration={layout.animation.normal}
          >
            <Card>
              <AddBookFormComponent
                onSubmit={handleAddBook}
                loading={addingBook}
              />
            </Card>
          </Animatable.View>

          <Text style={styles.modalHint}>
            Add books you own and are willing to share with others in your community
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.loadingCard}
          >
            <Ionicons name="library-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.loadingText}>Loading your library...</Text>
          </Animatable.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={layout.animation.normal}
          style={styles.headerContainer}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>My Library</Text>
            <Text style={styles.subtitle}>
              {books.length} book{books.length !== 1 ? 's' : ''} in your collection
            </Text>
          </View>
          
          <Button
            title="Add Book"
            onPress={() => setShowAddModal(true)}
            variant="primary"
            size="small"
            icon="add-outline"
          />
        </Animatable.View>

        {/* Books List */}
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </View>

      {renderAddBookModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
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
  listContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.component.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  modalHeaderSpacer: {
    width: 60, // Same width as Cancel button to center the title
  },
  modalContent: {
    flex: 1,
    padding: spacing.component.screenPadding,
  },
  formContainer: {
    gap: spacing.md,
  },
  modalHint: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});

export default MyBooksScreen;
