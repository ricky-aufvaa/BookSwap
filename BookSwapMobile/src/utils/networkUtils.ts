// Network utilities for production and development environments
import { Platform } from 'react-native';

export interface NetworkConfig {
  baseURL: string;
  timeout: number;
}

// Production backend URL
const DEPLOYED_URL = "https://bookswap-yb6p.onrender.com";

// List of possible local IP addresses to try (for development only)
const POSSIBLE_LOCAL_IPS = [
  '192.168.29.189',  // Current configured IP
  '192.168.1.100',   // Common router range
  '192.168.1.101',
  '192.168.1.102',
  '192.168.0.100',   // Another common range
  '192.168.0.101',
  '192.168.0.102',
  '192.168.29.100',  // Same subnet as current
  '192.168.29.101',
  '10.0.0.100',      // Corporate networks
  '10.0.0.101',
];

// Test if the deployed backend is reachable
export const testDeployedConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${DEPLOYED_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`Deployed backend connection test failed:`, error);
    return false;
  }
};

// Test if a specific local IP is reachable (for development)
export const testLocalConnection = async (ip: string, port: number = 8000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`http://${ip}:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`Local connection test failed for ${ip}:${port}`, error);
    return false;
  }
};

// Find the first working local IP address (for development)
export const findWorkingLocalIP = async (): Promise<string | null> => {
  console.log('🔍 Testing local network connections...');
  
  for (const ip of POSSIBLE_LOCAL_IPS) {
    console.log(`Testing connection to ${ip}:8000...`);
    const isWorking = await testLocalConnection(ip);
    
    if (isWorking) {
      console.log(`✅ Found working local connection: ${ip}:8000`);
      return ip;
    }
  }
  
  console.log('❌ No working local IP addresses found');
  return null;
};

// Get the appropriate API configuration
export const getNetworkConfig = async (): Promise<NetworkConfig> => {
  // Always try deployed backend first
  console.log('🔍 Testing deployed backend connection...');
  const deployedWorking = await testDeployedConnection();
  
  if (deployedWorking) {
    console.log('✅ Using deployed backend');
    return {
      baseURL: `${DEPLOYED_URL}/api/v1`,
      timeout: 20000,
    };
  }

  // If deployed backend fails and we're in development, try local
  if (__DEV__) {
    console.log('⚠️ Deployed backend not reachable, trying local development server...');
    
    if (Platform.OS === 'web') {
      return {
        baseURL: 'http://localhost:8000/api/v1',
        timeout: 15000,
      };
    }

    // For mobile platforms, try to find a working local IP
    const workingIP = await findWorkingLocalIP();
    
    if (workingIP) {
      return {
        baseURL: `http://${workingIP}:8000/api/v1`,
        timeout: 15000,
      };
    }
  }

  // Final fallback to deployed URL (even if not reachable, let the app handle the error)
  console.warn('⚠️ Using deployed backend as fallback');
  return {
    baseURL: `${DEPLOYED_URL}/api/v1`,
    timeout: 20000,
  };
};

// Manual override functions
export const setDeployedBackend = (): NetworkConfig => {
  console.log(`🔧 Manually setting to deployed backend: ${DEPLOYED_URL}`);
  return {
    baseURL: `${DEPLOYED_URL}/api/v1`,
    timeout: 20000,
  };
};

export const setLocalBackend = (ip: string): NetworkConfig => {
  console.log(`🔧 Manually setting to local backend: ${ip}`);
  return {
    baseURL: `http://${ip}:8000/api/v1`,
    timeout: 15000,
  };
};
