import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { foodAnalysisService } from '../foodAnalysisService';

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

const MinimalFoodCamera = ({ onPhotoTaken, onClose, onAnalysisComplete }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
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

  const takePicture = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        setIsAnalyzing(true);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: true,
        });

        console.log('📸 Photo captured');
        onPhotoTaken?.(photo.uri);

        // Analyze the food
        const analysisResult = await foodAnalysisService.analyzeFoodImage(photo.uri);
        
        if (analysisResult.success) {
          console.log('✅ Food analysis completed');
          onAnalysisComplete?.(analysisResult);
        } else {
          console.error('❌ Food analysis failed:', analysisResult.error);
          Alert.alert('Analysis Failed', 'Could not identify the food. Please try again.');
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error('❌ Camera error:', error);
        Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
        setIsAnalyzing(false);
      }
    }
  };

  const flipCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
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
    zIndex: 1,
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

export default MinimalFoodCamera;
