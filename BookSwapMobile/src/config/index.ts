// API Configuration for BookSwap Mobile App
import { Platform } from 'react-native';

// const DEPLOYED_URL = "https://bookswap-yb6p.onrender.com"; // Production backend

// For local development with Expo Go on phone, use your PC's network IP
// Replace 192.168.1.100 with your actual PC's IP address
// To find your IP: Windows (ipconfig), Mac/Linux (ifconfig or ip addr)
// const LOCAL_DEV_URL = "http://192.168.29.189:8000"; // Your PC's actual IP
const LOCAL_DEV_URL = "http://127.0.0.1:8000"; // For PC browser testing

// Use LOCAL_DEV_URL for phone testing, LOCALHOST_URL for PC browser
const DEPLOYED_URL = LOCAL_DEV_URL;

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
  getBaseURL: () => DEPLOYED_URL,
  // getBaseURL: () => "http://127.0.0.1:8000",

  
  // Helper to update API URL at runtime (for debugging purposes)
  updateAPI: (newURL: string) => {
    currentConfig.API_BASE_URL = newURL;
    console.log('Updated API URL:', currentConfig.API_BASE_URL);
  }
};
