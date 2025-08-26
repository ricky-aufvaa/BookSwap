import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
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
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';

const Tab = createBottomTabNavigator<TabParamList>();

// Custom icon component with badge for ChatList
const ChatIconWithBadge: React.FC<{ focused: boolean; color: string; size: number }> = ({ focused, color, size }) => {
  const { totalUnreadCount } = useUnreadMessages();
  const iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';

  return (
    <View style={styles.iconContainer}>
      <Animatable.View
        animation={focused ? 'bounceIn' : undefined}
        duration={300}
      >
        <Ionicons name={iconName as any} size={size} color={color} />
      </Animatable.View>
      {totalUnreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator: React.FC = () => {
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
              {/* <Ionicons name={iconName as any} size={size} color={color} /> */}
              <Ionicons name={iconName as any} size={size=20} color={color} />
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
          paddingHorizontal:spacing.xl,
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
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '',
          // tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: '',
          // tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="MyBooks"
        component={MyBooksScreen}
        options={{
          // tabBarLabel: 'My Books',
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="RequestBooks"
        component={RequestBooksScreen}
        options={{
          // tabBarLabel: 'Request',
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused, color, size }) => (
            <ChatIconWithBadge focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          // tabBarLabel: 'Profile',
          tabBarLabel: '',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error || '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TabNavigator;
