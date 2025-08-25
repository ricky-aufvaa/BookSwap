import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserCreate, UserLogin, AuthResponse, Book, BookCreate, GoogleBook, ChatRoom, ChatRoomCreate, ChatMessage, ChatMessageCreate, ForgotPasswordRequest, ResetPasswordRequest, VerifyResetCodeRequest } from '../types';
import { API_CONFIG } from '../config';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
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
          const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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

    // Response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const newTokens = await this.refreshAccessToken(refreshToken);
              
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
              
              // Retry the original request
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear auth data and redirect to login
            console.log('Token refresh failed:', refreshError);
            await this.clearAuthData();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async signup(userData: UserCreate): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/signup', userData);
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      }
      if (refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }
      
      if (user) {
        // Store complete user data including avatar_seed
        const userWithId = { 
          id: user.id || 'temp-id', 
          username: user.username, 
          email: user.email,
          city: user.city,
          avatar_seed: user.avatar_seed,
          created_at: user.created_at
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithId));
        console.log('ApiService: Signup user data stored:', userWithId);
      }
      
      return { access_token, user, token_type: 'bearer' };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Signup failed');
    }
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    try {
      console.log('ApiService: Attempting login for:', credentials.username);
      const response: AxiosResponse<any> = await this.api.post('/login', credentials);
      const { access_token, refresh_token, user } = response.data;
      
      console.log('ApiService: Login response:', { 
        access_token: access_token ? 'present' : 'missing', 
        refresh_token: refresh_token ? 'present' : 'missing',
        user 
      });
      
      // Store tokens and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        console.log('ApiService: Access token stored successfully');
      }
      if (refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        console.log('ApiService: Refresh token stored successfully');
      }
      
      if (user) {
        // Store complete user data including avatar_seed
        const userWithId = { 
          id: user.id || 'temp-id', 
          username: user.username, 
          email: user.email,
          city: user.city,
          avatar_seed: user.avatar_seed,
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

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      console.log('ApiService: Refreshing access token...');
      
      // Create a new axios instance without interceptors to avoid infinite loops
      const refreshApi = axios.create({
        baseURL: API_CONFIG.API_BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response: AxiosResponse<any> = await refreshApi.post('/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: new_refresh_token } = response.data;

      // Store new tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, new_refresh_token);

      console.log('ApiService: Tokens refreshed successfully');
      return { access_token, refresh_token: new_refresh_token };
    } catch (error: any) {
      console.error('ApiService: Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  }

  // Password Reset methods
  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.post('/forgot-password', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to send reset code');
    }
  }

  async verifyResetCode(request: VerifyResetCodeRequest): Promise<{ message: string; valid: boolean }> {
    try {
      const response: AxiosResponse<{ message: string; valid: boolean }> = await this.api.post('/verify-reset-code', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Invalid reset code');
    }
  }

  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.post('/reset-password', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to reset password');
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

  async updateBook(bookId: string, bookData: Partial<BookCreate>): Promise<Book> {
    try {
      const response: AxiosResponse<Book> = await this.api.put(`/books/${bookId}`, bookData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update book');
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    try {
      await this.api.delete(`/books/${bookId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete book');
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
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async updateAvatar(avatarSeed: string | null): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.put('/update-avatar', {
        avatar_seed: avatarSeed,
      });
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update avatar');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/profile');
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get profile');
    }
  }

  async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER]);
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
