import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '../components/Avatar';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { RootStackParamList, ChatMessage, ChatRoom } from '../types';
import { apiService } from '../services/api';
import { formatMessageTime } from '../utils/dateUtils';

type ChatRoomScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

interface Props {
  navigation: ChatRoomScreenNavigationProp;
  route: ChatRoomScreenRouteProp;
}

const ChatRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, otherUserName, bookTitle } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Book Details',
              `Discussing: ${bookTitle}`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName, bookTitle]);

  useEffect(() => {
    const initializeChat = async () => {
      await getCurrentUser();
      await fetchMessages();
      await fetchOtherUserProfile();
      startPolling();
    };
    
    initializeChat();

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [roomId]);

  // Start/stop polling when screen focus changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ChatRoom: Screen focused, starting polling');
      startPolling();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('ChatRoom: Screen blurred, stopping polling');
      stopPolling();
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  const getCurrentUser = async () => {
    try {
      const user = await apiService.getStoredUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchOtherUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile(otherUserName);
      setOtherUserProfile(profile);
    } catch (error) {
      console.log(`Error fetching profile for ${otherUserName}:`, error);
    }
  };

  const fetchMessages = async () => {
    try {
      const chatRoomData: any = await apiService.getChatRoomWithMessages(roomId);
      setChatRoom(chatRoomData);
      setMessages(chatRoomData.messages || []);
      
      // Extract other user's avatar seed from chat room data
      if (currentUser && chatRoomData) {
        const otherUserAvatarSeed = chatRoomData.user1_username === currentUser.username 
          ? chatRoomData.user2_avatar_seed 
          : chatRoomData.user1_avatar_seed;
        
        setOtherUserProfile({ avatar_seed: otherUserAvatarSeed });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesQuietly = async () => {
    try {
      const chatRoomData: ChatRoom = await apiService.getChatRoomWithMessages(roomId);
      const newMessages = chatRoomData.messages || [];
      
      // Only update if there are new messages
      if (newMessages.length > messages.length) {
        console.log('ChatRoom: New messages detected, updating UI');
        setMessages(newMessages);
        setChatRoom(chatRoomData);
        
        // Auto-scroll to bottom if user is near the bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      // Silent error handling for background polling
      console.log('ChatRoom: Background message fetch failed:', error);
    }
  };

  const startPolling = () => {
    if (isPolling || pollingIntervalRef.current) {
      return; // Already polling
    }

    console.log('ChatRoom: Starting message polling');
    setIsPolling(true);
    
    // Poll every 3 seconds for new messages
    pollingIntervalRef.current = setInterval(() => {
      fetchMessagesQuietly();
    }, 3000);
  };

  const stopPolling = () => {
    console.log('ChatRoom: Stopping message polling');
    setIsPolling(false);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await apiService.sendMessage(roomId, { message: messageText });
      setMessages(prev => [...prev, sentMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };


  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    // Properly identify if this is the current user's message
    const isMyMessage = currentUser && item.sender_username === currentUser.username;
    const showTime = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 300000; // 5 minutes

    // Get the correct avatar seed for the message sender
    const getAvatarSeed = () => {
      if (isMyMessage) {
        // For current user's messages, use their avatar_seed
        return currentUser?.avatar_seed;
      } else {
        // For other user's messages, use the fetched profile's avatar_seed
        return otherUserProfile?.avatar_seed;
      }
    };

    const renderAvatar = (seed: string | null | undefined) => {
      if (seed) {
        return (
          <Avatar 
            seed={seed} 
            size={32} 
            style={styles.messageAvatar}
          />
        );
      } else {
        return (
          <View style={[styles.defaultMessageAvatar, styles.messageAvatar]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
          </View>
        );
      }
    };

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow
        ]}>
          {!isMyMessage && renderAvatar(getAvatarSeed())}
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
          </View>
          {isMyMessage && (
            <Avatar 
              seed={getAvatarSeed()} 
              size={32} 
              style={styles.messageAvatar}
            />
          )}
        </View>
        {showTime && (
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(item.created_at)}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={60} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Start the conversation</Text>
      <Text style={styles.emptySubtitle}>
        Say hello to {otherUserName} about "{bookTitle}"
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={`Message ${otherUserName}...`}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons 
                name={sending ? "hourglass-outline" : "send"} 
                size={20} 
                color={(!newMessage.trim() || sending) ? colors.textSecondary : 'white'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerButton: {
    marginRight: spacing.md,
  },
  messagesContainer: {
    flexGrow: 1,
    padding: spacing.md,
  },
  messageContainer: {
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    maxWidth: '100%',
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    ...textStyles.body,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  messageTime: {
    ...textStyles.caption,
    marginTop: spacing.xs,
  },
  myMessageTime: {
    color: colors.textSecondary,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.textSecondary,
    textAlign: 'left',
  },
  inputContainer: {
    borderTopWidth: 5,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: -30,
    // alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    // paddingVertical: spacing.xs,
    paddingVertical: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    maxHeight: 100,
    paddingVertical: spacing.md,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
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
  defaultMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatRoomScreen;
