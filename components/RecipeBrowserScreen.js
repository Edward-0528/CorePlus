import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Image,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { recipeService } from '../services/recipeService';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import BarcodeScanner from './BarcodeScanner';

const { width } = Dimensions.get('window');

const RecipeBrowserScreen = ({ 
  visible, 
  onClose, 
  onSelectRecipe,
  mealType = null,
  targetCalories = null,
  isPremium = false 
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // search, ingredients, favorites, history
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [recipes, setRecipes] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [recipeHistory, setRecipeHistory] = useState([]);
  const [userIngredients, setUserIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [showIngredientScanner, setShowIngredientScanner] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  // Get user context
  const { user } = useDailyCalories();

  // Diet and filter options
  const dietOptions = [
    { id: 'all', label: 'All Diets', icon: 'restaurant-outline' },
    { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline' },
    { id: 'vegan', label: 'Vegan', icon: 'flower-outline' },
    { id: 'ketogenic', label: 'Keto', icon: 'fitness-outline' },
    { id: 'paleo', label: 'Paleo', icon: 'barbell-outline' },
    { id: 'gluten-free', label: 'Gluten Free', icon: 'medical-outline' },
    { id: 'dairy-free', label: 'Dairy Free', icon: 'water-outline' }
  ];

  const nutritionFilters = [
    { id: 'low-carb', label: 'Low Carb (<30g)', maxCarbs: '30' },
    { id: 'low-sodium', label: 'Low Sodium (<600mg)', maxSodium: '600' },
    { id: 'low-cal', label: 'Low Calorie (<400)', maxCalories: '400' },
    { id: 'high-protein', label: 'High Protein (>25g)', minProtein: '25' },
    { id: 'quick', label: 'Quick (<20 min)', maxReadyTime: '20' }
  ];

  const tabs = [
    { id: 'search', label: 'Search', icon: 'search-outline' },
    { id: 'ingredients', label: 'My Pantry', icon: 'basket-outline' },
    { id: 'favorites', label: 'Favorites', icon: 'heart-outline' },
    { id: 'history', label: 'History', icon: 'time-outline' }
  ];

  // Load initial data
  useEffect(() => {
    if (visible && user?.id) {
      loadInitialData();
    }
  }, [visible, user?.id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFavorites(),
        loadHistory(),
        loadUserIngredients()
      ]);
      
      // Auto-search if we have a target
      if (activeTab === 'search') {
        await searchRecipes();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favorites = await recipeService.getFavoriteRecipes(user.id);
      setFavoriteRecipes(favorites.map(fav => fav.recipe_data || fav));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await recipeService.getRecipeHistory(user.id);
      setRecipeHistory(history.map(item => item.recipe_data || item));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadUserIngredients = async () => {
    try {
      const ingredients = await recipeService.getUserIngredients(user.id);
      setUserIngredients(ingredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  // Search recipes with current filters
  const searchRecipes = async (query = searchQuery) => {
    setLoading(true);
    try {
      const filters = buildFilterObject();
      const results = await recipeService.searchRecipes(query, filters);
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
      Alert.alert('Search Error', 'Unable to search recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find recipes by available ingredients
  const findRecipesByIngredients = async () => {
    if (userIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Add some ingredients to your pantry first!');
      return;
    }

    setLoading(true);
    try {
      const results = await recipeService.getRecipesByIngredients(userIngredients);
      setRecipes(results);
    } catch (error) {
      console.error('Error finding recipes by ingredients:', error);
      Alert.alert('Search Error', 'Unable to find recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build filter object from selected filters
  const buildFilterObject = () => {
    const filters = {};
    
    if (selectedFilters.diet && selectedFilters.diet !== 'all') {
      filters.diet = selectedFilters.diet;
    }
    
    // Apply nutrition filters
    Object.keys(selectedFilters).forEach(filterId => {
      if (selectedFilters[filterId]) {
        const nutritionFilter = nutritionFilters.find(f => f.id === filterId);
        if (nutritionFilter) {
          Object.assign(filters, nutritionFilter);
        }
      }
    });

    // Add target-based filters
    if (targetCalories) {
      filters.maxCalories = targetCalories + 100; // Allow some flexibility
    }
    
    if (mealType) {
      filters.mealType = mealType;
    }

    return filters;
  };

  // Handle recipe selection
  const handleRecipeSelect = async (recipe) => {
    try {
      // Add to history
      await recipeService.addToHistory(user.id, recipe);
      
      // Get detailed recipe information
      setLoading(true);
      const detailedRecipe = await recipeService.getRecipeDetails(recipe.id);
      setSelectedRecipe(detailedRecipe || recipe);
      setShowRecipeDetails(true);
      
      // Update history state
      await loadHistory();
    } catch (error) {
      console.error('Error selecting recipe:', error);
      setSelectedRecipe(recipe);
      setShowRecipeDetails(true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (recipe) => {
    try {
      const isFavorite = favoriteRecipes.some(fav => fav.id === recipe.id);
      
      if (isFavorite) {
        await recipeService.removeFromFavorites(user.id, recipe.id);
        setFavoriteRecipes(prev => prev.filter(fav => fav.id !== recipe.id));
      } else {
        await recipeService.addToFavorites(user.id, recipe);
        setFavoriteRecipes(prev => [recipe, ...prev]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Unable to update favorites. Please try again.');
    }
  };

  // Add ingredient manually
  const addIngredient = async () => {
    if (!newIngredient.trim()) return;
    
    const updatedIngredients = [...userIngredients, newIngredient.trim()];
    setUserIngredients(updatedIngredients);
    await recipeService.saveUserIngredients(user.id, updatedIngredients);
    setNewIngredient('');
    setShowAddIngredient(false);
  };

  // Remove ingredient
  const removeIngredient = async (ingredient) => {
    const updatedIngredients = userIngredients.filter(ing => ing !== ingredient);
    setUserIngredients(updatedIngredients);
    await recipeService.saveUserIngredients(user.id, updatedIngredients);
  };

  // Handle ingredient scan
  const handleIngredientScan = async (barcode) => {
    // This would integrate with a product database to identify the ingredient
    // For now, we'll just prompt the user to enter the ingredient name
    Alert.prompt(
      'Ingredient Scanned',
      `Barcode: ${barcode}\nWhat ingredient is this?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (ingredientName) => {
            if (ingredientName && ingredientName.trim()) {
              const updatedIngredients = [...userIngredients, ingredientName.trim()];
              setUserIngredients(updatedIngredients);
              recipeService.saveUserIngredients(user.id, updatedIngredients);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [activeTab]);

  // Render recipe card with nutrition facts
  const renderRecipeCard = ({ item: recipe }) => {
    const isFavorite = favoriteRecipes.some(fav => fav.id === recipe.id);
    const nutrition = recipe.nutrition || {};
    
    return (
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => handleRecipeSelect(recipe)}
      >
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        ) : (
          <View style={[styles.recipeImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(recipe)}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? "#FF6B6B" : "#666"} 
          />
        </TouchableOpacity>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          
          {/* Nutrition facts preview */}
          <View style={styles.nutritionPreview}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.calories || 0}</Text>
              <Text style={styles.nutritionLabel}>cal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.protein || 0}g</Text>
              <Text style={styles.nutritionLabel}>protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.carbs || 0}g</Text>
              <Text style={styles.nutritionLabel}>carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutrition.fat || 0}g</Text>
              <Text style={styles.nutritionLabel}>fat</Text>
            </View>
          </View>

          <View style={styles.recipeMetadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metadataText}>{recipe.readyInMinutes || 30} min</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metadataText}>{recipe.servings || 1} serving{(recipe.servings || 1) > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="bar-chart-outline" size={14} color="#666" />
              <Text style={styles.metadataText}>{recipe.difficulty || 'Medium'}</Text>
            </View>
          </View>

          {/* Special diet indicators */}
          <View style={styles.dietTags}>
            {recipe.isVegetarian && <Text style={styles.dietTag}>🌱 Vegetarian</Text>}
            {recipe.isVegan && <Text style={styles.dietTag}>🌿 Vegan</Text>}
            {recipe.isGlutenFree && <Text style={styles.dietTag}>🚫 Gluten Free</Text>}
            {recipe.isDairyFree && <Text style={styles.dietTag}>🥛 Dairy Free</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
      fat: 20,
      time: 20,
      difficulty: 'Medium',
      category: 'dinner',
      image: 'https://example.com/salmon.jpg',
      ingredients: ['Salmon fillet', 'Teriyaki sauce', 'Rice', 'Broccoli'],
      isPremium: true
    },
    {
      id: 3,
      name: 'Protein Pancakes',
      calories: 320,
      protein: 28,
      carbs: 35,
      fat: 8,
      time: 15,
      difficulty: 'Easy',
      category: 'breakfast',
      image: 'https://example.com/pancakes.jpg',
      ingredients: ['Protein powder', 'Oats', 'Banana', 'Eggs', 'Almond milk'],
      isPremium: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'breakfast', name: 'Breakfast', icon: 'sunny-outline' },
    { id: 'lunch', name: 'Lunch', icon: 'partly-sunny-outline' },
    { id: 'dinner', name: 'Dinner', icon: 'moon-outline' },
    { id: 'snack', name: 'Snacks', icon: 'nutrition-outline' }
  ];

  useEffect(() => {
    // Filter recipes based on meal type and target calories
    let filtered = sampleRecipes;
    
    if (mealType && mealType !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === mealType);
    }
    
    if (targetCalories) {
      // Show recipes within ±100 calories of target
      filtered = filtered.filter(recipe => 
        Math.abs(recipe.calories - targetCalories) <= 100
      );
    }
    
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }
    
    setRecipes(filtered);
  }, [mealType, targetCalories, searchQuery, selectedCategory]);

  const RecipeCard = ({ recipe }) => {
    const isLocked = recipe.isPremium && !isPremium;
    
    return (
      <TouchableOpacity 
        style={[styles.recipeCard, isLocked && styles.lockedCard]}
        onPress={() => isLocked ? null : onSelectRecipe(recipe)}
        activeOpacity={isLocked ? 1 : 0.7}
      >
        {/* Recipe Image Placeholder */}
        <View style={styles.recipeImageContainer}>
          <View style={styles.recipeImagePlaceholder}>
            <Ionicons name="restaurant" size={40} color="#C7C7CC" />
          </View>
          {isLocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
            </View>
          )}
          {recipe.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeName, isLocked && styles.lockedText]} numberOfLines={2}>
            {recipe.name}
          </Text>
          
          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={14} color="#FF6B6B" />
              <Text style={styles.statText}>{recipe.calories} cal</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color="#4682B4" />
              <Text style={styles.statText}>{recipe.time}m</Text>
            </View>
          </View>

          <View style={styles.macroInfo}>
            <Text style={styles.macroText}>P: {recipe.protein}g</Text>
            <Text style={styles.macroText}>C: {recipe.carbs}g</Text>
            <Text style={styles.macroText}>F: {recipe.fat}g</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Recipe Browser</Text>
              {mealType && (
                <Text style={styles.headerSubtitle}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)} recipes
                  {targetCalories && ` • ~${targetCalories} cal`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.id ? '#FFFFFF' : '#4682B4'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recipe Grid */}
        <ScrollView style={styles.recipesContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
          
          {recipes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSubtitle: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: fonts.medium,
    color: '#1D1D1F',
  },
  categoryScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  selectedCategory: {
    backgroundColor: '#4682B4',
  },
  categoryText: {
    fontSize: fonts.small,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  recipesContainer: {
    flex: 1,
    padding: spacing.md,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.7,
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImagePlaceholder: {
    height: 120,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B4513',
  },
  recipeInfo: {
    padding: spacing.sm,
  },
  recipeName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  lockedText: {
    color: '#8E8E93',
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginLeft: 4,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: fonts.small,
    color: '#4682B4',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fonts.medium,
    color: '#C7C7CC',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default RecipeBrowserScreen;
