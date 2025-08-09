import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import Card from './Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { BookCardProps, GoogleBook, Book } from '../types';

const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  showOwner = false,
  showAvailability = false,
}) => {
  const isGoogleBook = (book: GoogleBook | Book): book is GoogleBook => {
    return 'authors' in book || 'imageLinks' in book;
  };

  const getBookImage = () => {
    if (isGoogleBook(book) && book.imageLinks?.thumbnail) {
      return book.imageLinks.thumbnail;
    }
    return null;
  };

  const getBookTitle = () => {
    return book.title;
  };

  const getBookAuthor = () => {
    if (isGoogleBook(book)) {
      return book.authors?.join(', ') || 'Unknown Author';
    }
    return book.author || 'Unknown Author';
  };

  const getBookOwner = () => {
    if (!isGoogleBook(book)) {
      return book.owner_username;
    }
    return null;
  };

  const getAvailabilityInfo = () => {
    if (isGoogleBook(book) && showAvailability) {
      return {
        available: book.available_in_city || false,
        ownersCount: book.local_owners_count || 0,
      };
    }
    return null;
  };

  const getBookDescription = () => {
    if (isGoogleBook(book) && book.description) {
      return book.description.length > 120 
        ? `${book.description.substring(0, 120)}...`
        : book.description;
    }
    return null;
  };

  const getRating = () => {
    if (isGoogleBook(book) && book.averageRating) {
      return {
        rating: book.averageRating,
        count: book.ratingsCount || 0,
      };
    }
    return null;
  };

  const availabilityInfo = getAvailabilityInfo();
  const rating = getRating();
  const description = getBookDescription();
  const owner = getBookOwner();

  return (
    <Card onPress={onPress} padding={0}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          {getBookImage() ? (
            <Image
              source={{ uri: getBookImage()! }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="book-outline"
                size={32}
                color={colors.textTertiary}
              />
            </View>
          )}
          
          {availabilityInfo && availabilityInfo.available && (
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              style={styles.availabilityBadge}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
            </Animatable.View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {getBookTitle()}
            </Text>
            
            {rating && (
              <View style={styles.ratingContainer}>
                <Ionicons
                  name="star"
                  size={14}
                  color={colors.warning}
                />
                <Text style={styles.ratingText}>
                  {rating.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.author} numberOfLines={1}>
            {getBookAuthor()}
          </Text>

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          <View style={styles.footerContainer}>
            {owner && showOwner && (
              <View style={styles.ownerContainer}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.ownerText}>
                  {owner}
                </Text>
              </View>
            )}

            {availabilityInfo && (
              <View style={styles.availabilityContainer}>
                {availabilityInfo.available ? (
                  <View style={styles.availableTag}>
                    <Text style={styles.availableText}>
                      Available ({availabilityInfo.ownersCount})
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unavailableTag}>
                    <Text style={styles.unavailableText}>
                      Not available locally
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.component.cardPadding,
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  bookImage: {
    width: 80,
    height: 120,
    borderRadius: spacing.borderRadius.md,
  },
  placeholderImage: {
    width: 80,
    height: 120,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.full,
    padding: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.h4,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  } as TextStyle,
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  ratingText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  } as TextStyle,
  author: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,
  description: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  } as TextStyle,
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  } as TextStyle,
  availabilityContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  availableTag: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  availableText: {
    ...textStyles.caption,
    color: colors.success,
    fontWeight: '600',
  } as TextStyle,
  unavailableTag: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  unavailableText: {
    ...textStyles.caption,
    color: colors.textTertiary,
    fontWeight: '500',
  } as TextStyle,
});

export default BookCard;
