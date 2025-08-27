import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import Avatar from './Avatar';
import Button from './Button';
import Card from './Card';
import TrustScore from './TrustScore';
import TrustBadges from './TrustBadges';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { User } from '../types';

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
              <View style={styles.ownerHeader}>
                <Text style={styles.ownerName}>{owner.username}</Text>
                <TrustScore 
                  trustScore={owner.trust_score || 100} 
                  trustLevel={owner.trust_level || 'building_trust'} 
                  size="small" 
                  showLabel={false}
                />
              </View>
              <Text style={styles.ownerCity}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                {' '}{owner.city || 'Unknown City'}
              </Text>
              <View style={styles.ownerTrustInfo}>
                <TrustBadges 
                  badges={owner.badges || []} 
                  size="small" 
                  maxVisible={2}
                  horizontal={true}
                />
              </View>
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
        contentContainerStyle={styles.ownersListContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        scrollEnabled={true}
        directionalLockEnabled={false}
        overScrollMode="auto"
        pagingEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {owners.map((owner, index) => renderOwnerItem(owner, index))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>
            Who has "{bookTitle}"?
          </Text>
          <View style={styles.placeholder} />
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

        {/* Content - Scrollable Area */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as close button for centering
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addToLibraryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  ownerName: {
    ...textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  ownerCity: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ownerTrustInfo: {
    marginTop: spacing.xs,
  },
});

export default BookOwnersModal;
