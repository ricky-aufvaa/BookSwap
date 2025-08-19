import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback utility for consistent user experience
 */
export class HapticFeedback {
  /**
   * Light impact feedback for subtle interactions
   * Use for: Card taps, list item selections, minor UI interactions
   */
  static light() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium impact feedback for standard interactions
   * Use for: Primary button presses, important actions
   */
  static medium() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy impact feedback for significant interactions
   * Use for: Destructive actions, major state changes
   */
  static heavy() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Selection feedback for picker-style interactions
   * Use for: Tab navigation, swipe gestures, selection changes
   */
  static selection() {
    return Haptics.selectionAsync();
  }

  /**
   * Success notification feedback
   * Use for: Successful form submissions, completed actions
   */
  static success() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification feedback
   * Use for: Validation errors, warnings
   */
  static warning() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification feedback
   * Use for: Failed actions, critical errors
   */
  static error() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Swipe gesture feedback - combination of selection and light impact
   * Use for: Swipe navigation between tabs
   */
  static swipe() {
    return Promise.all([
      Haptics.selectionAsync(),
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ]);
  }

  /**
   * Button press feedback based on button importance
   * @param variant - Button variant to determine feedback intensity
   */
  static button(variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') {
    switch (variant) {
      case 'primary':
        return this.medium();
      case 'secondary':
        return this.light();
      case 'outline':
      case 'ghost':
        return this.selection();
      default:
        return this.light();
    }
  }

  /**
   * Card interaction feedback
   * Use for: Book cards, user cards, any tappable cards
   */
  static card() {
    return this.light();
  }

  /**
   * Tab navigation feedback
   * Use for: Tab switches, navigation changes
   */
  static tabSwitch() {
    return this.selection();
  }

  /**
   * Long press feedback
   * Use for: Context menus, long press actions
   */
  static longPress() {
    return this.heavy();
  }

  /**
   * Pull to refresh feedback
   * Use for: Pull to refresh actions
   */
  static refresh() {
    return this.medium();
  }

  /**
   * Delete/destructive action feedback
   * Use for: Delete buttons, destructive actions
   */
  static destructive() {
    return this.heavy();
  }
}

// Export individual functions for convenience
export const {
  light,
  medium,
  heavy,
  selection,
  success,
  warning,
  error,
  swipe,
  button,
  card,
  tabSwitch,
  longPress,
  refresh,
  destructive
} = HapticFeedback;

export default HapticFeedback;
