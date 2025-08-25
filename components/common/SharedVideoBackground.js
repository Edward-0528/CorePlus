import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SharedVideoBackground = memo(({ children, overlayOpacity = 1 }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync().catch(console.warn);
    }
  }, []);

  const handleVideoLoad = () => {
    console.log('✨ Shared video background loaded');
    setVideoLoaded(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Premium Video Background - Single Instance */}
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
        onLoadStart={() => console.log('Shared video loading...')}
        onLoad={handleVideoLoad}
        onError={(error) => console.log('Shared video error:', error)}
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
      
      {/* Elegant Dark Overlay */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: videoLoaded ? overlayOpacity : 0.8
      }}>
        {/* Premium Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.8)',
            'rgba(0,0,0,0.95)'
          ]}
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
      </View>
    </View>
  );
});

SharedVideoBackground.displayName = 'SharedVideoBackground';

export default SharedVideoBackground;
