import React from 'react';
import { View, Text, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AnimatedLoader from './AnimatedLoader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoadingScreen = ({ styles, message = "Loading..." }) => {

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
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default LoadingScreen;
