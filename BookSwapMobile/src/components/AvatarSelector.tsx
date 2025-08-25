import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { AVATAR_SEEDS } from '../utils/avatarUtils';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { textStyles } from '../constants/typography';

interface AvatarSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (seed: string | null) => void;
  currentSeed?: string;
  title?: string;
}

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 60;
const AVATARS_PER_ROW = 4;

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  currentSeed,
  title = 'Choose Your Avatar',
}) => {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(currentSeed || null);

  const handleSelect = (seed: string | null) => {
    setSelectedSeed(seed);
  };

  const handleConfirm = () => {
    onSelect(selectedSeed);
    onClose();
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedSeed(null);
            onSelect(null);
            onClose();
          },
        },
      ]
    );
  };

  const renderAvatarGrid = () => {
    const rows = [];
    for (let i = 0; i < AVATAR_SEEDS.length; i += AVATARS_PER_ROW) {
      const rowAvatars = AVATAR_SEEDS.slice(i, i + AVATARS_PER_ROW);
      rows.push(
        <View key={i} style={styles.avatarRow}>
          {rowAvatars.map((seed) => (
            <TouchableOpacity
              key={seed}
              style={[
                styles.avatarContainer,
                selectedSeed === seed && styles.selectedAvatarContainer,
              ]}
              onPress={() => handleSelect(seed)}
            >
              <Avatar seed={seed} size={AVATAR_SIZE} />
              {selectedSeed === seed && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
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
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Current Selection */}
        <View style={styles.currentSelection}>
          <Text style={styles.sectionTitle}>Current Selection:</Text>
          <View style={styles.currentAvatarContainer}>
            <Avatar seed={selectedSeed || undefined} size={80} />
            <Text style={styles.currentAvatarText}>
              {selectedSeed ? `Avatar ${selectedSeed}` : 'Default (No Avatar)'}
            </Text>
          </View>
        </View>

        {/* Default Option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Option:</Text>
          <TouchableOpacity
            style={[
              styles.defaultOption,
              selectedSeed === null && styles.selectedDefaultOption,
            ]}
            onPress={() => handleSelect(null)}
          >
            <Avatar seed={undefined} size={50} />
            <Text style={styles.defaultOptionText}>No Avatar (Default)</Text>
            {selectedSeed === null && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an Avatar:</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarGrid}>
              {renderAvatarGrid()}
            </View>
          </ScrollView>
        </View>

        {/* Remove Avatar Button */}
        {currentSeed && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveAvatar}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.removeButtonText}>Remove Current Avatar</Text>
          </TouchableOpacity>
        )}
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
  confirmButton: {
    padding: spacing.sm,
  },
  confirmText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  currentSelection: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  currentAvatarContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  currentAvatarText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDefaultOption: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  defaultOptionText: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  scrollView: {
    maxHeight: 400,
  },
  avatarGrid: {
    paddingBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedAvatarContainer: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeButtonText: {
    ...textStyles.body,
    color: colors.error,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
});

export default AvatarSelector;
