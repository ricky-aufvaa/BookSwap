import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your backend URL
const BASE_URL = 'http://localhost:8000/api/v1';

class ApiService {
  constructor() {
    this.authToken = null;
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        // Always try to get the latest token from AsyncStorage
        if (!this.authToken) {
          try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
              this.authToken = token;
            }
          } catch (error) {
            console.error('Error getting token from storage:', error);
          }
        }

        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // If we get a 401, clear the stored token
        if (error.response?.status === 401) {
          this.clearAuthToken();
        }
        
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
    AsyncStorage.removeItem('token').catch(console.error);
  }

  // Initialize token from storage
  async initializeToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Error initializing token:', error);
    }
  }

  // Auth endpoints
  async login(username, password) {
    return this.api.post('/login', { username, password });
  }

  async signup(username, password, city) {
    return this.api.post('/signup', { username, password, city });
  }

  // Book endpoints
  async getMyBooks() {
    return this.api.get('/books/');
  }

  async addBook(title, author) {
    return this.api.post('/books/', { title, author });
  }

  async searchBooks(query) {
    return this.api.get(`/books/search?query=${encodeURIComponent(query)}`);
  }

  async searchBookOwners(bookTitle) {
    return this.api.get(`/books/search-owners?book_title=${encodeURIComponent(bookTitle)}`);
  }

  // Request endpoints
  async requestBook(bookTitle) {
    return this.api.post('/requests/', { book_title: bookTitle });
  }
}

export const apiService = new ApiService();
