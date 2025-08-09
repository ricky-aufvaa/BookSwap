import React, { useState } from 'react';
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

interface SimpleInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  leftIcon?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  id?: string;
  name?: string;
  autoComplete?: 'username' | 'password' | 'new-password' | 'current-password' | 'email' | 'name' | 'off';
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  leftIcon,
  autoCapitalize = 'sentences',
  autoCorrect = false,
  keyboardType = 'default',
  id,
  name,
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={isFocused ? colors.inputFocus : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
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
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? colors.inputFocus : colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
  input: {
    ...textStyles.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.component.inputPaddingVertical,
    textAlignVertical: 'center',
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

export default SimpleInput;
