import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { User } from '../types';

const { height: screenHeight } = Dimensions.get('window');

// Bottom sheet snap points
const SNAP_POINTS = {
  CLOSED: screenHeight,
  PEEK: screenHeight * 0.4, // 40% of screen
  EXPANDED: screenHeight * 0.2, // 80% of screen (20% from top)
};

interface BookOwnersModalProps {
  visible: boolean;
  onClose: () => void;
  bookTitle: string;
  bookAuthor?: string;
  owners: User[];
  loading: boolean;
  onContactOwner: (owner: User) => void;
  onAddToLibrary?: () => void;
}

const BookOwnersModal: React.FC<BookOwnersModalProps> = ({
  visible,
  onClose,
  bookTitle,
  bookAuthor,
  owners,
  loading,
  onContactOwner,
  onAddToLibrary,
}) => {
  const translateY = useSharedValue(SNAP_POINTS.CLOSED);
  const backdropOpacity = useSharedValue(0);

  // Initialize animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(SNAP_POINTS.PEEK, {
        damping: 50,
        stiffness: 200,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(SNAP_POINTS.CLOSED, {
        damping: 50,
        stiffness: 200,
      });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    translateY.value = withSpring(SNAP_POINTS.CLOSED, {
      damping: 50,
      stiffness: 200,
    });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const snapToPoint = useCallback((point: number) => {
    translateY.value = withSpring(point, {
      damping: 50,
      stiffness: 200,
    });
  }, []);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newY = context.startY + event.translationY;
      // Constrain movement between expanded and closed positions
      translateY.value = Math.max(SNAP_POINTS.EXPANDED, Math.min(SNAP_POINTS.CLOSED, newY));
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const currentY = translateY.value;
      
      // Determine snap point based on position and velocity
      if (velocity > 500) {
        // Fast downward swipe - close
        runOnJS(handleClose)();
      } else if (velocity < -500) {
        // Fast upward swipe - expand
        snapToPoint(SNAP_POINTS.EXPANDED);
      } else {
        // Snap to nearest point based on position
        const midPoint = (SNAP_POINTS.PEEK + SNAP_POINTS.EXPANDED) / 2;
        if (currentY < midPoint) {
          snapToPoint(SNAP_POINTS.EXPANDED);
        } else if (currentY > SNAP_POINTS.PEEK + 100) {
          runOnJS(handleClose)();
        } else {
          snapToPoint(SNAP_POINTS.PEEK);
        }
      }
    },
  });

  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleBarStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateY.value,
      [SNAP_POINTS.EXPANDED, SNAP_POINTS.PEEK],
      [1, 0.6],
      Extrapolate.CLAMP
    );
    return {
      opacity: progress,
    };
  });

  const renderOwnerItem = (owner: User, index: number) => (
    <Animatable.View
      key={owner.id}
      animation="fadeInUp"
      duration={300}
      delay={index * 50}
      style={styles.ownerItem}
    >
      <Card style={styles.ownerCard}>
        <View style={styles.ownerContent}>
          <View style={styles.ownerInfo}>
            <Avatar
              seed={owner.avatar_seed}
              size={50}
              style={styles.avatar}
            />
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{owner.username}</Text>
              <Text style={styles.ownerCity}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                {' '}{owner.city || 'Unknown City'}
              </Text>
            </View>
          </View>
          <Button
            title="Contact"
            onPress={() => onContactOwner(owner)}
            variant="primary"
            size="small"
            icon="chatbubble-outline"
          />
        </View>
      </Card>
    </Animatable.View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding book owners...</Text>
        </View>
      );
    }

    if (owners.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Owners Found</Text>
          <Text style={styles.emptySubtitle}>
            No one in your city currently has this book available.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.ownersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ownersListContent}
        bounces={false}
      >
        {owners.map((owner, index) => renderOwnerItem(owner, index))}
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
            {/* Handle Bar */}
            <Animated.View style={[styles.handleBar, handleBarStyle]} />
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title} numberOfLines={2}>
                  Who has "{bookTitle}"?
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {!loading && owners.length > 0 && (
                <Text style={styles.subtitle}>
                  {owners.length} {owners.length === 1 ? 'person' : 'people'} in your city
                </Text>
              )}
              
              {/* Add to Library Button */}
              {onAddToLibrary && (
                <View style={styles.addToLibraryContainer}>
                  <Button
                    title="Add to My Library"
                    onPress={onAddToLibrary}
                    variant="secondary"
                    size="medium"
                    icon="library-outline"
                  />
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {renderContent()}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight,
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.xs,
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  ownersList: {
    flex: 1,
  },
  ownersListContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  ownerItem: {
    marginBottom: spacing.sm,
  },
  ownerCard: {
    padding: spacing.md,
  },
  ownerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.md,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    ...textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ownerCity: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToLibraryContainer: {
    marginTop: spacing.md,
  },
});

export default BookOwnersModal;
