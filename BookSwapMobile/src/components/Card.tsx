import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import HapticFeedback from '../utils/haptics';
import { colors } from '../constants/colors';
import { spacing, layout } from '../constants/spacing';
import { CardProps } from '../types';

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
  padding = spacing.component.cardPadding,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.xl,
      padding,
      marginVertical: spacing.component.cardMargin / 2,
      boxShadow: `0px ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.1)`,
      elevation: elevation,
    };

    return baseStyle;
  };

  const CardContent = () => (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handlePressIn = () => {
    // No haptic feedback here to avoid triggering on empty spaces
  };

  if (onPress) {
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={layout.animation.normal}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.95}
          style={styles.touchable}
          onPressIn={handlePressIn}
          onPressOut={() => {}}
        >
          <CardContent />
        </TouchableOpacity>
      </Animatable.View>
    );
  }

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={layout.animation.normal}
    >
      <CardContent />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
  touchable: {
    borderRadius: spacing.borderRadius.xl,
  },
});

export default Card;
