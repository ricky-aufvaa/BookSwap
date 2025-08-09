import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { ButtonProps } from '../types';

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = spacing.component.paddingSM;
        baseStyle.paddingHorizontal = spacing.component.paddingMD;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingVertical = spacing.component.paddingLG;
        baseStyle.paddingHorizontal = spacing.component.paddingXL;
        baseStyle.minHeight = 56;
        break;
      default:
        baseStyle.paddingVertical = spacing.component.buttonPaddingVertical;
        baseStyle.paddingHorizontal = spacing.component.buttonPaddingHorizontal;
        baseStyle.minHeight = layout.buttonHeight;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = colors.buttonSecondary;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.border;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1.5;
        baseStyle.borderColor = colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      default:
        baseStyle.backgroundColor = colors.buttonPrimary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...textStyles.button,
      marginLeft: icon ? spacing.sm : 0,
    };

    // Size styles
    if (size === 'small') {
      baseStyle.fontSize = textStyles.buttonSmall.fontSize;
      baseStyle.lineHeight = textStyles.buttonSmall.lineHeight;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.color = colors.buttonTextSecondary;
        break;
      case 'outline':
        baseStyle.color = colors.primary;
        break;
      case 'ghost':
        baseStyle.color = colors.primary;
        break;
      default:
        baseStyle.color = colors.buttonText;
    }

    return baseStyle;
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'secondary':
        return colors.buttonTextSecondary;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.buttonText;
    }
  };

  const handlePress = (event?: any) => {
    if (!disabled && !loading) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      onPress();
    }
  };

  const handlePressIn = (event?: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handlePressOut = (event?: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <Animatable.View
      animation="fadeIn"
      duration={layout.animation.fast}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={styles.loader}
          />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon as any}
                size={size === 'small' ? 16 : 20}
                color={getIconColor()}
              />
            )}
            <Text style={getTextStyle()}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  button: {
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  loader: {
    marginRight: 0,
  },
});

export default Button;
