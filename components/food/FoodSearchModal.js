import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Import enhanced food analysis service
import { foodAnalysisService } from '../../foodAnalysisService';

// Use the same colors as WorkingMinimalNutrition
const AppColors = {
  primary: '#6B8E23',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#8FBC8F',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
  primaryLight: '#8FBC8F',
};

const FoodSearchModal = ({ visible, onClose, onAddMeal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [isAddingMeals, setIsAddingMeals] = useState(false);

  // Helper function to fix capitalization issues
  const fixCapitalization = (text) => {
    if (!text) return text;
    
    // Fix common brand name capitalization issues
    return text
      .replace(/'S\b/g, "'s")  // Fix 'S to 's (McDonald'S → McDonald's)
      .replace(/'T\b/g, "'t")  // Fix 'T to 't (Don'T → Don't)
      .replace(/\bMCDONALD'S/gi, "McDonald's")  // Specific McDonald's fix
      .replace(/\bBURGER KING/gi, "Burger King")  // Burger King fix
      .replace(/\bKFC/gi, "KFC")  // KFC stays uppercase
      .replace(/\bTACO BELL/gi, "Taco Bell")  // Taco Bell fix
      .replace(/\bSUBWAY/gi, "Subway")  // Subway fix
      .replace(/\bWENDY'S/gi, "Wendy's")  // Wendy's fix
      .replace(/\bPIZZA HUT/gi, "Pizza Hut")  // Pizza Hut fix
      .replace(/\bDOMINO'S/gi, "Domino's")  // Domino's fix
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a food item to search for.');
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      console.log('🔍 Searching for:', searchQuery);
      
      // Use enhanced food analysis service for better accuracy
      const result = await foodAnalysisService.analyzeFoodText(searchQuery);
      
      if (result.success && result.predictions && result.predictions.length > 0) {
        // Convert predictions to the format expected by the modal
        const foods = result.predictions.map(prediction => ({
          name: fixCapitalization(prediction.name),
          calories: prediction.calories,
          carbs: prediction.carbs,
          protein: prediction.protein,
          fat: prediction.fat,
          fiber: prediction.fiber || 0,
          sugar: prediction.sugar || 0,
          sodium: prediction.sodium || 0,
          confidence: prediction.confidence || 0.8,
          serving_size: prediction.portion || 'per serving',
          notes: prediction.description || 'AI analysis',
          searchQuery: searchQuery,
          method: 'enhanced-analysis'
        }));
        
        setSearchResults(foods);
        console.log('✅ Found', foods.length, 'food options using enhanced analysis');
      } else {
        // Show empty results
        setSearchResults([]);
        console.log('❌ No results from enhanced analysis');
      }

      setHasSearched(true);

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search for food. Please try again.',
        [{ text: 'OK' }]
      );
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectFood = useCallback(async (food) => {
    // Toggle selection instead of immediately adding
    const foodIndex = searchResults.findIndex(result => result.name === food.name);
    const isSelected = selectedFoods.some(selected => selected.name === food.name);
    
    if (isSelected) {
      // Remove from selection
      setSelectedFoods(current => current.filter(selected => selected.name !== food.name));
    } else {
      // Add to selection
      setSelectedFoods(current => [...current, { ...food, index: foodIndex }]);
    }
  }, [searchResults, selectedFoods]);

  const handleAddSelectedMeals = useCallback(async () => {
    if (selectedFoods.length === 0) {
      Alert.alert('No Foods Selected', 'Please select at least one food item to add to your meals.');
      return;
    }

    setIsAddingMeals(true);
    
    try {
      // Add each selected food as a separate meal
      for (const food of selectedFoods) {
        const mealData = {
          name: food.name,
          calories: food.calories,
          carbs: food.carbs || 0,
          protein: food.protein || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          sugar: food.sugar || 0,
          sodium: food.sodium || 0,
          method: 'search',
          confidence: food.confidence || 0.8,
          searchQuery: food.searchQuery || searchQuery
        };

        console.log('🍽️ Adding searched food to meals:', mealData);
        await onAddMeal(mealData);
      }

      // Clear states and close modal after successful addition
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFoods([]);
      setHasSearched(false);
      onClose();

    } catch (error) {
      console.error('Error adding searched foods:', error);
      Alert.alert(
        'Error',
        'Failed to add meals. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAddingMeals(false);
    }
  }, [selectedFoods, searchQuery, onAddMeal, onClose]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFoods([]);
    setHasSearched(false);
    setIsSearching(false);
    setIsAddingMeals(false);
    onClose();
  }, [onClose]);

  const FoodResultCard = ({ food, onSelect, isSelected }) => (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(food)}
      activeOpacity={0.7}
    >
      {/* Main content row */}
      <View style={styles.cardMainRow}>
        {/* Selection indicator */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color={AppColors.white} />
          )}
        </View>

        {/* Food info - now takes more space */}
        <View style={styles.foodInfo}>
          <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]} numberOfLines={2}>
            {food.name}
          </Text>
          <Text style={styles.cardSubtext}>{food.serving_size}</Text>
        </View>

        {/* Confidence badge */}
        <View style={[styles.confidenceBadge, { 
          backgroundColor: food.confidence > 0.8 ? AppColors.success : food.confidence > 0.6 ? AppColors.warning : AppColors.workout 
        }]}>
          <Text style={styles.confidenceText}>
            {Math.round(food.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Nutrition row - always show with calories included */}
      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionValue, isSelected && styles.nutritionValueSelected]}>
            {food.calories}
          </Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.carbs}g</Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.protein}g</Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.fat}g</Text>
          <Text style={styles.nutritionLabel}>fat</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.title}>Add Meal Manually</Text>
              <View style={styles.placeholder} />
            </View>
          </View>
          <View style={styles.separator} />

          {/* Search Section */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Enter food name (e.g., 'chicken breast', 'apple', 'pizza slice')"
                  placeholderTextColor={AppColors.textLight}
                  autoFocus={true}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator color={AppColors.primary} size="small" />
                  ) : (
                    <Text style={styles.searchButtonText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Results Section */}
          <ScrollView 
            style={styles.resultsContainer}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {isSearching && (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={AppColors.nutrition} />
                <Text style={styles.emptyStateText}>Searching for nutritional information...</Text>
              </View>
            )}

            {hasSearched && !isSearching && searchResults.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </Text>
                  {selectedFoods.length > 0 && (
                    <Text style={styles.selectedCount}>
                      {selectedFoods.length} selected
                    </Text>
                  )}
                </View>
                <View style={styles.sectionLine} />
                
                {searchResults.map((food, index) => (
                  <FoodResultCard
                    key={index}
                    food={food}
                    onSelect={handleSelectFood}
                    isSelected={selectedFoods.some(selected => selected.name === food.name)}
                  />
                ))}

                {/* Add Selected Items Button */}
                {selectedFoods.length > 0 && (
                  <View style={styles.addSelectedContainer}>
                    <TouchableOpacity
                      style={[styles.addSelectedButton, isAddingMeals && styles.addSelectedButtonDisabled]}
                      onPress={handleAddSelectedMeals}
                      disabled={isAddingMeals}
                    >
                      {isAddingMeals ? (
                        <ActivityIndicator color={AppColors.white} size="small" />
                      ) : (
                        <>
                          <Ionicons name="restaurant" size={20} color={AppColors.white} />
                          <Text style={styles.addSelectedButtonText}>
                            Add {selectedFoods.length} Item{selectedFoods.length !== 1 ? 's' : ''} to Meals
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color={AppColors.border} />
                <Text style={styles.emptyStateText}>No results found</Text>
                <Text style={styles.emptyStateSubtext}>Try searching for a different food item</Text>
              </View>
            )}

            {!hasSearched && !isSearching && (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color={AppColors.border} />
                <Text style={styles.emptyStateText}>Search for any food</Text>
                <Text style={styles.emptyStateSubtext}>Get AI-powered nutrition estimates for any meal</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
    marginBottom: 8,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 25, // Pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    borderColor: AppColors.nutrition,
    borderWidth: 2,
    backgroundColor: '#f8fffe',
    shadowColor: AppColors.nutrition,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: AppColors.nutrition,
    borderColor: AppColors.nutrition,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  cardLabelSelected: {
    color: AppColors.nutrition,
  },
  cardSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  confidenceText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  nutritionValueSelected: {
    color: AppColors.nutrition,
    fontSize: 15,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  selectedCount: {
    fontSize: 12,
    color: AppColors.white,
    fontWeight: '600',
    backgroundColor: AppColors.nutrition,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addSelectedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.nutrition,
    borderRadius: 25, // Pill shape to match search button
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSelectedContainer: {
    marginHorizontal: -8, // Extend to edges for better visual impact
    marginTop: 8,
  },
  addSelectedButtonDisabled: {
    opacity: 0.6,
  },
  addSelectedButtonText: {
    color: AppColors.nutrition,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: AppColors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default FoodSearchModal;
