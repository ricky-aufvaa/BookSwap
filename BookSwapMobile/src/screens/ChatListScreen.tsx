import React, { useState, useEffect, useCallback, useRef } from 'react';
import LottieView from "lottie-react-native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Avatar from '../components/Avatar';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { RootStackParamList, ChatRoom } from '../types';
import { apiService } from '../services/api';
import { formatRelativeTime } from '../utils/dateUtils';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;
type ChatListScreenRouteProp = RouteProp<RootStackParamList, 'ChatList'>;

interface Props {
  navigation: ChatListScreenNavigationProp;
  route: ChatListScreenRouteProp;
}

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfiles, setUserProfiles] = useState<{[username: string]: any}>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { updateUnreadCount } = useUnreadMessages();

  const getCurrentUser = async () => {
    try {
      const user = await apiService.getStoredUser();
      setCurrentUser(user);
    } catch (error) {
      console.log('Error getting current user:', error);
    }
  };

  const fetchUserProfile = async (username: string) => {
    if (userProfiles[username]) {
      return userProfiles[username]; // Return cached profile
    }

    try {
      const profile = await apiService.getUserProfile(username);
      setUserProfiles(prev => ({
        ...prev,
        [username]: profile
      }));
      return profile;
    } catch (error) {
      console.log(`Error fetching profile for ${username}:`, error);
      return null;
    }
  };

  const fetchChatRooms = async () => {
    try {
      // Add timeout for testing the animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const rooms = await apiService.getChatRooms();
      console.log('ChatList: Fetched rooms:', JSON.stringify(rooms[0], null, 2)); // Debug log
      setChatRooms(rooms);
      
      // Update unread count in context
      updateUnreadCount();
      
      // Always fetch user profiles for all other users in chat rooms
      if (currentUser) {
        const otherUsernames = rooms.map(room => {
          if (room.user1_username === currentUser.username) {
            return room.user2_username;
          } else {
            return room.user1_username;
          }
        }).filter(username => username);

        // Fetch profiles for all users (not just uncached ones) to ensure we have latest avatar data
        for (const username of otherUsernames) {
          fetchUserProfile(username);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChatRoomsQuietly = async () => {
    try {
      const rooms = await apiService.getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      // Silent error handling for background polling
      console.log('ChatList: Background fetch failed:', error);
    }
  };

  const startPolling = () => {
    if (isPolling || pollingIntervalRef.current) {
      return; // Already polling
    }

    console.log('ChatList: Starting chat list polling');
    setIsPolling(true);
    
    // Poll every 10 seconds for chat list updates (less frequent than individual chat)
    pollingIntervalRef.current = setInterval(() => {
      fetchChatRoomsQuietly();
    }, 10000);
  };

  const stopPolling = () => {
    console.log('ChatList: Stopping chat list polling');
    setIsPolling(false);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  // Refresh chat list when screen comes into focus and start polling
  useFocusEffect(
    useCallback(() => {
      getCurrentUser();
      fetchChatRooms();
      startPolling();
      
      return () => {
        stopPolling();
      };
    }, [])
  );

  const getOtherUserName = (room: ChatRoom): string => {
    if (!currentUser) {
      return room.user1_username || room.user2_username || 'Unknown User';
    }
    
    // Return the username that is NOT the current user
    if (room.user1_username === currentUser.username) {
      return room.user2_username || 'Unknown User';
    } else {
      return room.user1_username || 'Unknown User';
    }
  };

  const getOtherUserAvatarSeed = (room: any): string | null => {
    if (!currentUser) {
      return null;
    }
    
    const otherUsername = getOtherUserName(room);
    
    // First try to get avatar seed from API response
    let avatarSeed = null;
    if (room.user1_username === currentUser.username) {
      avatarSeed = room.user2_avatar_seed;
    } else {
      avatarSeed = room.user1_avatar_seed;
    }
    
    // If not available in API response, try from fetched user profiles
    if (!avatarSeed && userProfiles[otherUsername]) {
      avatarSeed = userProfiles[otherUsername].avatar_seed;
    }
    
    console.log(`ChatList: Avatar for ${otherUsername}:`, avatarSeed); // Debug log
    return avatarSeed || null;
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const otherUserName = getOtherUserName(item);
    const avatarSeed = getOtherUserAvatarSeed(item);
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ChatRoom', {
          roomId: item.id,
          otherUserName: otherUserName,
          bookTitle: item.book_title
        })}
      >
        <Card style={styles.chatRoomCard}>
          <View style={styles.chatRoomHeader}>
            <View style={styles.avatarContainer}>
              {avatarSeed ? (
                <Avatar 
                  seed={avatarSeed} 
                  size={50} 
                  style={styles.chatAvatar}
                />
              ) : (
                <View style={[styles.defaultAvatar, styles.chatAvatar]}>
                  <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
            </View>
          <View style={styles.chatRoomInfo}>
            <Text style={styles.userName}>{getOtherUserName(item)}</Text>
            <Text style={styles.bookTitle}>📚 {item.book_title}</Text>
            {item.last_message && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message}
              </Text>
            )}
          </View>
          <View style={styles.chatRoomMeta}>
            <Text style={styles.timeText}>
              {formatRelativeTime(item.last_message_at)}
            </Text>
            {item.unread_count && item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start chatting with book owners by searching for books and contacting the owners.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("../../assets/messages.json")}
              autoPlay
              loop
              style={styles.lottieAnimation}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.loadingText}>Loading your messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.component.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  listContainer: {
    flexGrow: 1,
    padding: spacing.component.screenPadding,
  },
  chatRoomCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  chatRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  chatAvatar: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  chatRoomInfo: {
    flex: 1,
  },
  userName: {
    ...textStyles.bodyLarge,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bookTitle: {
    ...textStyles.body,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  lastMessage: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  chatRoomMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadText: {
    ...textStyles.caption,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 300,
    height: 300,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default ChatListScreen;
