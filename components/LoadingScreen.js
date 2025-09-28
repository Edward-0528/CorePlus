import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedLoader from './AnimatedLoader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoadingScreen = ({ styles, message = "Loading...", onForceExit }) => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  useEffect(() => {
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setLoadingTime(elapsed);
      
      // Show debug info after 15 seconds
      if (elapsed >= 15) {
        setShowDebugInfo(true);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.landingContainer, { backgroundColor: '#000000' }]}>
      {/* Simple Black Background - No Video for Better Performance */}
      <View style={styles.overlay}>
        {/* Centered Loading Content */}
        <View style={styles.loadingContainer}>
          <AnimatedLoader 
            message={message}
            background="transparent"
            accent="#ffffff"
            ring="rgba(255, 255, 255, 0.2)"
            label="Core+"
            showLabel={true}
          />
          
          {/* Debug Information - Shows after 15 seconds */}
          {showDebugInfo && (
            <View style={{
              position: 'absolute',
              bottom: 100,
              left: 20,
              right: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 16,
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 12,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Loading time: {loadingTime}s
              </Text>
              <Text style={{
                color: '#ffffff',
                fontSize: 10,
                textAlign: 'center',
                marginBottom: 12,
                opacity: 0.8,
              }}>
                If stuck, check console logs for details
              </Text>
              
              {loadingTime >= 20 && onForceExit && (
                <TouchableOpacity
                  onPress={onForceExit}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 12,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}>
                    Force Continue →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default LoadingScreen;
