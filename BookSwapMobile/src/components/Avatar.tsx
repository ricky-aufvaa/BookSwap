import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getAvatarBySeed } from '../utils/avatarUtils';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  seed?: string;
  size?: number;
  style?: any;
  showDefault?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  seed, 
  size = 50, 
  style,
  showDefault = true 
}) => {
  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  // If no seed provided, show default user icon
  if (!seed) {
    if (!showDefault) return null;
    
    return (
      <View style={[containerStyle, styles.defaultContainer]}>
        <Ionicons 
          name="person" 
          size={size * 0.6} 
          color="#666" 
        />
      </View>
    );
  }

  try {
    const svgString = getAvatarBySeed(seed);
    
    return (
      <View style={containerStyle}>
        <SvgXml 
          xml={svgString} 
          width={size} 
          height={size} 
        />
      </View>
    );
  } catch (error) {
    console.warn('Error rendering avatar:', error);
    
    // Fallback to default icon on error
    if (!showDefault) return null;
    
    return (
      <View style={[containerStyle, styles.defaultContainer]}>
        <Ionicons 
          name="person" 
          size={size * 0.6} 
          color="#666" 
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultContainer: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default Avatar;
