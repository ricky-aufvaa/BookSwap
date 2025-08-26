import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { User } from '../types';

const { height: screenHeight } = Dimensions.get('window');

interface BookOwnersModalProps {
  visible: boolean;
  onClose: () => void;
  bookTitle: string;
  owners: User[];
  loading: boolean;
  onContactOwner: (owner: User) => void;
}

const BookOwnersModal: React.FC<BookOwnersModalProps> = ({
  visible,
  onClose,
  bookTitle,
  owners,
  loading,
  onContactOwner,
}) => {
  const modalRef = useRef<Animatable.View>(null);

  useEffect(() => {
    if (visible && modalRef.current) {
      modalRef.current.slideInUp(300);
    }
  }, [visible]);

  const handleClose = async () => {
    if (modalRef.current) {
      await modalRef.current.slideOutDown(250);
    }
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

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
      >
        {owners.map((owner, index) => renderOwnerItem(owner, index))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animatable.View
              ref={modalRef}
              style={styles.modalContainer}
              useNativeDriver={true}
            >
              {/* Handle Bar */}
              <View style={styles.handleBar} />
              
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
              </View>

              {/* Content */}
              <View style={styles.content}>
                {renderContent()}
              </View>
            </Animatable.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.3,
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
});

export default BookOwnersModal;
