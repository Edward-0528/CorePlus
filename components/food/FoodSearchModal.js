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
import { foodSearchService } from '../../services/foodSearchService';

// Use the same colors as WorkingMinimalNutrition
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

const FoodSearchModal = ({ visible, onClose, onAddMeal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a food item to search for.');
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      console.log('🔍 Searching for:', searchQuery);
      
      // Use suggestions endpoint for multiple options
      const result = await foodSearchService.searchFoodSuggestions(searchQuery);
      
      if (result.success && result.foods && result.foods.length > 0) {
        setSearchResults(result.foods);
        console.log('✅ Found', result.foods.length, 'food options');
      } else {
        // Show whatever came back without interruptive alerts
        setSearchResults(result.foods || []);
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
    try {
      // Format the food data for the meal system
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

      // Add meal using the parent callback
      await onAddMeal(mealData);

      // Clear search state after successful meal addition
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);

  // Lightweight feedback without modal interruption
  onClose();

    } catch (error) {
      console.error('Error adding searched food:', error);
      Alert.alert(
        'Error',
        'Failed to add meal. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [searchQuery, onAddMeal, onClose]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
    onClose();
  }, [onClose]);

  const FoodResultCard = ({ food, onSelect }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelect(food)}
      activeOpacity={0.7}
    >
      {/* Header with name and confidence */}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>{food.name}</Text>
        <View style={[styles.confidenceBadge, { 
          backgroundColor: food.confidence > 0.8 ? AppColors.success : food.confidence > 0.6 ? AppColors.warning : AppColors.workout 
        }]}>
          <Text style={styles.confidenceText}>
            {Math.round(food.confidence * 100)}%
          </Text>
        </View>
      </View>
      
      {/* Serving size */}
      <Text style={styles.cardSubtext}>{food.serving_size}</Text>
      
      {/* Main nutrition row */}
      <View style={styles.nutritionContainer}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.calories}</Text>
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

      {/* Secondary nutrition row */}
      <View style={styles.nutritionContainer}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.fiber || 0}g</Text>
          <Text style={styles.nutritionLabel}>fiber</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.sugar || 0}g</Text>
          <Text style={styles.nutritionLabel}>sugar</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{food.sodium || 0}mg</Text>
          <Text style={styles.nutritionLabel}>sodium</Text>
        </View>
        <View style={styles.nutritionItem}>
          {/* Empty space for alignment */}
        </View>
      </View>

      {/* Add button indicator */}
      <View style={styles.addButton}>
        <Ionicons name="add-circle" size={20} color={AppColors.nutrition} />
        <Text style={styles.addButtonText}>Add to Meals</Text>
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
            <Text style={styles.subtitle}>Search for food and get AI-powered nutrition estimates</Text>
          </View>
          <View style={styles.separator} />

          {/* Search Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search Food</Text>
            </View>
            <View style={styles.sectionLine} />
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={AppColors.textSecondary} style={styles.searchIcon} />
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
              </View>
              
              <TouchableOpacity
                style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color={AppColors.white} size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
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
                </View>
                <View style={styles.sectionLine} />
                
                {searchResults.map((food, index) => (
                  <FoodResultCard
                    key={index}
                    food={food}
                    onSelect={handleSelectFood}
                  />
                ))}
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
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  searchButton: {
    backgroundColor: AppColors.nutrition,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: AppColors.white,
    fontSize: 16,
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
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
    flex: 1,
  },
  cardSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  confidenceText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  nutritionLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  addButtonText: {
    fontSize: 14,
    color: AppColors.nutrition,
    fontWeight: '500',
    marginLeft: 6,
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
