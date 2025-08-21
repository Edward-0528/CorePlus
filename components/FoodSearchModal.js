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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, scaleWidth, scaleHeight } from '../utils/responsive';
import { foodSearchService } from '../services/foodSearchService';

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
        // Show the fallback food if API failed
        setSearchResults(result.foods || []);
        if (!result.success) {
          Alert.alert(
            'Search Notice',
            'Using estimated nutritional information. Results may not be completely accurate.',
            [{ text: 'OK' }]
          );
        }
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

      // Show success feedback
      Alert.alert(
        'Meal Added!',
        `${food.name} has been added to your daily meals.`,
        [{ text: 'OK', onPress: () => onClose() }]
      );

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
      style={styles.foodCard}
      onPress={() => onSelect(food)}
      activeOpacity={0.7}
    >
      <View style={styles.foodHeader}>
        <Text style={styles.foodName}>{food.name}</Text>
        <View style={[styles.confidenceBadge, { 
          backgroundColor: food.confidence > 0.8 ? '#34C759' : food.confidence > 0.6 ? '#FF9500' : '#FF6B6B' 
        }]}>
          <Text style={styles.confidenceText}>
            {Math.round(food.confidence * 100)}%
          </Text>
        </View>
      </View>
      
      <Text style={styles.servingSize}>{food.serving_size}</Text>
      
      <View style={styles.nutritionRow}>
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

      {/* Extended Nutrition Row */}
      <View style={styles.nutritionRow}>
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

      {food.notes && (
        <Text style={styles.foodNotes}>{food.notes}</Text>
      )}

      <View style={styles.addButton}>
        <Ionicons name="add-circle" size={24} color="#34C759" />
        <Text style={styles.addButtonText}>Add to Meals</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search Food</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Enter food name (e.g., 'chicken breast', 'apple', 'pizza slice')"
                placeholderTextColor="#999"
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
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          <ScrollView 
            style={styles.resultsContainer}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {isSearching && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Searching for nutritional information...</Text>
              </View>
            )}

            {hasSearched && !isSearching && searchResults.length > 0 && (
              <>
                <Text style={styles.resultsHeader}>
                  Found {searchResults.length} option{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </Text>
                {searchResults.map((food, index) => (
                  <FoodResultCard
                    key={index}
                    food={food}
                    onSelect={handleSelectFood}
                  />
                ))}
              </>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#CCC" />
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsText}>
                  Try searching with different keywords or check the spelling.
                </Text>
              </View>
            )}

            {!hasSearched && !isSearching && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="restaurant" size={48} color="#4A90E2" />
                <Text style={styles.instructionsTitle}>Search for Food</Text>
                <Text style={styles.instructionsText}>
                  Enter the name of any food item to get detailed nutritional information.
                </Text>
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Examples:</Text>
                  <Text style={styles.exampleText}>• "grilled chicken breast"</Text>
                  <Text style={styles.exampleText}>• "medium apple"</Text>
                  <Text style={styles.exampleText}>• "slice of pizza"</Text>
                  <Text style={styles.exampleText}>• "cup of rice"</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  placeholder: {
    width: 32,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fonts.medium,
    color: '#1D1D1F',
  },
  searchButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#A8C8EC',
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: fonts.medium,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.lg,
  },
  resultsHeader: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.md,
  },
  foodCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  foodName: {
    flex: 1,
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginRight: spacing.sm,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: fonts.small,
    fontWeight: '600',
  },
  servingSize: {
    fontSize: fonts.small,
    color: '#666',
    marginBottom: spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: fonts.small,
    color: '#666',
    marginTop: 2,
  },
  foodNotes: {
    fontSize: fonts.small,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  addButtonText: {
    color: '#34C759',
    fontSize: fonts.medium,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fonts.medium,
    color: '#666',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noResultsTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#666',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noResultsText: {
    fontSize: fonts.medium,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  instructionsTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: fonts.medium,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  examplesContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: spacing.lg,
  },
  examplesTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.sm,
  },
  exampleText: {
    fontSize: fonts.medium,
    color: '#666',
    marginBottom: 4,
  },
};

export default FoodSearchModal;
