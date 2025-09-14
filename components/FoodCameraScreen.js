import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

// Define colors directly to match the minimal design
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#28A745',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

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
        
        // Close camera immediately to show loading screen
        if (onClose) {
          onClose();
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
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={48} color={AppColors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan food items and provide nutritional information.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => {
            console.log('🔄 Close button pressed');
            if (onClose) {
              onClose();
            } else {
              console.warn('⚠️ onClose function not provided');
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-outline" size={24} color={AppColors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan Food</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={flipCamera}>
          <Ionicons name="camera-reverse-outline" size={24} color={AppColors.white} />
        </TouchableOpacity>
      </View>

      {/* Focus Frame Overlay */}
      <View style={styles.focusContainer}>
        <View style={styles.focusFrame}>
          <Ionicons name="scan-outline" size={32} color={AppColors.white} />
        </View>
      </View>

      {/* Instructions Overlay */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          Position your food in the frame and tap to scan
        </Text>
      </View>

      {/* Controls Overlay */}
      <View style={styles.controls}>
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={AppColors.white} />
            <Text style={styles.analyzingText}>Analyzing food...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera-outline" size={28} color={AppColors.white} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.textPrimary,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContent: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    padding: 32,
    borderRadius: 12,
    maxWidth: 300,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: AppColors.nutrition,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: AppColors.textSecondary,
    fontSize: 14,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.white,
  },
  focusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  focusFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: AppColors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  instructions: {
    fontSize: 14,
    color: AppColors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.nutrition,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingContainer: {
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 14,
    color: AppColors.white,
    marginTop: 12,
    opacity: 0.9,
  },
});

export default FoodCameraScreen;
