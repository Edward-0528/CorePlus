import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SmoothVideoBackground = memo(({ children, screenType = 'landing' }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync().catch(console.warn);
    }
  }, []);

  const handleVideoLoad = () => {
    console.log(`✨ ${screenType} video background loaded`);
    setVideoLoaded(true);
    
    // Smooth fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Different gradient overlays for different screens
  const getGradientColors = () => {
    switch (screenType) {
      case 'landing':
        return [
          'rgba(0,0,0,0.05)',
          'rgba(0,0,0,0.1)',
          'rgba(0,0,0,0.15)',
          'rgba(0,0,0,0.25)'
        ];
      case 'login':
      case 'signup':
        return [
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.6)',
          'rgba(0,0,0,0.8)',
          'rgba(0,0,0,0.95)'
        ];
      default:
        return [
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.6)',
          'rgba(0,0,0,0.8)',
          'rgba(0,0,0,0.95)'
        ];
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Premium Video Background */}
      <Video
        ref={videoRef}
        source={require('../../assets/workout.mp4')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: screenWidth,
          height: screenHeight,
        }}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        rate={1.0}
        volume={0}
        onLoadStart={() => console.log(`${screenType} video loading...`)}
        onLoad={handleVideoLoad}
        onError={(error) => console.log(`${screenType} video error:`, error)}
        usePoster={false}
        posterSource={require('../../assets/Athleticman.png')}
        posterStyle={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: screenWidth,
          height: screenHeight,
        }}
      />
      
      {/* Smooth fade overlay */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: fadeAnim,
      }}>
        {/* Premium Gradient Overlay */}
        <LinearGradient
          colors={getGradientColors()}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          locations={[0, 0.3, 0.7, 1]}
        />
        
        {/* Content */}
        {children}
      </Animated.View>
    </View>
  );
});

SmoothVideoBackground.displayName = 'SmoothVideoBackground';

export default SmoothVideoBackground;
