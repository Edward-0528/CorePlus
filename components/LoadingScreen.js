import React, { useRef, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLoader from './AnimatedLoader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoadingScreen = ({ styles, message = "Loading..." }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync();
    }
  }, []);

  const handleVideoLoad = () => {
    console.log('✨ Loading screen video background loaded');
    setVideoLoaded(true);
  };

  return (
    <SafeAreaView style={styles.landingContainer}>
      {/* Premium Video Background */}
      <Video
        ref={videoRef}
        source={require('../assets/workout.mp4')}
        style={styles.videoBackground}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        rate={1.0}
        volume={0}
        onLoadStart={() => console.log('Loading video starting...')}
        onLoad={handleVideoLoad}
        onError={(error) => console.log('Video error:', error)}
        usePoster={false}
        posterSource={require('../assets/Athleticman.png')}
        posterStyle={styles.videoBackground}
      />
      
      {/* Elegant Dark Overlay */}
      <View style={[styles.videoOverlay, { opacity: videoLoaded ? 1 : 0.8 }]}>
        {/* Premium Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.8)',
            'rgba(0,0,0,0.95)'
          ]}
          style={styles.gradientOverlay}
          locations={[0, 0.3, 0.7, 1]}
        />
        
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
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default LoadingScreen;
