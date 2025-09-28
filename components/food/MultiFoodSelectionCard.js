import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../../utils/responsive';

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

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const MultiFoodSelectionCard = ({ visible, onClose, predictions, onSelectFoods, imageUri }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loadingOpacity] = useState(new Animated.Value(1));
  
  // Check if we're in loading state (empty predictions array)
  const isLoading = !predictions || predictions.length === 0;

  useEffect(() => {
    if (visible) {
      // Reset selected foods when modal opens
      setSelectedFoods([]);
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Animate loading state changes
  useEffect(() => {
    if (isLoading) {
      // Fade in loading state
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out loading state to reveal content
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const toggleFoodSelection = (prediction, index) => {
    setSelectedFoods(current => {
      const isSelected = current.some(food => food.index === index);
      if (isSelected) {
        // Remove from selection
        return current.filter(food => food.index !== index);
      } else {
        // Add to selection
        return [...current, { ...prediction, index }];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedFoods.length === 0) {
      Alert.alert(
        'No Foods Selected',
        'Please select at least one food item to add to your meal log.',
        [{ text: 'OK' }]
      );
      return;
    }

    const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
    const foodNames = selectedFoods.map(food => food.name).join(', ');

    Alert.alert(
      'Add Selected Foods?',
      `Add ${selectedFoods.length} item(s) (${foodNames}) with total ${totalCalories} calories to your meal log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: `Add ${selectedFoods.length} Food${selectedFoods.length > 1 ? 's' : ''}`, 
          onPress: () => {
            onSelectFoods(selectedFoods);
            handleClose();
          }
        }
      ]
    );
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const isSelected = (index) => {
    return selectedFoods.some(food => food.index === index);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <View style={styles.backdropContent} />
      </TouchableOpacity>

      {/* Sliding Card */}
      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="restaurant" size={24} color={AppColors.nutrition} />
            <Text style={styles.title}>Select Your Foods</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Photo Preview - Compact Version */}
        {imageUri && (
          <View style={styles.compactPhotoContainer}>
            <Image source={{ uri: imageUri }} style={styles.compactPhotoPreview} />
          </View>
        )}

        {/* Compact Header with Selection Info */}
        <View style={styles.compactHeader}>
          <Text style={styles.compactSubtitle}>
            {isLoading ? 'Analyzing your meal...' : 'Select foods from your meal'}
          </Text>
          {!isLoading && selectedFoods.length > 0 && (
            <View style={styles.compactSelectedCount}>
              <Text style={styles.compactSelectedText}>
                {selectedFoods.length} selected • {selectedFoods.reduce((sum, food) => sum + food.calories, 0)} cal
              </Text>
            </View>
          )}
        </View>

        {/* Loading State Overlay */}
        {isLoading && (
          <Animated.View style={[styles.loadingOverlay, { opacity: loadingOpacity }]}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingIcon}>
                <Ionicons name="scan-outline" size={32} color={AppColors.nutrition} />
              </View>
              <Text style={styles.loadingTitle}>Analyzing your meal</Text>
              <Text style={styles.loadingSubtitle}>Our AI is identifying the foods in your photo</Text>
              
              <View style={styles.loadingSpinner}>
                <ActivityIndicator size="large" color={AppColors.nutrition} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Predictions List */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.predictionsContainer}>
            {!isLoading && predictions.map((prediction, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.predictionItem,
                  predictions.length > 3 ? styles.compactPredictionItem : null,
                  isSelected(index) && styles.selectedPrediction
                ]}
                onPress={() => toggleFoodSelection(prediction, index)}
              >
                  <View style={styles.predictionContent}>
                    <View style={styles.predictionHeader}>
                      <View style={styles.nameAndCheckbox}>
                        <View style={[
                          styles.checkbox,
                          predictions.length > 3 ? styles.compactCheckbox : null,
                          isSelected(index) && styles.checkedBox
                        ]}>
                          {isSelected(index) && (
                            <Ionicons 
                              name="checkmark" 
                              size={predictions.length > 3 ? 12 : 16} 
                              color="#FFFFFF" 
                            />
                          )}
                        </View>
                        <Text style={[
                          styles.predictionName,
                          predictions.length > 3 ? styles.compactPredictionName : null,
                          isSelected(index) && styles.selectedPredictionName
                        ]}>
                          {prediction.name}
                        </Text>
                      </View>
                      <View style={styles.confidenceContainer}>
                        <View style={[
                          styles.confidenceBadge,
                          predictions.length > 3 ? styles.compactConfidenceBadge : null,
                          { backgroundColor: getConfidenceColor(prediction.confidence) }
                        ]}>
                          <Text style={[
                            styles.confidenceText,
                            predictions.length > 3 ? styles.compactConfidenceText : null
                          ]}>
                            {Math.round(prediction.confidence * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={[
                      styles.predictionDescription,
                      predictions.length > 3 ? styles.compactPredictionDescription : null
                    ]}>
                      {prediction.description}
                    </Text>

                    <View style={[
                      styles.nutritionRow,
                      predictions.length > 3 ? styles.compactNutritionRow : null
                    ]}>
                      <View style={styles.nutritionItem}>
                        <Text style={[
                          styles.nutritionValue,
                          predictions.length > 3 ? styles.compactNutritionValue : null
                        ]}>
                          {prediction.calories}
                        </Text>
                        <Text style={[
                          styles.nutritionLabel,
                          predictions.length > 3 ? styles.compactNutritionLabel : null
                        ]}>
                          cal
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[
                          styles.nutritionValue,
                          predictions.length > 3 ? styles.compactNutritionValue : null
                        ]}>
                          {prediction.carbs}g
                        </Text>
                        <Text style={[
                          styles.nutritionLabel,
                          predictions.length > 3 ? styles.compactNutritionLabel : null
                        ]}>
                          carbs
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[
                          styles.nutritionValue,
                          predictions.length > 3 ? styles.compactNutritionValue : null
                        ]}>
                          {prediction.protein}g
                        </Text>
                        <Text style={[
                          styles.nutritionLabel,
                          predictions.length > 3 ? styles.compactNutritionLabel : null
                        ]}>
                          protein
                        </Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={[
                          styles.nutritionValue,
                          predictions.length > 3 ? styles.compactNutritionValue : null
                        ]}>
                          {prediction.fat}g
                        </Text>
                        <Text style={[
                          styles.nutritionLabel,
                          predictions.length > 3 ? styles.compactNutritionLabel : null
                        ]}>
                          fat
                        </Text>
                      </View>
                    </View>
                  </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons - Hidden during loading */}
        {!isLoading && (
          <View style={styles.actionButtonsContainer}>
            <View style={styles.buttonRow}>
              {/* Submit Button */}
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  selectedFoods.length === 0 && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={selectedFoods.length === 0}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={selectedFoods.length > 0 ? "#FFFFFF" : "#C7C7CC"} 
                />
                <Text style={[
                  styles.submitButtonText,
                  selectedFoods.length === 0 && styles.disabledButtonText
                ]}>
                  Add {selectedFoods.length > 0 ? `${selectedFoods.length} ` : ''}Food{selectedFoods.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>

              {/* Manual Entry Option */}
              <TouchableOpacity 
                style={styles.manualEntryButton}
                onPress={() => {
                  onSelectFoods(null); // Signal manual entry
                  handleClose();
                }}
              >
                <Ionicons name="create-outline" size={20} color={AppColors.textSecondary} />
                <Text style={styles.manualEntryText}>Add Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

// Helper function to get confidence color
const getConfidenceColor = (confidence) => {
  if (confidence > 0.8) return '#34C759'; // Green
  if (confidence > 0.6) return '#FF9500'; // Orange
  return '#FF6B6B'; // Red
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropContent: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: screenHeight * 0.9,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: AppColors.backgroundSecondary,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  photoLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Compact photo styles
  compactPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactPhotoPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  // Compact header styles
  compactHeader: {
    marginBottom: spacing.md,
  },
  compactSubtitle: {
    fontSize: fonts.small,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  compactSelectedCount: {
    alignSelf: 'center',
  },
  compactSelectedText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#4682B4',
    textAlign: 'center',
  },
  // Loading state styles
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minWidth: screenWidth * 0.75,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingSpinner: {
    marginTop: 8,
  },
  subtitle: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  selectedCountContainer: {
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: AppColors.nutrition,
  },
  totalCaloriesText: {
    fontSize: fonts.small,
    color: AppColors.nutrition,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  predictionsContainer: {
    paddingBottom: spacing.md,
  },
  predictionItem: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactPredictionItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  selectedPrediction: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.nutrition,
    borderWidth: 2,
    shadowColor: AppColors.nutrition,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionContent: {
    flex: 1,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameAndCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppColors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
  },
  compactCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    marginRight: 8,
  },
  checkedBox: {
    backgroundColor: AppColors.nutrition,
    borderColor: AppColors.nutrition,
  },
  predictionName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: AppColors.textPrimary,
    flex: 1,
  },
  compactPredictionName: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  selectedPredictionName: {
    color: AppColors.nutrition,
    fontWeight: '700',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactConfidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  compactConfidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  predictionDescription: {
    fontSize: fonts.small,
    color: AppColors.textSecondary,
    marginBottom: spacing.sm,
  },
  compactPredictionDescription: {
    fontSize: fonts.tiny,
    marginBottom: spacing.xs,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactNutritionRow: {
    marginTop: spacing.xs,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: AppColors.nutrition,
  },
  compactNutritionValue: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: fonts.tiny,
    color: AppColors.textSecondary,
  },
  compactNutritionLabel: {
    fontSize: 9,
    color: '#8E8E93',
  },
  actionButtonsContainer: {
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.nutrition,
    padding: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  submitButtonText: {
    fontSize: fonts.medium,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#C7C7CC',
  },
  manualEntryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.backgroundSecondary,
  },
  manualEntryText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default MultiFoodSelectionCard;
