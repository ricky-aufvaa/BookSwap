import React, { useState, useEffect, useRef } from 'react';
import LottieView from "lottie-react-native"; 

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

// Separate memoized component for the edit book form
const EditBookFormComponent = React.memo<{
  book: Book;
  onSubmit: (title: string, author: string) => void;
  loading: boolean;
}>(({ book, onSubmit, loading }) => {
  const [bookTitle, setBookTitle] = useState(book.title);
  const [bookAuthor, setBookAuthor] = useState(book.author || '');

  const handleSubmit = () => {
    onSubmit(bookTitle.trim(), bookAuthor.trim());
  };

  return (
    <View style={styles.formContainer}>
      <Input
        id="edit-book-title"
        name="title"
        placeholder="Enter the book title"
        value={bookTitle}
        onChangeText={setBookTitle}
        leftIcon="book-outline"
        autoCapitalize="none"
        autoComplete="off"
      />

      <Input
        id="edit-book-author"
        name="author"
        placeholder="Enter the author's name"
        value={bookAuthor}
        onChangeText={setBookAuthor}
        leftIcon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
      />

      <Button
        title="Update Book"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        icon="checkmark-outline"
      />
    </View>
  );
});

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
        autoCapitalize="none"
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [updatingBook, setUpdatingBook] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
          // Add timeout for testing the animation
          await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.log('handleAddBook called with:', { title, author });
    
    if (!title.trim() || !author.trim()) {
      Alert.alert('Error', 'Please fill in both title and author fields');
      return;
    }

    setAddingBook(true);
    try {
      console.log('Calling apiService.addBook with:', {
        title: title.trim(),
        author: author.trim(),
      });
      
      const newBook = await apiService.addBook({
        title: title.trim(),
        author: author.trim(),
      });

      console.log('Book added successfully:', newBook);
      setBooks(prev => [newBook, ...prev]);
      setShowAddModal(false);
      
      // Refresh the books list to ensure UI is updated
      await loadBooks();
      
      Alert.alert('Success', 'Book added to your library!');
    } catch (error: any) {
      console.error('Error adding book:', error);
      Alert.alert('Error', error.message || 'Failed to add book');
    } finally {
      setAddingBook(false);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowEditModal(true);
  };

  const handleUpdateBook = async (title: string, author: string) => {
    if (!editingBook || !title.trim() || !author.trim()) {
      Alert.alert('Error', 'Please fill in both title and author fields');
      return;
    }

    setUpdatingBook(true);
    try {
      const updatedBook = await apiService.updateBook(editingBook.id, {
        title: title.trim(),
        author: author.trim(),
      });

      setBooks(prev => prev.map(book => 
        book.id === editingBook.id ? updatedBook : book
      ));
      setShowEditModal(false);
      setEditingBook(null);
      
      Alert.alert('Success', 'Book updated successfully!');
    } catch (error: any) {
      console.error('Error updating book:', error);
      Alert.alert('Error', error.message || 'Failed to update book');
    } finally {
      setUpdatingBook(false);
    }
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteBook(book),
        },
      ]
    );
  };

  const confirmDeleteBook = async (book: Book) => {
    setDeletingBookId(book.id);
    try {
      await apiService.deleteBook(book.id);
      
      // Animate the book removal
      setBooks(prev => prev.filter(b => b.id !== book.id));
      
      Alert.alert('Success', 'Book deleted from your library');
    } catch (error: any) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', error.message || 'Failed to delete book');
    } finally {
      setDeletingBookId(null);
    }
  };

  const renderBookItem = ({ item, index }: { item: Book; index: number }) => {
    const isDeleting = deletingBookId === item.id;
    
    // Debug logging
    console.log('MyBooksScreen - Rendering book item:', {
      title: item.title,
      showActions: true,
      hasOnEdit: !!handleEditBook,
      hasOnDelete: !!handleDeleteBook,
      bookKeys: Object.keys(item)
    });
    
    return (
      <Animatable.View
        animation={isDeleting ? "fadeOutRight" : "fadeInUp"}
        duration={isDeleting ? layout.animation.fast : layout.animation.normal}
        delay={isDeleting ? 0 : index * 50}
      >
        <BookCard
          book={item}
          showOwner={false}
          showAvailability={false}
          showActions={true}
          onEdit={handleEditBook}
          onDelete={handleDeleteBook}
        />
      </Animatable.View>
    );
  };

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
            variant="primary"
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

  const renderEditBookModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowEditModal(false);
        setEditingBook(null);
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Button
            title="Cancel"
            onPress={() => {
              setShowEditModal(false);
              setEditingBook(null);
            }}
            variant="primary"
            size="small"
          />
          <Text style={styles.modalTitle}>Edit Book</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>

        <View style={styles.modalContent}>
          <Animatable.View
            animation="fadeInUp"
            duration={layout.animation.normal}
          >
            <Card>
              {editingBook && (
                <EditBookFormComponent
                  book={editingBook}
                  onSubmit={handleUpdateBook}
                  loading={updatingBook}
                />
              )}
            </Card>
          </Animatable.View>

          <Text style={styles.modalHint}>
            Update the title and author information for this book
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // if (loading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.centerContainer}>
  //         <Animatable.View
  //           animation="pulse"
  //           iterationCount="infinite"
  //           style={styles.loadingCard}
  //         >
  //           <Ionicons name="library-outline" size={48} color={colors.textTertiary} />
  //           <Text style={styles.loadingText}>Loading your library...</Text>
  //         </Animatable.View>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }
    if (loading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContainer}>
        <View style={styles.lottieContainer}>
          <LottieView
            source={require("../../assets/mylibrary.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingText}>Loading your library...</Text>
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
      {renderEditBookModal()}
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
    lottieContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
});

export default MyBooksScreen;
