// API Configuration
import { Platform } from 'react-native';

// Get the local IP address for development
const getLocalIP = () => {
  // Common local IP ranges - you can add your specific IP here
  const commonIPs = [
    '192.168.1.100',   // Common router range
    '192.168.0.100',   // Common router range  
    '192.168.29.189',  // Your current IP
    '10.0.2.2',        // Android emulator host
    '10.0.0.100',      // Another common range
  ];
  
  // For now, return the current working IP
  // In a real app, you might want to implement IP detection
  return '192.168.29.189';
};

// Configuration for different environments
const config = {
  development: {
    // For development - use localhost for web, IP for mobile
    API_BASE_URL: Platform.OS === 'web' 
      ? 'http://localhost:8000/api/v1'        // Web browser
      : Platform.OS === 'android' 
        ? `http://${getLocalIP()}:8000/api/v1`  // Android with dynamic IP
        : 'http://localhost:8000/api/v1',       // iOS
    TIMEOUT: 15000, // Increased timeout for better reliability
  },
  production: {
    // This will be updated by the deployment script
    API_BASE_URL: 'https://your-service-url.run.app/api/v1',
    TIMEOUT: 20000,
  }
};

// Determine current environment
const isDevelopment = __DEV__;
const currentConfig = isDevelopment ? config.development : config.production;

// Add network debugging
console.log('API Configuration:', {
  platform: Platform.OS,
  isDevelopment,
  apiUrl: currentConfig.API_BASE_URL,
  timeout: currentConfig.TIMEOUT
});

export const API_CONFIG = currentConfig;

export default {
  ...currentConfig,
  isDevelopment,
  
  // Helper function to update IP at runtime if needed
  updateIP: (newIP: string) => {
    if (isDevelopment && Platform.OS === 'android') {
      currentConfig.API_BASE_URL = `http://${newIP}:8000/api/v1`;
      console.log('Updated API URL:', currentConfig.API_BASE_URL);
    }
  }
};
