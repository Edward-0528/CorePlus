import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FoodCameraScreen = ({ onPhotoTaken, onClose, onAnalysisComplete }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flashEffect, setFlashEffect] = useState(false);
  const [shutterSound, setShutterSound] = useState(null);
  const [captureButtonScale] = useState(new Animated.Value(1));
  const [focusFrameOpacity] = useState(new Animated.Value(0.6));
  const cameraRef = useRef(null);

  useEffect(() => {
    // Animate focus frame pulsing
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(focusFrameOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(focusFrameOpacity, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      console.log('Media permissions:', mediaStatus);
      
      // Initialize pleasant shutter sound
      await initializeShutterSound();
    })();

    // Cleanup sound on unmount
    return () => {
      if (shutterSound) {
        shutterSound.unloadAsync();
      }
    };
  }, []);

  const initializeShutterSound = async () => {
    try {
      // Set audio mode for pleasant sound playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create a pleasant soft sound effect
      // Using a generated pleasant tone instead of harsh camera shutter
      const { sound } = await Audio.Sound.createAsync(
        // Create a soft, pleasant camera sound
        { uri: generatePleasantShutterTone() },
        { 
          shouldPlay: false, 
          volume: 0.5,
          rate: 1.0 
        }
      );
      
      setShutterSound(sound);
      console.log('🔊 Pleasant shutter sound initialized');
    } catch (error) {
      console.warn('Could not initialize custom shutter sound:', error);
      // Will fallback to haptic feedback only
    }
  };

  // Generate a pleasant, soft camera sound (data URI)
  const generatePleasantShutterTone = () => {
    // Create a gentle, pleasant "soft click" sound
    // This replaces the harsh mechanical camera shutter with something softer
    const audioContext = {
      sampleRate: 44100,
      duration: 0.15, // Short, pleasant 150ms sound
      frequency1: 1000, // Pleasant mid-range tone
      frequency2: 1200, // Slight harmonic for richness
    };

    const { sampleRate, duration, frequency1, frequency2 } = audioContext;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2); // WAV header + data
    const view = new DataView(buffer);

    // WAV file header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate pleasant audio data
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Create a pleasant envelope (quick attack, gentle decay)
      const envelope = Math.exp(-t * 8) * Math.sin(Math.PI * t / duration * 2);
      
      // Two gentle sine waves for a pleasant, soft sound
      const tone1 = Math.sin(2 * Math.PI * frequency1 * t) * 0.3;
      const tone2 = Math.sin(2 * Math.PI * frequency2 * t) * 0.2;
      
      // Combine tones with envelope for a soft, pleasant click
      const sample = (tone1 + tone2) * envelope * 0.4;
      
      // Convert to 16-bit PCM
      const pcm = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, pcm, true);
    }

    // Convert to base64 data URI
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  };

  const playPleasantShutterSound = async () => {
    try {
      if (shutterSound) {
        await shutterSound.replayAsync();
        console.log('🔊 Played pleasant shutter sound');
      } else {
        // Fallback to gentle haptic feedback
        if (Haptics?.impactAsync) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.warn('Failed to play shutter sound:', error);
      // Fallback to haptic feedback
      if (Haptics?.impactAsync) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  useEffect(() => {
    (async () => {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      console.log('Media permissions:', mediaStatus);
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsAnalyzing(true);
        
        // Animate capture button press
        Animated.sequence([
          Animated.timing(captureButtonScale, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(captureButtonScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Play pleasant custom shutter sound instead of default
        await playPleasantShutterSound();
        
        // Show visual flash effect
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 150);
        
        // Take photo with muted default shutter (our custom sound is better)
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          mute: true, // Mute harsh default sound, use our pleasant one
        });

        console.log('📸 Photo taken with pleasant sound:', photo.uri);

        // Save to device
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        
        // Notify parent component with photo immediately
        if (onPhotoTaken) {
          onPhotoTaken(photo.uri);
        }

        // Immediately transition to selection screen with loading state
        if (onAnalysisComplete) {
          onAnalysisComplete([], photo.uri, true); // Empty predictions, loading = true
        }
        
        // Reset analyzing state immediately since we're transitioning away
        setIsAnalyzing(false);

        // Import and use food analysis service
        const { foodAnalysisService } = await import('../foodAnalysisService');
        
        // Analyze the photo in background
        const analysisResult = await foodAnalysisService.analyzeFoodImage(photo.uri);
        
        console.log('🔍 Analysis result:', analysisResult);
        
        if (analysisResult.success && analysisResult.predictions.length > 0) {
          // Update with actual analysis results
          if (onAnalysisComplete) {
            onAnalysisComplete(analysisResult.predictions, photo.uri, false);
          }
        } else {
          // Analysis failed, update with error state
          if (onAnalysisComplete) {
            onAnalysisComplete([], photo.uri, false, 'Could not identify the food. Please try again or add manually.');
          }
        }

      } catch (error) {
        setIsAnalyzing(false);
        console.error('Camera/Analysis error:', error);
        Alert.alert(
          'Analysis Error',
          `Failed to analyze food: ${error.message}\n\nYou can still add the meal manually.`,
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Add Manually', onPress: () => onClose() }
          ]
        );
      }
    }
  };

  const flipCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topGradient}
        />
        
        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        />

        <View style={styles.overlay}>
          {/* Modern Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.modernButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Food Scanner</Text>
              <Text style={styles.subtitle}>Position your meal in the frame</Text>
            </View>
            <TouchableOpacity style={styles.modernButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Food Focus Frame */}
          <View style={styles.centerContent}>
            <Animated.View style={[styles.focusFrame, { opacity: focusFrameOpacity }]}>
              <View style={styles.focusCorner} />
              <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
              <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
              <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
              <View style={styles.focusCenter}>
                <Ionicons name="restaurant-outline" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </Animated.View>
          </View>

          {/* Modern Camera Controls */}
          <View style={styles.controls}>
            <View style={styles.captureArea}>
              <Animated.View style={[styles.modernCaptureButton, { transform: [{ scale: captureButtonScale }] }]}>
                <TouchableOpacity 
                  style={styles.captureButtonTouchable} 
                  onPress={takePicture}
                  disabled={isAnalyzing}
                >
                  <View style={styles.captureButtonOuter}>
                    <View style={styles.captureButtonInner}>
                      {isAnalyzing ? (
                        <ActivityIndicator size={28} color="#4682B4" />
                      ) : (
                        <Ionicons name="camera" size={28} color="#4682B4" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.captureHint}>
                {isAnalyzing ? 'Processing...' : 'Tap to capture'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Modern Flash Effect */}
        {flashEffect && (
          <View style={styles.modernFlashOverlay} />
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fonts.small,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '400',
  },
  modernButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    position: 'relative',
  },
  focusCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    top: 0,
    left: 0,
    borderTopLeftRadius: 8,
  },
  focusCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 0,
  },
  focusCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 0,
  },
  focusCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
  },
  focusCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureArea: {
    alignItems: 'center',
  },
  modernCaptureButton: {
    marginBottom: spacing.sm,
  },
  captureButtonTouchable: {
    borderRadius: 50,
  },
  captureButtonOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(70, 130, 180, 0.3)',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  captureHint: {
    fontSize: fonts.small,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  modernFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
    zIndex: 1000,
  },
  message: {
    fontSize: fonts.large,
    color: '#FFFFFF',
    textAlign: 'center',
    margin: spacing.xl,
  },
  permissionButton: {
    backgroundColor: '#4682B4',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  permissionButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: fonts.medium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default FoodCameraScreen;
