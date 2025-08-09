import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, layout } from '../constants/spacing';
import { InputProps } from '../types';

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  autoCapitalize = 'sentences',
  autoCorrect = false,
  keyboardType = 'default',
  id,
  name,
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const inputRef = useRef<TextInput>(null);

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setIsPasswordVisible(!isPasswordVisible);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = () => {
    if (secureTextEntry) {
      return isPasswordVisible ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && error.trim() && styles.inputContainerError,
        disabled && styles.inputContainerDisabled
      ]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={isFocused ? colors.inputFocus : colors.textTertiary}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            disabled && styles.inputDisabled
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          nativeID={id}
          accessibilityLabel={label || placeholder}
          {...(name && { name })}
          {...(autoComplete && { autoComplete })}
        />
        {(rightIcon || secureTextEntry) ? (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIcon}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            <Ionicons
              name={getRightIcon() as any}
              size={20}
              color={isFocused ? colors.inputFocus : colors.textTertiary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && error.trim() ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.component.inputMargin,
  },
  label: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: spacing.borderRadius.lg,
    paddingHorizontal: spacing.component.inputPaddingHorizontal,
    minHeight: layout.inputHeight,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: colors.inputFocus,
    boxShadow: '0px 0px 8px rgba(0, 123, 255, 0.2)',
    elevation: 3,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: colors.backgroundTertiary,
    opacity: 0.6,
  },
  input: {
    ...textStyles.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.component.inputPaddingVertical,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    color: colors.textTertiary,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  error: {
    ...textStyles.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default Input;
