export const spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
  
  // Component-specific spacing
  component: {
    // Padding
    paddingXS: 8,
    paddingSM: 12,
    paddingMD: 16,
    paddingLG: 20,
    paddingXL: 24,
    
    // Margins
    marginXS: 4,
    marginSM: 8,
    marginMD: 12,
    marginLG: 16,
    marginXL: 20,
    
    // Card spacing
    cardPadding: 20,
    cardMargin: 16,
    cardGap: 12,
    
    // Button spacing
    buttonPaddingVertical: 12,
    buttonPaddingHorizontal: 20,
    buttonMargin: 8,
    
    // Input spacing
    inputPaddingVertical: 14,
    inputPaddingHorizontal: 16,
    inputMargin: 8,
    
    // Screen spacing
    screenPadding: 20,
    screenMargin: 16,
    
    // List spacing
    listItemPadding: 16,
    listItemMargin: 8,
    listGap: 12,
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Icon sizes
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  
  // Avatar sizes
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    '2xl': 64,
    '3xl': 80,
  },
};

// Layout constants
export const layout = {
  // Screen dimensions (will be updated dynamically)
  window: {
    width: 0,
    height: 0,
  },
  
  // Header heights
  headerHeight: 60,
  tabBarHeight: 80,
  
  // Safe area
  safeAreaTop: 0,
  safeAreaBottom: 0,
  
  // Common dimensions
  buttonHeight: 48,
  inputHeight: 48,
  cardMinHeight: 120,
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  // Z-index values
  zIndex: {
    modal: 1000,
    overlay: 900,
    dropdown: 800,
    header: 700,
    fab: 600,
    card: 100,
    base: 1,
  },
};
