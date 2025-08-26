import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrustScoreProps {
  trustScore: number;
  trustLevel: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const TrustScore: React.FC<TrustScoreProps> = ({ 
  trustScore, 
  trustLevel, 
  size = 'medium',
  showLabel = true 
}) => {
  const getTrustColor = (level: string) => {
    switch (level) {
      case 'highly_trusted':
        return '#4CAF50';
      case 'trusted':
        return '#2196F3';
      case 'reliable':
        return '#FF9800';
      case 'building_trust':
        return '#FFC107';
      case 'use_caution':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'highly_trusted':
        return 'shield-checkmark';
      case 'trusted':
        return 'shield';
      case 'reliable':
        return 'shield-outline';
      case 'building_trust':
        return 'hourglass';
      case 'use_caution':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getTrustLabel = (level: string) => {
    switch (level) {
      case 'highly_trusted':
        return 'Highly Trusted';
      case 'trusted':
        return 'Trusted';
      case 'reliable':
        return 'Reliable';
      case 'building_trust':
        return 'Building Trust';
      case 'use_caution':
        return 'Use Caution';
      default:
        return 'Unknown';
    }
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          score: styles.scoreSmall,
          label: styles.labelSmall,
          icon: 12,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          score: styles.scoreLarge,
          label: styles.labelLarge,
          icon: 24,
        };
      default:
        return {
          container: styles.containerMedium,
          score: styles.scoreMedium,
          label: styles.labelMedium,
          icon: 16,
        };
    }
  };

  const color = getTrustColor(trustLevel);
  const icon = getTrustIcon(trustLevel);
  const label = getTrustLabel(trustLevel);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={[styles.scoreContainer, { backgroundColor: color + '20', borderColor: color }]}>
        <Ionicons name={icon as any} size={sizeStyles.icon} color={color} />
        <Text style={[styles.score, sizeStyles.score, { color }]}>
          {Math.round(trustScore)}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, sizeStyles.label, { color }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerSmall: {
    gap: 2,
  },
  containerMedium: {
    gap: 4,
  },
  containerLarge: {
    gap: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  score: {
    fontWeight: 'bold',
  },
  scoreSmall: {
    fontSize: 12,
  },
  scoreMedium: {
    fontSize: 14,
  },
  scoreLarge: {
    fontSize: 18,
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
  },
  labelSmall: {
    fontSize: 10,
  },
  labelMedium: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 14,
  },
});

export default TrustScore;
