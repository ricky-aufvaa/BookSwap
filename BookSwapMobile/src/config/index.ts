// API Configuration for BookSwap Mobile App
import { Platform } from 'react-native';

// const DEPLOYED_URL = "https://bookswap-yb6p.onrender.com"; // Production backend
const DEPLOYED_URL = "http://127.0.0.1:8000"; // Production backend

const config = {
  development: {
    // Use deployed backend for both development and production
    // This ensures consistency across all environments
    API_BASE_URL: DEPLOYED_URL + '/api/v1',
    TIMEOUT: 20000, // Increased timeout for better reliability with deployed backend
  },
  production: {
    API_BASE_URL: DEPLOYED_URL + '/api/v1',
    TIMEOUT: 20000,
  }
};

const isDevelopment = __DEV__;
const currentConfig = isDevelopment ? config.development : config.production;

console.log('API Configuration:', {
  platform: Platform.OS,
  isDevelopment,
  apiUrl: currentConfig.API_BASE_URL,
  timeout: currentConfig.TIMEOUT,
  timestamp: new Date().toISOString()
});

export const API_CONFIG = currentConfig;

export default {
  ...currentConfig,
  isDevelopment,
  DEPLOYED_URL, // Export for use in other modules
  
  // Helper to get the base URL without /api/v1
  // getBaseURL: () => DEPLOYED_URL,
  getBaseURL: () => "http://127.0.0.1:8000",

  
  // Helper to update API URL at runtime (for debugging purposes)
  updateAPI: (newURL: string) => {
    currentConfig.API_BASE_URL = newURL;
    console.log('Updated API URL:', currentConfig.API_BASE_URL);
  }
};
