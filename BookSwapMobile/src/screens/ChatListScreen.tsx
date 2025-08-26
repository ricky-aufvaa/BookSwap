import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchChatRooms = async () => {
    try {
      const rooms = await apiService.getChatRooms();
      setChatRooms(rooms);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  // Refresh chat list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChatRooms();
    }, [])
  );


  const getOtherUserName = (room: ChatRoom, currentUserId?: string) => {
    // For now, we'll use a simple approach since we don't have current user ID easily available
    // In a real app, you'd get this from your auth context
    return room.user1_username !== room.user2_username 
      ? (room.user1_username || room.user2_username)
      : room.user1_username;
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ChatRoom', {
        roomId: item.id,
        otherUserName: getOtherUserName(item),
        bookTitle: item.book_title
      })}
    >
      <Card style={styles.chatRoomCard}>
        <View style={styles.chatRoomHeader}>
          <View style={styles.avatarContainer}>
            <Avatar 
              seed={getOtherUserName(item)} 
              size={50} 
              style={styles.chatAvatar}
            />
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start chatting with book owners by searching for books and contacting the owners.
      </Text>
    </View>
  );

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
});

export default ChatListScreen;
