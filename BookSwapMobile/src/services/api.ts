import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, UserCreate, UserLogin, AuthResponse, Book, BookCreate, GoogleBook } from '../types';

// API Configuration
// For physical Android devices, you need to use your computer's actual IP address
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
// Replace 'YOUR_COMPUTER_IP' with your actual IP address (e.g., 192.168.1.100)

// Option 1: Use your computer's IP address (recommended for physical devices)
const YOUR_COMPUTER_IP = '192.168.1.100'; // Replace with your actual IP address

// Option 2: Use 10.0.2.2 for Android emulator only
const API_BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? `http://${YOUR_COMPUTER_IP}:8000/api/v1` : 'http://localhost:8000/api/v1')
  : 'http://localhost:8000/api/v1'; // Update this with your production URL

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
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
      const { access_token, username, city } = response.data;
      
      // Store token and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      }
      
      const user = { username, city };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      return { access_token, user, token_type: 'bearer' };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Signup failed');
    }
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/login', credentials);
      const { access_token, user } = response.data;
      
      // Store token and user data
      if (access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      }
      
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      
      return { access_token, user, token_type: 'bearer' };
    } catch (error: any) {
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
      const response = await this.api.get('/validate');
      return response.data;
    } catch (error) {
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
