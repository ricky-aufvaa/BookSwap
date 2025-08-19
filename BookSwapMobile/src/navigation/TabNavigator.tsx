import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
              <Ionicons name={iconName as any} size={size=18} color={color} />
            </Animatable.View>
          );
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          height: 100,
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
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="MyBooks"
        component={MyBooksScreen}
        options={{
          tabBarLabel: 'My Books',
        }}
      />
      <Tab.Screen
        name="RequestBooks"
        component={RequestBooksScreen}
        options={{
          tabBarLabel: 'Request',
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
