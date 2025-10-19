import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import foodRecommendationService from '../../services/foodRecommendationService';
import usageTrackingService from '../../services/usageTrackingService';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAppContext } from '../../contexts/AppContext';
import { AppColors } from '../../constants/AppColors';

const ShouldIEatItCamera = ({ onClose, onRecommendationComplete }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);
  const { isPremium, subscriptionInfo } = useSubscription();
  const { user } = useAppContext();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[AppColors.primary, AppColors.primaryLight]}
          style={styles.permissionGradient}
        >
          <View style={styles.permissionContent}>
            <Ionicons name="camera-outline" size={64} color={AppColors.white} />
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>
              We need camera access to analyze your food and provide personalized recommendations.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const analyzeFood = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        // Check if this is a premium feature
        if (!isPremium) {
          Alert.alert(
            'Premium Feature',
            'The "Should I Eat It?" analysis is a Core+ Pro feature. Upgrade to get personalized food recommendations!',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade', onPress: () => {
                onClose?.();
                // Could trigger upgrade modal here
              }}
            ]
          );
          return;
        }

        setIsAnalyzing(true);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: true,
        });

        console.log('📸 Food photo captured for analysis');

        // Get user profile for personalized recommendations
        const userProfile = {
          goals: user?.user_metadata?.health_goals || 'General wellness',
          activityLevel: user?.user_metadata?.activity_level || 'Moderate',
          restrictions: user?.user_metadata?.dietary_restrictions || 'None'
        };

        // Analyze food and get recommendation
        const result = await foodRecommendationService.shouldIEatIt(photo.uri, userProfile);
        
        if (result.success) {
          console.log('✅ Food recommendation generated');
          onRecommendationComplete?.(result);
        } else {
          console.error('❌ Food recommendation failed:', result.error);
          Alert.alert('Analysis Failed', 'Could not analyze the food. Please try again with a clearer image.');
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
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={AppColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Should I Eat It?</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Food Analysis</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={flipCamera}>
            <Ionicons name="camera-reverse" size={24} color={AppColors.white} />
          </TouchableOpacity>
        </View>

        {/* Overlay Guide */}
        <View style={styles.overlay}>
          <View style={styles.frameGuide}>
            <View style={styles.frameCorner} />
            <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
          </View>
          
          <Text style={styles.instructionText}>
            {isAnalyzing ? 'Analyzing your food...' : 'Center the food in the frame and tap to analyze'}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsRow}>
            <View style={styles.controlsSpace} />
            
            <TouchableOpacity 
              style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]} 
              onPress={analyzeFood}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color={AppColors.white} />
              ) : (
                <>
                  <Ionicons name="nutrition" size={32} color={AppColors.white} />
                  <Text style={styles.captureButtonText}>Analyze</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View style={styles.controlsSpace} />
          </View>
          
          {!isPremium && (
            <View style={styles.premiumNotice}>
              <Ionicons name="diamond" size={16} color={AppColors.white} />
              <Text style={styles.premiumText}>Premium Feature</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.black,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.white,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: AppColors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: AppColors.white,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: AppColors.white,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 3,
    borderBottomWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderBottomWidth: 0,
  },
  instructionText: {
    fontSize: 16,
    color: AppColors.white,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    borderRadius: 20,
  },
  controls: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsSpace: {
    flex: 1,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: AppColors.white,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
    fontSize: 10,
    color: AppColors.white,
    fontWeight: '600',
    marginTop: 2,
  },
  premiumNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'center',
  },
  premiumText: {
    fontSize: 12,
    color: AppColors.white,
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default ShouldIEatItCamera;
