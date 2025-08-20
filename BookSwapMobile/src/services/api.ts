import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserCreate, UserLogin, AuthResponse, Book, BookCreate, GoogleBook, ChatRoom, ChatRoomCreate, ChatMessage, ChatMessageCreate } from '../types';
import { API_CONFIG } from '../config';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.API_BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
          if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          // Silent error handling
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await this.clearAuthData();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async signup(userData: UserCreate): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/signup', userData);
      const { access_token, id, username, city, created_at } = response.data;
      
      // Store token and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      }
      
      const user = { id, username, city, created_at };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      return { access_token, user, token_type: 'bearer' };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Signup failed');
    }
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    try {
      console.log('ApiService: Attempting login for:', credentials.username);
      const response: AxiosResponse<any> = await this.api.post('/login', credentials);
      const { access_token, user } = response.data;
      
      console.log('ApiService: Login response:', { access_token: access_token ? 'present' : 'missing', user });
      
      // Store token and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
        console.log('ApiService: Token stored successfully');
      }
      
      if (user) {
        // Store complete user data including created_at
        const userWithId = { 
          id: user.id || 'temp-id', 
          username: user.username, 
          city: user.city,
          created_at: user.created_at
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithId));
        console.log('ApiService: User data stored:', userWithId);
      }
      
      return { access_token, user, token_type: 'bearer' };
    } catch (error: any) {
      console.error('ApiService: Login error:', error);
      if (this.isNetworkError(error)) {
        throw new Error('Cannot connect to server. Please check your network connection and ensure the backend server is running.');
      }
      
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  async validateToken(): Promise<{ valid: boolean; username?: string }> {
    try {
      console.log('ApiService: Validating token...');
      const response = await this.api.get('/validate');
      console.log('ApiService: Token validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('ApiService: Token validation failed:', error);
      return { valid: false };
    }
  }

  // Book methods
  async getMyBooks(): Promise<Book[]> {
    try {
      const response: AxiosResponse<Book[]> = await this.api.get('/books/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch books');
    }
  }

  async addBook(bookData: BookCreate): Promise<Book> {
    try {
      const response: AxiosResponse<Book> = await this.api.post('/books/', bookData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add book');
    }
  }

  async searchBooks(query: string): Promise<GoogleBook[]> {
    try {
      const response: AxiosResponse<GoogleBook[]> = await this.api.get('/books/search', {
        params: { query },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Search failed');
    }
  }

  async searchBookOwners(bookTitle: string): Promise<User[]> {
    try {
      const response: AxiosResponse<User[]> = await this.api.get('/books/search-owners', {
        params: { book_title: bookTitle },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to find book owners');
    }
  }

  // Chat methods
  async createOrGetChatRoom(chatData: ChatRoomCreate): Promise<ChatRoom> {
    try {
      const response: AxiosResponse<ChatRoom> = await this.api.post('/chat/rooms', chatData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create chat room');
    }
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response: AxiosResponse<ChatRoom[]> = await this.api.get('/chat/rooms');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch chat rooms');
    }
  }

  async getChatRoomWithMessages(roomId: string): Promise<ChatRoom> {
    try {
      const response: AxiosResponse<ChatRoom> = await this.api.get(`/chat/rooms/${roomId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch chat room');
    }
  }

  async sendMessage(roomId: string, messageData: ChatMessageCreate): Promise<ChatMessage> {
    try {
      const response: AxiosResponse<ChatMessage> = await this.api.post(`/chat/rooms/${roomId}/messages`, messageData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to send message');
    }
  }

  async deleteChatRoom(roomId: string): Promise<void> {
    try {
      await this.api.delete(`/chat/rooms/${roomId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete chat room');
    }
  }

  // Storage methods
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
  }

  // Network configuration methods (removed automatic reconfiguration)
  // The app now uses a consistent deployed backend URL
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testing backend connection...');
      const response = await this.api.get('/validate');
      console.log('✅ Backend connection successful');
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  // Utility methods
  isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  getErrorMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Network error. Please check your connection.';
    }
    
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
