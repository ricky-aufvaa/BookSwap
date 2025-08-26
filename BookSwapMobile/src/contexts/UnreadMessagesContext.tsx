import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface UnreadMessagesContextType {
  totalUnreadCount: number;
  updateUnreadCount: () => Promise<void>;
  resetUnreadCount: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

interface UnreadMessagesProviderProps {
  children: ReactNode;
}

export const UnreadMessagesProvider: React.FC<UnreadMessagesProviderProps> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const updateUnreadCount = async () => {
    try {
      const chatRooms = await apiService.getChatRooms();
      const total = chatRooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
      setTotalUnreadCount(total);
    } catch (error) {
      console.log('Error updating unread count:', error);
    }
  };

  const resetUnreadCount = () => {
    setTotalUnreadCount(0);
  };

  // Update unread count periodically
  useEffect(() => {
    updateUnreadCount();
    
    const interval = setInterval(() => {
      updateUnreadCount();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const value = {
    totalUnreadCount,
    updateUnreadCount,
    resetUnreadCount,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = (): UnreadMessagesContextType => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
};
