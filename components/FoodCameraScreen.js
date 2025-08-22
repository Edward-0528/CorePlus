import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const FoodCameraScreen = ({ onPhotoTaken, onClose, onAnalysisComplete }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flashEffect, setFlashEffect] = useState(false);
  const [shutterSound, setShutterSound] = useState(null);
  const cameraRef = useRef(null);

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
        
        // Notify parent component
        if (onPhotoTaken) {
          onPhotoTaken(photo.uri);
        }

        // Import and use food analysis service
        const { foodAnalysisService } = await import('../foodAnalysisService');
        
        // Analyze the photo
        const analysisResult = await foodAnalysisService.analyzeFoodImage(photo.uri);
        
        console.log('🔍 Analysis result:', analysisResult);
        
        setIsAnalyzing(false);
        
        if (analysisResult.success && analysisResult.predictions.length > 0) {
          // Notify parent with analysis result and photo
          if (onAnalysisComplete) {
            onAnalysisComplete(analysisResult.predictions, photo.uri);
          }
        } else {
          // Analysis failed, show error
          Alert.alert(
            'Analysis Failed',
            'Could not identify the food. Please try again or add manually.',
            [
              { text: 'Try Again', style: 'cancel' },
              { text: 'Add Manually', onPress: () => onClose() }
            ]
          );
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
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Capture Your Meal</Text>
            <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Position your food in the frame and tap the camera button
            </Text>
          </View>

          {/* Camera Controls */}
          <View style={styles.controls}>
            {isAnalyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.analyzingText}>Analyzing food...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner}>
                  <Ionicons name="camera" size={32} color="#4682B4" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Flash Effect Overlay */}
        {flashEffect && (
          <View style={styles.flashOverlay} />
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
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#FFFFFF',
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
  flipButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: fonts.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  analyzingText: {
    fontSize: fonts.medium,
    color: '#FFFFFF',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  message: {
    fontSize: fonts.large,
    color: '#FFFFFF',
    textAlign: 'center',
    margin: spacing.xl,
  },
  permissionButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    zIndex: 1000,
  },
});

export default FoodCameraScreen;
