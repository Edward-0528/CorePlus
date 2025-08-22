import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const { height: screenHeight } = Dimensions.get('window');

const MultiFoodSelectionCard = ({ visible, onClose, predictions, onSelectFoods, imageUri }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [selectedFoods, setSelectedFoods] = useState([]);

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
            <Ionicons name="restaurant" size={24} color="#4682B4" />
            <Text style={styles.title}>Select Your Foods</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Photo Preview */}
        {imageUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            <Text style={styles.photoLabel}>Your photo</Text>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Select all the foods in your meal. You can choose multiple items:
        </Text>

        {/* Selected Count */}
        {selectedFoods.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedFoods.length} item{selectedFoods.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.totalCaloriesText}>
              Total: {selectedFoods.reduce((sum, food) => sum + food.calories, 0)} calories
            </Text>
          </View>
        )}

        {/* Predictions List */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.predictionsContainer}>
            {predictions.map((prediction, index) => (
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

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
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
            <Ionicons name="create-outline" size={20} color="#8E8E93" />
            <Text style={styles.manualEntryText}>None of these? Add manually</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropContent: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: screenHeight * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#1D1D1F',
    marginLeft: spacing.sm,
  },
  closeButton: {
    padding: spacing.sm,
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
    color: '#4682B4',
  },
  totalCaloriesText: {
    fontSize: fonts.small,
    color: '#4682B4',
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
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  compactPredictionItem: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  selectedPrediction: {
    backgroundColor: '#E6F3FF',
    borderColor: '#4682B4',
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  checkedBox: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  predictionName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  compactPredictionName: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  selectedPredictionName: {
    color: '#4682B4',
    fontWeight: '700',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactConfidenceBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactConfidenceText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  predictionDescription: {
    fontSize: fonts.small,
    color: '#8E8E93',
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
    color: '#4682B4',
  },
  compactNutritionValue: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
  },
  compactNutritionLabel: {
    fontSize: 9,
    color: '#8E8E93',
  },
  actionButtonsContainer: {
    gap: spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    padding: spacing.md,
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  manualEntryText: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
});

export default MultiFoodSelectionCard;
