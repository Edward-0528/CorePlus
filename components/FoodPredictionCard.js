import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const { height: screenHeight } = Dimensions.get('window');

const FoodPredictionCard = ({ visible, onClose, predictions, onSelectFood, imageUri }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (visible) {
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

  const handleSelectFood = (prediction) => {
    Alert.alert(
      'Add to Log?',
      `Add "${prediction.name}" with ${prediction.calories} calories to your meal log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Meal', 
          onPress: () => {
            onSelectFood(prediction);
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
            <Text style={styles.title}>What did you eat?</Text>
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
          Select the food that best matches your meal:
        </Text>

        {/* Predictions List */}
        <View style={styles.predictionsContainer}>
          {predictions.map((prediction, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.predictionItem,
                index === 0 && styles.topPrediction
              ]}
              onPress={() => handleSelectFood(prediction)}
            >
              <View style={styles.predictionContent}>
                <View style={styles.predictionHeader}>
                  <Text style={[
                    styles.predictionName,
                    index === 0 && styles.topPredictionName
                  ]}>
                    {prediction.name}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <View style={[
                      styles.confidenceBadge,
                      { backgroundColor: getConfidenceColor(prediction.confidence) }
                    ]}>
                      <Text style={styles.confidenceText}>
                        {Math.round(prediction.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.predictionDescription}>
                  {prediction.description}
                </Text>

                <View style={styles.nutritionRow}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{prediction.calories}</Text>
                    <Text style={styles.nutritionLabel}>cal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{prediction.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{prediction.protein}g</Text>
                    <Text style={styles.nutritionLabel}>protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{prediction.fat}g</Text>
                    <Text style={styles.nutritionLabel}>fat</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Entry Option */}
        <TouchableOpacity 
          style={styles.manualEntryButton}
          onPress={() => {
            onSelectFood(null); // Signal manual entry
            handleClose();
          }}
        >
          <Ionicons name="create-outline" size={20} color="#8E8E93" />
          <Text style={styles.manualEntryText}>None of these? Add manually</Text>
        </TouchableOpacity>
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
    maxHeight: screenHeight * 0.85,
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
  predictionsContainer: {
    marginBottom: spacing.lg,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topPrediction: {
    backgroundColor: '#E6F3FF',
    borderColor: '#4682B4',
    borderWidth: 2,
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
  predictionName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  topPredictionName: {
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
  confidenceText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionDescription: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginBottom: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#4682B4',
  },
  nutritionLabel: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
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

export default FoodPredictionCard;
