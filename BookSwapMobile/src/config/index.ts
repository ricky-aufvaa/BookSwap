// // API Configuration
// import { Platform } from 'react-native';

// // Get the local IP address for development
// const getLocalIP = () => {
//   // Try to get the actual local IP address
//   // For Expo Go, we need to use the computer's IP address that's accessible from the mobile device
  
//   // Common IP ranges to try - you should replace these with your actual network IP
//   const possibleIPs = [
//     '192.168.29.189',  // Your current IP (if this is your computer's IP)
//     '192.168.1.100',   // Common router range
//     '192.168.0.100',   // Common router range
//     '192.168.1.101',   // Try different IPs in the same range
//     '192.168.29.100',  // Try different IPs in your current range
//     '10.0.0.100',      // Another common range
//   ];
  
//   // For now, return the first IP, but you should replace this with your computer's actual IP
//   // To find your IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) in terminal
//   return possibleIPs[0];
// };
// const DEPLOYED_URL = "https://bookswap-9mez.onrender.com"
// // Configuration for different environments
// const config = {
//   development: {
//     // For development - use localhost for web, IP for mobile
//     API_BASE_URL: Platform.OS === 'web' 
//       ? 'http://localhost:8000/api/v1'        // Web browser
//       : Platform.OS === 'android' 
//         ? `http://${getLocalIP()}:8000/api/v1`  // Android with dynamic IP
//         : `http://${getLocalIP()}:8000/api/v1`, // iOS also needs IP for Expo Go
//     TIMEOUT: 15000, // Increased timeout for better reliability
//   },
//   production: {
//     // This will be updated by the deployment script
//     API_BASE_URL: 'https://bookswap-9mez.onrender.com',
//     TIMEOUT: 20000,
//   }
// };

// // Determine current environment
// const isDevelopment = __DEV__;
// const currentConfig = isDevelopment ? config.development : config.production;

// // Add network debugging
// console.log('API Configuration:', {
//   platform: Platform.OS,
//   isDevelopment,
//   apiUrl: currentConfig.API_BASE_URL,
//   timeout: currentConfig.TIMEOUT
// });

// export const API_CONFIG = currentConfig;

// export default {
//   ...currentConfig,
//   isDevelopment,
  
//   // Helper function to update IP at runtime if needed
//   updateIP: (newIP: string) => {
//     if (isDevelopment && Platform.OS === 'android') {
//       currentConfig.API_BASE_URL = `http://${newIP}:8000/api/v1`;
//       console.log('Updated API URL:', currentConfig.API_BASE_URL);
//     }
//   }
// };

// apiConfig.ts
import { Platform } from 'react-native';

const DEPLOYED_URL = "https://bookswap-yb6p.onrender.com"; // Your live backend

const config = {
  development: {
    // Optional: can still use local backend if you want
      API_BASE_URL: DEPLOYED_URL + '/api/v1', // <- force deployed backend
    // API_BASE_URL: Platform.OS === 'web'
    //   ? 'http://localhost:8000/api/v1'
    //   : DEPLOYED_URL + '/api/v1', // mobile will use deployed backend during dev
    TIMEOUT: 15000,
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
  timeout: currentConfig.TIMEOUT
});

export const API_CONFIG = currentConfig;

export default {
  ...currentConfig,
  isDevelopment,
  
  // Optional helper to update API URL at runtime
  updateAPI: (newURL: string) => {
    currentConfig.API_BASE_URL = newURL;
    console.log('Updated API URL:', currentConfig.API_BASE_URL);
  }
};
