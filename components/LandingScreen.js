import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LandingScreen = ({ onGetStarted, styles }) => {
  const [termsAccepted, setTermsAccepted] = useState(true);
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
    console.log('✨ Premium video background loaded');
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
        onLoadStart={() => console.log('Premium video loading...')}
        onLoad={handleVideoLoad}
        onError={(error) => console.log('Video error:', error)}
        usePoster={false}
        posterSource={require('../assets/Athleticman.png')} // Fallback poster
        posterStyle={styles.videoBackground}
      />
      
      {/* Elegant Dark Overlay for Premium Look */}
      <View style={[styles.videoOverlay, { opacity: videoLoaded ? 1 : 0.8 }]}>
        {/* Premium Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.3)',
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.7)',
            'rgba(0,0,0,0.9)'
          ]}
          style={styles.gradientOverlay}
          locations={[0, 0.3, 0.7, 1]}
        />
        
        <View style={styles.overlay}>
          <View style={styles.landingContent}>
            {/* Top Section - Hero Title */}
            <View style={styles.topSection}>
              <Text style={styles.newHeroTitle}>
                Core<Text style={{fontWeight: 'bold'}}>+</Text>
              </Text>
              <Text style={styles.newHeroSubtitle}>
                AI-powered fitness & nutrition tracking
              </Text>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Get Started Button */}
              <TouchableOpacity 
                style={[styles.newGetStartedButton, !termsAccepted && styles.buttonDisabled]} 
                onPress={termsAccepted ? onGetStarted : null}
                disabled={!termsAccepted}
              >
                <Text style={styles.newGetStartedText}>Get Started</Text>
              </TouchableOpacity>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>I agree to Terms & Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default memo(LandingScreen);
