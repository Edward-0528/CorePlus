import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import { AppColors } from '../../constants/AppColors';

const FoodAnalysisResultsScreen = ({ route, navigation }) => {
  const { imageUri, predictions: initialPredictions, error: initialError } = route.params;
  const [predictions, setPredictions] = useState(initialPredictions || []);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(!initialPredictions || initialPredictions.length === 0);
  const { addMeal, refreshMealsFromServer } = useDailyCalories();

  useEffect(() => {
    console.log('🍕 FoodAnalysisResultsScreen mounted with:', {
      imageUri,
      predictionsLength: predictions.length,
      isLoading,
      error
    });
  }, []);

  // Update predictions when route params change
  useEffect(() => {
    if (route.params.predictions && route.params.predictions.length > 0) {
      setPredictions(route.params.predictions);
      setIsLoading(false);
    }
    if (route.params.error) {
      setError(route.params.error);
      setIsLoading(false);
    }
  }, [route.params.predictions, route.params.error]);

  const toggleFoodSelection = (prediction, index) => {
    setSelectedFoods(current => {
      const isSelected = current.some(food => food.index === index);
      if (isSelected) {
        return current.filter(food => food.index !== index);
      } else {
        return [...current, { ...prediction, index }];
      }
    });
  };

  const isSelected = (index) => {
    return selectedFoods.some(food => food.index === index);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#28A745';
    if (confidence >= 0.6) return '#FFC107';
    return '#DC3545';
  };

  const handleAddSelectedFoods = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert(
        'No Foods Selected',
        'Please select at least one food item to add to your meal log.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (selectedFoods.length === 1) {
        // Single food - add as-is
        const food = selectedFoods[0];
        const result = await addMeal({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber || 0,
          sugar: food.sugar || 0,
          sodium: food.sodium || 0,
          method: 'camera',
          confidence: food.confidence,
          imageUri: imageUri
        });

        if (result.success) {
          console.log('✅ Meal added successfully');
          await refreshMealsFromServer();
          navigation.goBack();
        }
      } else {
        // Multiple foods - combine into one meal
        const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
        const totalProtein = selectedFoods.reduce((sum, food) => sum + food.protein, 0);
        const totalCarbs = selectedFoods.reduce((sum, food) => sum + food.carbs, 0);
        const totalFat = selectedFoods.reduce((sum, food) => sum + food.fat, 0);
        const totalFiber = selectedFoods.reduce((sum, food) => sum + (food.fiber || 0), 0);
        const totalSugar = selectedFoods.reduce((sum, food) => sum + (food.sugar || 0), 0);
        const totalSodium = selectedFoods.reduce((sum, food) => sum + (food.sodium || 0), 0);
        
        const foodNames = selectedFoods.map(food => food.name).join(', ');
        const avgConfidence = selectedFoods.reduce((sum, food) => sum + food.confidence, 0) / selectedFoods.length;

        const result = await addMeal({
          name: foodNames,
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein * 10) / 10,
          carbs: Math.round(totalCarbs * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
          fiber: Math.round(totalFiber * 10) / 10,
          sugar: Math.round(totalSugar * 10) / 10,
          sodium: Math.round(totalSodium * 10) / 10,
          method: 'camera',
          confidence: avgConfidence,
          imageUri: imageUri
        });

        if (result.success) {
          console.log('✅ Combined meal added successfully');
          await refreshMealsFromServer();
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('❌ Error adding selected foods:', error);
      Alert.alert('Error', 'Failed to add meal. Please try again.');
    }
  };

  const handleAddManually = () => {
    navigation.goBack();
    // Could navigate to manual entry screen here if needed
  };

  if (isLoading && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analyzing Food</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Analyzing your meal...</Text>
          <Text style={styles.loadingSubtext}>Our AI is identifying the foods in your photo</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Error</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={48} color={AppColors.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Analysis</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Preview */}
        {imageUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            <Text style={styles.photoLabel}>Your photo</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            {predictions.length === 1 ? 'Confirm your meal:' : 'Select foods from your meal:'}
          </Text>
          {selectedFoods.length > 0 && (
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedText}>
                {selectedFoods.length} selected • {selectedFoods.reduce((sum, food) => sum + food.calories, 0)} cal
              </Text>
            </View>
          )}
        </View>

        {/* Food Predictions */}
        <View style={styles.predictionsContainer}>
          {predictions.map((prediction, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.predictionItem,
                isSelected(index) && styles.selectedPrediction
              ]}
              onPress={() => toggleFoodSelection(prediction, index)}
            >
              <View style={styles.predictionHeader}>
                <View style={styles.nameAndCheckbox}>
                  <View style={[
                    styles.checkbox,
                    isSelected(index) && styles.checkedBox
                  ]}>
                    {isSelected(index) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.predictionName,
                    isSelected(index) && styles.selectedPredictionName
                  ]}>
                    {prediction.name}
                  </Text>
                </View>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(prediction.confidence) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(prediction.confidence * 100)}%
                  </Text>
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Entry Option */}
        <TouchableOpacity style={styles.manualEntryButton} onPress={handleAddManually}>
          <Ionicons name="create-outline" size={20} color={AppColors.textSecondary} />
          <Text style={styles.manualEntryText}>Add manually instead</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[
            styles.addButton,
            selectedFoods.length === 0 && styles.disabledButton
          ]}
          onPress={handleAddSelectedFoods}
          disabled={selectedFoods.length === 0}
        >
          <Text style={[
            styles.addButtonText,
            selectedFoods.length === 0 && styles.disabledButtonText
          ]}>
            Add {selectedFoods.length > 0 ? `${selectedFoods.length} ` : ''}Food{selectedFoods.length > 1 ? 's' : ''} to Log
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  selectedSummary: {
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  predictionsContainer: {
    marginBottom: 20,
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
  selectedPrediction: {
    borderColor: AppColors.primary,
    borderWidth: 2,
    backgroundColor: AppColors.backgroundSecondary,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  checkedBox: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  predictionName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    flex: 1,
  },
  selectedPredictionName: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  predictionDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  manualEntryText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: AppColors.white,
  },
  addButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: AppColors.border,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
  },
  disabledButtonText: {
    color: AppColors.textSecondary,
  },
});

export default FoodAnalysisResultsScreen;
