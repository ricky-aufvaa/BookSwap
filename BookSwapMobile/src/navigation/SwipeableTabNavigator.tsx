import React, { useState, useCallback } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import HapticFeedback from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MyBooksScreen from '../screens/MyBooksScreen';
import RequestBooksScreen from '../screens/RequestBooksScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();
const { width: screenWidth } = Dimensions.get('window');

interface SwipeableTabWrapperProps {
  children: React.ReactNode;
  currentTabIndex: number;
  totalTabs: number;
}

const SwipeableTabWrapper: React.FC<SwipeableTabWrapperProps> = ({
  children,
  currentTabIndex,
  totalTabs,
}) => {
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  
  const tabs = ['Home', 'Search', 'MyBooks', 'RequestBooks', 'ChatList', 'Profile'];
  const translateX = useSharedValue(0);

  const triggerHapticFeedback = useCallback(() => {
    HapticFeedback.light();
  }, []);

  const triggerSelectionHaptic = useCallback(() => {
    HapticFeedback.tabSwitch();
  }, []);

  const handleSwipeLeft = useCallback(() => {
    const nextIndex = Math.min(currentTabIndex + 1, totalTabs - 1);
    if (nextIndex !== currentTabIndex) {
      navigation.navigate(tabs[nextIndex] as keyof TabParamList);
    }
  }, [currentTabIndex, totalTabs, navigation, tabs]);

  const handleSwipeRight = useCallback(() => {
    const prevIndex = Math.max(currentTabIndex - 1, 0);
    if (prevIndex !== currentTabIndex) {
      navigation.navigate(tabs[prevIndex] as keyof TabParamList);
    }
  }, [currentTabIndex, navigation, tabs]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(triggerHapticFeedback)();
    },
    onActive: (event) => {
      'worklet';
      // More responsive translation with smoother interpolation
      const maxTranslation = screenWidth * 0.25;
      const dampingFactor = 0.8; // Add damping for smoother feel
      
      translateX.value = interpolate(
        event.translationX,
        [-screenWidth, 0, screenWidth],
        [-maxTranslation * dampingFactor, 0, maxTranslation * dampingFactor],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      'worklet';
      const { translationX, velocityX } = event;
      const threshold = screenWidth * 0.15; // Reduced threshold for more responsive navigation
      const velocityThreshold = 600; // Reduced velocity threshold

      // Use faster timing animation for immediate response
      translateX.value = withTiming(0, {
        duration: 200, // Faster reset animation
      });

      // Determine if we should change tabs based on swipe distance or velocity
      if (
        (translationX < -threshold || velocityX < -velocityThreshold) &&
        currentTabIndex < totalTabs - 1
      ) {
        // Swipe left - go to next tab
        runOnJS(triggerSelectionHaptic)();
        runOnJS(handleSwipeLeft)();
      } else if (
        (translationX > threshold || velocityX > velocityThreshold) &&
        currentTabIndex > 0
      ) {
        // Swipe right - go to previous tab
        runOnJS(triggerSelectionHaptic)();
        runOnJS(handleSwipeRight)();
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  }, []);

  return (
    <PanGestureHandler 
      onGestureEvent={gestureHandler}
      activeOffsetX={[-10, 10]} // Require 10px movement to activate
      failOffsetY={[-20, 20]} // Allow vertical scrolling within screens
      shouldCancelWhenOutside={false}
      enableTrackpadTwoFingerGesture={false}
    >
      <Animated.View style={[styles.swipeWrapper, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const SwipeableTabNavigator: React.FC = () => {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const tabs = [
    { name: 'Home', component: HomeScreen },
    { name: 'Search', component: SearchScreen },
    { name: 'MyBooks', component: MyBooksScreen },
    { name: 'RequestBooks', component: RequestBooksScreen },
    { name: 'ChatList', component: ChatListScreen },
    { name: 'Profile', component: ProfileScreen },
  ];

  const createSwipeableScreen = (ScreenComponent: React.ComponentType<any>) => {
    return (props: any) => (
      <SwipeableTabWrapper
        currentTabIndex={currentTabIndex}
        totalTabs={tabs.length}
      >
        <ScreenComponent {...props} />
      </SwipeableTabWrapper>
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'MyBooks':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'RequestBooks':
              iconName = focused ? 'hand-left' : 'hand-left-outline';
              break;
            case 'ChatList':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return (
            <Animatable.View
              animation={focused ? 'bounceIn' : undefined}
              duration={300}
            >
              <Ionicons name={iconName as any} size={20} color={color} />
            </Animatable.View>
          );
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.xl,
          height: 80,
          shadowColor: colors.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          ...textStyles.caption,
          fontWeight: '600',
          marginTop: spacing.xs,
        },
        tabBarItemStyle: {
          paddingVertical: spacing.xs,
        },
      })}
      screenListeners={{
        state: (e) => {
          // Update current tab index when navigation state changes
          const index = e.data.state?.index;
          if (index !== undefined) {
            setCurrentTabIndex(index);
          }
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={createSwipeableScreen(HomeScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Search"
        component={createSwipeableScreen(SearchScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="MyBooks"
        component={createSwipeableScreen(MyBooksScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="RequestBooks"
        component={createSwipeableScreen(RequestBooksScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={createSwipeableScreen(ChatListScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={createSwipeableScreen(ProfileScreen)}
        options={{
          tabBarLabel: '',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  swipeWrapper: {
    flex: 1,
  },
});

export default SwipeableTabNavigator;
