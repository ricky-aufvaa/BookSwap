import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Badge {
  badge_type: string;
  earned_date: string;
  is_active: boolean;
}

interface TrustBadgesProps {
  badges: Badge[] | string[];
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  horizontal?: boolean;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({ 
  badges, 
  size = 'medium',
  maxVisible = 5,
  horizontal = true 
}) => {
  const getBadgeInfo = (badgeType: string) => {
    const badgeConfigs = {
      reliable: {
        label: 'Reliable',
        icon: 'shield-checkmark',
        color: '#4CAF50',
        description: '4.5+ rating with 10+ transactions'
      },
      quick_returner: {
        label: 'Quick Returner',
        icon: 'time',
        color: '#2196F3',
        description: '90%+ on-time returns'
      },
      new_user: {
        label: 'New User',
        icon: 'person-add',
        color: '#FF9800',
        description: 'New to the community'
      },
      verified: {
        label: 'Verified',
        icon: 'checkmark-circle',
        color: '#9C27B0',
        description: 'Verified account'
      },
      book_curator: {
        label: 'Book Curator',
        icon: 'library',
        color: '#795548',
        description: '20+ books listed'
      },
      active_member: {
        label: 'Active Member',
        icon: 'star',
        color: '#FF5722',
        description: '50+ transactions completed'
      },
      trusted_lender: {
        label: 'Trusted Lender',
        icon: 'hand-left',
        color: '#607D8B',
        description: '4.8+ rating as lender'
      }
    };

    return badgeConfigs[badgeType as keyof typeof badgeConfigs] || {
      label: badgeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: 'ribbon',
      color: '#9E9E9E',
      description: 'Special recognition'
    };
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'small':
        return {
          container: styles.badgeContainerSmall,
          text: styles.badgeTextSmall,
          icon: 12,
        };
      case 'large':
        return {
          container: styles.badgeContainerLarge,
          text: styles.badgeTextLarge,
          icon: 20,
        };
      default:
        return {
          container: styles.badgeContainerMedium,
          text: styles.badgeTextMedium,
          icon: 16,
        };
    }
  };

  // Convert badges to consistent format
  const badgeTypes = badges.map(badge => 
    typeof badge === 'string' ? badge : badge.badge_type
  );

  // Limit visible badges
  const visibleBadges = badgeTypes.slice(0, maxVisible);
  const remainingCount = badgeTypes.length - maxVisible;

  const sizeStyles = getSizeStyles(size);

  if (badgeTypes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No badges yet</Text>
      </View>
    );
  }

  const BadgeComponent = ({ badgeType }: { badgeType: string }) => {
    const badgeInfo = getBadgeInfo(badgeType);
    
    return (
      <View style={[
        styles.badge, 
        sizeStyles.container,
        { backgroundColor: badgeInfo.color + '20', borderColor: badgeInfo.color }
      ]}>
        <Ionicons 
          name={badgeInfo.icon as any} 
          size={sizeStyles.icon} 
          color={badgeInfo.color} 
        />
        <Text style={[styles.badgeText, sizeStyles.text, { color: badgeInfo.color }]}>
          {badgeInfo.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {horizontal ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {visibleBadges.map((badgeType, index) => (
            <BadgeComponent key={`${badgeType}-${index}`} badgeType={badgeType} />
          ))}
          {remainingCount > 0 && (
            <View style={[styles.badge, sizeStyles.container, styles.moreBadge]}>
              <Text style={[styles.badgeText, sizeStyles.text, styles.moreText]}>
                +{remainingCount}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.verticalContainer}>
          {visibleBadges.map((badgeType, index) => (
            <BadgeComponent key={`${badgeType}-${index}`} badgeType={badgeType} />
          ))}
          {remainingCount > 0 && (
            <View style={[styles.badge, sizeStyles.container, styles.moreBadge]}>
              <Text style={[styles.badgeText, sizeStyles.text, styles.moreText]}>
                +{remainingCount} more
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  verticalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeContainerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeContainerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeContainerLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontWeight: '500',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  badgeTextMedium: {
    fontSize: 12,
  },
  badgeTextLarge: {
    fontSize: 14,
  },
  moreBadge: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  moreText: {
    color: '#757575',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});

export default TrustBadges;
