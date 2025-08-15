// Network utilities for finding the correct backend IP
import { Platform } from 'react-native';

export interface NetworkConfig {
  baseURL: string;
  timeout: number;
}

// List of possible IP addresses to try
const POSSIBLE_IPS = [
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

// Test if a specific IP is reachable
export const testConnection = async (ip: string, port: number = 8000): Promise<boolean> => {
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
    console.log(`Connection test failed for ${ip}:${port}`, error);
    return false;
  }
};

// Find the first working IP address
export const findWorkingIP = async (): Promise<string | null> => {
  console.log('🔍 Testing network connections...');
  
  for (const ip of POSSIBLE_IPS) {
    console.log(`Testing connection to ${ip}:8000...`);
    const isWorking = await testConnection(ip);
    
    if (isWorking) {
      console.log(`✅ Found working connection: ${ip}:8000`);
      return ip;
    }
  }
  
  console.log('❌ No working IP addresses found');
  return null;
};

// Get the appropriate API configuration
export const getNetworkConfig = async (): Promise<NetworkConfig> => {
  if (Platform.OS === 'web') {
    return {
      baseURL: 'http://localhost:8000/api/v1',
      timeout: 15000,
    };
  }

  // For mobile platforms, try to find a working IP
  const workingIP = await findWorkingIP();
  
  if (workingIP) {
    return {
      baseURL: `http://${workingIP}:8000/api/v1`,
      timeout: 15000,
    };
  }

  // Fallback to the original IP if no working IP is found
  console.warn('⚠️ Using fallback IP address. Network connectivity may be limited.');
  return {
    baseURL: 'http://192.168.29.189:8000/api/v1',
    timeout: 15000,
  };
};

// Manual IP override function
export const setManualIP = (ip: string): NetworkConfig => {
  console.log(`🔧 Manually setting IP to: ${ip}`);
  return {
    baseURL: `http://${ip}:8000/api/v1`,
    timeout: 15000,
  };
};
