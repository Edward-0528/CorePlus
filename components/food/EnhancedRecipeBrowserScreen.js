import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ScrollView, 
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
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { recipeService } from '../services/recipeService';
import { geminiService } from '../services/geminiService';
import { tastyService } from '../services/tastyService';
import { unifiedRecipeService } from '../services/unifiedRecipeService';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import BarcodeScanner from './BarcodeScanner';
import AnimatedLoader from './AnimatedLoader';

const { width } = Dimensions.get('window');

// Completely independent search input component - simplified to prevent re-renders
const SearchInput = React.forwardRef((props, ref) => {
  const [inputValue, setInputValue] = useState('');

  // Expose clear method to parent via ref
  React.useImperativeHandle(ref, () => ({
    clear: () => setInputValue(''),
    getValue: () => inputValue
  }));

  const handleSubmit = () => {
    if (inputValue.trim() && props.onSearch) {
      props.onSearch(inputValue.trim());
    }
  };

  return (
    <TextInput
      style={{
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
        fontWeight: '300',
      }}
      placeholder={props.placeholder || "Search..."}
      value={inputValue}
      onChangeText={setInputValue}
      onSubmitEditing={handleSubmit}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      blurOnSubmit={false}
      textContentType="none"
    />
  );
});

const RecipeBrowserScreen = ({ 
  visible = true, 
  onClose, 
  onSelectRecipe,
  mealType = null,
  targetCalories = null,
  isPremium = false,
  embedded = false,
  user: userProp = null
}) => {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // search, ingredients, favorites, history
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [recipes, setRecipes] = useState([]);
  const [ingredientRecipes, setIngredientRecipes] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [recipeHistory, setRecipeHistory] = useState([]);
  const [userIngredients, setUserIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [showIngredientScanner, setShowIngredientScanner] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  // Ref for search input
  const searchInputRef = useRef(null);

  // Get user context
  const { user: contextUser } = useDailyCalories();
  const user = userProp || contextUser;

  // Diet and filter options
  const dietOptions = [
    { id: 'all', label: 'All Diets', icon: 'restaurant-outline' },
    { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline' },
    { id: 'vegan', label: 'Vegan', icon: 'flower-outline' },
    { id: 'ketogenic', label: 'Keto', icon: 'fitness-outline' },
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
    { id: 'history', label: 'Journal', icon: 'time-outline' }
  ];

  // Auto-apply filters when they change (for existing search results)
  const [allRecipes, setAllRecipes] = useState([]); // Store unfiltered results
  
  // Simple filter application without complex dependencies
  // Temporarily commented out to test keyboard issue
  /*
  useEffect(() => {
    if (allRecipes.length > 0 && Object.keys(selectedFilters).length > 0) {
      const filters = buildFilterObject();
      const filteredResults = applyFiltersToRecipes(allRecipes, filters);
      setRecipes(filteredResults);
    }
  }, [selectedFilters]);
  */

  // Load initial data
  useEffect(() => {
    if (visible && user?.id) {
      loadInitialData();
    }
  }, [visible, user?.id]);

  // Clear recipes when switching tabs to prevent duplication
  useEffect(() => {
    if (activeTab === 'search') {
      setIngredientRecipes([]);
    } else if (activeTab === 'ingredients') {
      setRecipes([]);
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFavorites(),
        loadHistory(),
        loadUserIngredients()
      ]);
      
      // Don't auto-search - let user initiate search when ready
      // The search tab will show empty state with search prompt
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for loading favorites');
        return;
      }
      const favorites = await recipeService.getFavoriteRecipes(user.id);
      setFavoriteRecipes(favorites.map(fav => fav.recipe_data || fav));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadHistory = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for loading history');
        return;
      }
      const history = await recipeService.getRecipeHistory(user.id);
      setRecipeHistory(history.map(item => item.recipe_data || item));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadUserIngredients = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for loading ingredients');
        return;
      }
      const ingredients = await recipeService.getUserIngredients(user.id);
      setUserIngredients(ingredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  // Apply filters to recipe results (works with both AI and traditional results)
  const applyFiltersToRecipes = (recipes, filters) => {
    try {
      if (!recipes || !Array.isArray(recipes)) {
        console.log('Invalid recipes array provided to filter function');
        return [];
      }

      console.log(`Applying filters to ${recipes.length} recipes with filters:`, filters);

      return recipes.filter((recipe, index) => {
        try {
          // Ensure recipe has basic properties
          if (!recipe || !recipe.title) {
            console.log(`Recipe ${index} missing title, skipping`);
            return false;
          }

          // Diet filter
          if (filters.diet && filters.diet !== 'all') {
            const recipeTags = (recipe.tags || []).map(tag => tag.toLowerCase());
            const recipeTitle = recipe.title.toLowerCase();
            const dietKeywords = {
              'vegetarian': ['vegetarian', 'veggie'],
              'vegan': ['vegan'],
              'ketogenic': ['keto', 'ketogenic', 'low-carb', 'lowcarb'],
              'gluten-free': ['gluten-free', 'gluten free', 'gf'],
              'dairy-free': ['dairy-free', 'dairy free', 'lactose-free']
            };
            
            const keywords = dietKeywords[filters.diet] || [filters.diet];
            const matchesDiet = keywords.some(keyword => 
              recipeTags.includes(keyword) || recipeTitle.includes(keyword)
            );
            
            if (!matchesDiet) return false;
          }

          // Nutrition filters with safe property access
          const nutrition = recipe.nutrition || {};
          const calories = nutrition.calories || recipe.calories || 0;
          const carbs = nutrition.carbs || recipe.carbs || 0;
          const sodium = nutrition.sodium || recipe.sodium || 0;
          const protein = nutrition.protein || recipe.protein || 0;

          // Low carb filter
          if (filters['low-carb'] && carbs > 30) {
            return false;
          }

          // Low sodium filter
          if (filters['low-sodium'] && sodium > 600) {
            return false;
          }

          // Low calorie filter
          if (filters['low-cal'] && calories > 400) {
            return false;
          }

          // High protein filter
          if (filters['high-protein'] && protein < 20) {
            return false;
          }

          // Quick meals filter
          if (filters['quick'] && recipe.readyInMinutes && recipe.readyInMinutes > 20) {
            return false;
          }

          return true;
        } catch (recipeError) {
          console.error(`Error filtering recipe ${index}:`, recipeError, recipe);
          return false; // Skip problematic recipes
        }
      });
    } catch (error) {
      console.error('Error in applyFiltersToRecipes:', error);
      return recipes || []; // Return original recipes if filtering fails
    }
  };

  // Search recipes with current filters using AI and traditional search
  const searchRecipes = async (query = searchQuery, showAlert = true) => {
    if (!query.trim()) {
      if (showAlert) {
        Alert.alert('Search Required', 'Please enter a search term to find recipes.');
      }
      return;
    }

    setLoading(true);
    
    // Emotional loading messages for better UX
    const loadingMessages = [
      "Checking my recipe book...",
      "Searching for delicious ideas...",
      "Finding the perfect recipes...",
      "Cooking up some suggestions...",
      "Browsing through flavor combinations...",
      "Hunting for culinary treasures...",
      "Sifting through my favorite dishes...",
      "Discovering tasty possibilities..."
    ];
    
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    
    // Rotate through messages every 4 seconds while loading
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 4000);
    
    try {
      const filters = buildFilterObject();
      
      // Use unified search service that combines Spoonacular, Tasty, and AI
      console.log('🔍 Starting unified search for:', query);
      const results = await unifiedRecipeService.searchRecipes(query, filters);
      
      console.log('✨ Unified search completed:', results.length, 'recipes found');
      
      // Filter out any problematic results
      const validRecipes = results.filter(recipe => {
        return recipe && 
               recipe.title && 
               recipe.title.length > 3 &&
               !recipe.title.toLowerCase().match(/^(salt|pepper|oil|butter|cheese|milk)$/);
      });
      
      console.log('✅ Valid recipes after filtering:', validRecipes.length);
      
      setRecipes(validRecipes);
      
      if (validRecipes.length === 0) {
        Alert.alert('No Results', 'No recipes found for your search. Try different keywords or adjust your filters.');
      } else {
        console.log(`🎉 Search successful! Displaying ${validRecipes.length} recipes from multiple sources`);
        
        // Log source breakdown for debugging
        const sourceBreakdown = validRecipes.reduce((acc, recipe) => {
          const source = recipe.searchSource || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Source breakdown:', sourceBreakdown);
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      Alert.alert('Search Error', `Unable to search recipes: ${error.message}. Please try again.`);
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Find recipes by available ingredients
  const findRecipesByIngredients = async () => {
    if (userIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Add some ingredients to your pantry first!');
      return;
    }

    setLoading(true);
    
    // Emotional loading messages for ingredient-based search
    const ingredientMessages = [
      "Checking what you can cook...",
      "Looking through your pantry...",
      "Finding recipes with your ingredients...",
      "Creating magic with what you have...",
      "Discovering hidden possibilities...",
      "Matching your ingredients to recipes..."
    ];
    
    let messageIndex = 0;
    setLoadingMessage(ingredientMessages[0]);
    
    // Rotate through messages every 4 seconds while loading
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % ingredientMessages.length;
      setLoadingMessage(ingredientMessages[messageIndex]);
    }, 4000);
    
    try {
      const results = await recipeService.getRecipesByIngredients(userIngredients);
      setIngredientRecipes(results);
    } catch (error) {
      console.error('Error finding recipes by ingredients:', error);
      Alert.alert('Search Error', 'Unable to find recipes. Please try again.');
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage('');
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
      // Add to history only if user is available
      if (user?.id) {
        await recipeService.addToHistory(user.id, recipe);
      }
      
      // Get detailed recipe information
      setLoading(true);
      
      // For AI-generated recipes, use the original data
      if (recipe.isAIGenerated || (recipe.id && recipe.id.toString().startsWith('ai_recipe_'))) {
        console.log('Using AI-generated recipe as-is');
        setSelectedRecipe(recipe);
        setShowRecipeDetails(true);
      } else if (recipe.isAISearched) {
        console.log('Using AI-found real recipe as-is');
        setSelectedRecipe(recipe);
        setShowRecipeDetails(true);
      } else if (recipe.isTastyRecipe || recipe.searchSource === 'Tasty') {
        // For Tasty recipes, try to get detailed information from Tasty API
        console.log('🔍 Fetching detailed Tasty recipe information for:', recipe.title);
        const detailedTastyRecipe = await tastyService.getRecipeDetails(recipe.id);
        
        if (detailedTastyRecipe) {
          console.log('✅ Got detailed recipe from Tasty API:', {
            title: detailedTastyRecipe.title,
            instructions: detailedTastyRecipe.analyzedInstructions?.[0]?.steps?.length || 0,
            ingredients: detailedTastyRecipe.extendedIngredients?.length || 0,
            nutrition: detailedTastyRecipe.nutrition?.nutrients?.length || 0,
            readyTime: detailedTastyRecipe.readyInMinutes,
            summary: detailedTastyRecipe.summary?.substring(0, 100) + '...'
          });
          setSelectedRecipe(detailedTastyRecipe);
        } else {
          console.log('⚠️ Using basic Tasty recipe data - detailed fetch failed');
          setSelectedRecipe(recipe);
        }
        setShowRecipeDetails(true);
      } else {
        // Try to get detailed recipe information from API (only for Spoonacular recipes)
        const detailedRecipe = await recipeService.getRecipeDetails(recipe.id);
        
        if (detailedRecipe) {
          console.log('Got detailed recipe from API');
          setSelectedRecipe(detailedRecipe);
        } else {
          console.log('API details failed, using original recipe data');
          setSelectedRecipe(recipe);
        }
        setShowRecipeDetails(true);
      }
      
      // Update history state
      await loadHistory();
    } catch (error) {
      console.error('Error selecting recipe:', error);
      // Always fall back to showing the original recipe data
      setSelectedRecipe(recipe);
      setShowRecipeDetails(true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (recipe) => {
    try {
      if (!user?.id) {
        Alert.alert('Login Required', 'Please log in to save favorites.');
        return;
      }

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
    
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to save ingredients.');
      return;
    }
    
    const updatedIngredients = [...userIngredients, newIngredient.trim()];
    setUserIngredients(updatedIngredients);
    await recipeService.saveUserIngredients(user.id, updatedIngredients);
    setNewIngredient('');
    setShowAddIngredient(false);
  };

  // Remove ingredient
  const removeIngredient = async (ingredient) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to manage ingredients.');
      return;
    }

    const updatedIngredients = userIngredients.filter(ing => ing !== ingredient);
    setUserIngredients(updatedIngredients);
    await recipeService.saveUserIngredients(user.id, updatedIngredients);
  };

  // Handle ingredient scan
  const handleIngredientScan = async (barcode) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to save scanned ingredients.');
      return;
    }

    // This would integrate with a product database to identify the ingredient
    // For now, we'll just prompt the user to enter the ingredient name
    Alert.prompt(
      'Ingredient Scanned',
      `Barcode: ${barcode}\\nWhat ingredient is this?`,
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
    
    // Log image info for debugging
    console.log('Recipe:', recipe.title, 'Image URL:', recipe.image);
    
    return (
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => handleRecipeSelect(recipe)}
      >
        {recipe.image && recipe.image !== 'https://placeholder-image-url.jpg' ? (
          <Image 
            source={{ uri: recipe.image }} 
            style={styles.recipeImage}
            onError={(error) => console.log('Image load error for', recipe.title, ':', error.nativeEvent.error)}
            onLoad={() => console.log('Image loaded successfully for', recipe.title)}
          />
        ) : (
          <View style={[styles.recipeImage, styles.placeholderImage]}>
            <Ionicons name="restaurant-outline" size={40} color="#ccc" />
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

  // Render ingredient item
  const renderIngredientItem = ({ item: ingredient }) => (
    <View style={styles.ingredientItem}>
      <Text style={styles.ingredientText}>{ingredient}</Text>
      <TouchableOpacity 
        style={styles.removeIngredientButton}
        onPress={() => removeIngredient(ingredient)}
      >
        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  // Render filter pills
  const renderFilterPills = () => (
    <View style={styles.filterContainer}>
      {/* Filter Toggle Button */}
      <TouchableOpacity 
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
        <Ionicons 
          name={showFilters ? "chevron-up" : "chevron-down"} 
          size={14} 
          color="#50E3C2" 
        />
      </TouchableOpacity>

      {/* Collapsible Filter Pills */}
      {showFilters && (
        <View style={styles.filterRow}>
          {/* Diet filters - Updated with smaller rounded transparent buttons */}
          {dietOptions.map(diet => (
            <TouchableOpacity
              key={diet.id}
              style={[
                styles.filterPill,
                selectedFilters.diet === diet.id && styles.filterPillActive
              ]}
              onPress={() => setSelectedFilters(prev => ({ 
                ...prev, 
                diet: prev.diet === diet.id ? 'all' : diet.id 
              }))}
            >
              <Ionicons name={diet.icon} size={12} color={
                selectedFilters.diet === diet.id ? '#50E3C2' : '#666'
              } />
              <Text style={[
                styles.filterPillText,
                selectedFilters.diet === diet.id && styles.filterPillTextActive
              ]}>
                {diet.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Nutrition filters */}
          {nutritionFilters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterPill,
                selectedFilters[filter.id] && styles.filterPillActive
              ]}
              onPress={() => setSelectedFilters(prev => ({ 
                ...prev, 
                [filter.id]: !prev[filter.id] 
              }))}
            >
              <Text style={[
                styles.filterPillText,
                selectedFilters[filter.id] && styles.filterPillTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <View style={styles.tabContent}>
            {/* Search bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#666" />
                <SearchInput
                  ref={searchInputRef}
                  onSearch={(query) => {
                    setSearchQuery(query);
                    searchRecipes(query);
                  }}
                  placeholder="What are we cooking?"
                />
                <TouchableOpacity 
                  onPress={() => {
                    searchInputRef.current?.clear();
                    setSearchQuery('');
                    setRecipes([]);
                  }}
                  style={{ padding: 4, opacity: 0.7 }}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filters */}
            {renderFilterPills()}

            {/* Results */}
            <View style={{ flex: 1, position: 'relative' }}>
              <FlatList
                data={recipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.recipeRow}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                      <Text style={styles.emptyText}>No recipes found</Text>
                      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                    </View>
                  ) : null
                }
              />
              
              {/* Loading Overlay - Shows on top of existing results */}
              {loading && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingContainer}>
                    <AnimatedLoader 
                      size={100}
                      accent="#50E3C2"
                      background="transparent"
                      label=""
                      message={loadingMessage}
                      showLabel={true}
                      textColor="#333333"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        );

      case 'ingredients':
        return (
          <View style={styles.tabContent}>
            {/* Pantry header */}
            <View style={styles.pantryHeader}>
              <Text style={styles.pantryTitle}>My Pantry</Text>
              <View style={styles.pantryActions}>
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={() => setShowIngredientScanner(true)}
                >
                  <Ionicons name="scan-outline" size={20} color="#50E3C2" />
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddIngredient(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#50E3C2" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ingredients list */}
            {userIngredients.length > 0 ? (
              <>
                <FlatList
                  data={userIngredients}
                  renderItem={renderIngredientItem}
                  keyExtractor={(item, index) => index.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.ingredientRow}
                  style={styles.ingredientsList}
                />
                
                <TouchableOpacity 
                  style={styles.findRecipesButton}
                  onPress={findRecipesByIngredients}
                  disabled={loading}
                >
                  <Ionicons name="restaurant-outline" size={20} color="#fff" />
                  <Text style={styles.findRecipesButtonText}>
                    Find Recipes with These Ingredients
                  </Text>
                </TouchableOpacity>

                {ingredientRecipes.length > 0 && (
                  <View style={{ position: 'relative' }}>
                    <FlatList
                      data={ingredientRecipes}
                      renderItem={renderRecipeCard}
                      keyExtractor={(item) => item.id.toString()}
                      numColumns={2}
                      columnWrapperStyle={styles.recipeRow}
                      showsVerticalScrollIndicator={false}
                      style={styles.recipesList}
                    />
                    
                    {/* Loading Overlay for ingredients search */}
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <View style={styles.loadingContainer}>
                          <AnimatedLoader 
                            size={100}
                            accent="#50E3C2"
                            background="transparent"
                            label=""
                            message={loadingMessage}
                            showLabel={true}
                            textColor="#333333"
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}
                
                {/* Show loading when no recipes but searching */}
                {recipes.length === 0 && loading && (
                  <View style={styles.loadingContainer}>
                    <AnimatedLoader 
                      size={100}
                      accent="#50E3C2"
                      background="transparent"
                      label=""
                      message={loadingMessage}
                      showLabel={true}
                      textColor="#333333"
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Your pantry is empty</Text>
                <Text style={styles.emptySubtext}>Add ingredients to find recipes you can make</Text>
              </View>
            )}
          </View>
        );

      case 'favorites':
        return (
          <View style={styles.tabContent}>
            <FlatList
              data={favoriteRecipes}
              renderItem={renderRecipeCard}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.recipeRow}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No favorite recipes</Text>
                  <Text style={styles.emptySubtext}>Heart recipes to save them here</Text>
                </View>
              }
            />
          </View>
        );

      case 'history':
        return (
          <View style={styles.tabContent}>
            <FlatList
              data={recipeHistory}
              renderItem={renderRecipeCard}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.recipeRow}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="time-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No recent recipes</Text>
                  <Text style={styles.emptySubtext}>Recipes you view will appear here</Text>
                </View>
              }
            />
          </View>
        );

      default:
        return null;
    }
  };

  // Main content component
  const MainContent = () => (
    <>
      {/* Header - only show if not embedded */}
      {!embedded && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Browser</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#50E3C2' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}

      {/* Recipe Details Modal */}
      <Modal
        visible={showRecipeDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeDetails(false)}
      >
        <RecipeDetailsModal 
          recipe={selectedRecipe}
          onClose={() => setShowRecipeDetails(false)}
          onSelectRecipe={onSelectRecipe}
          onToggleFavorite={() => selectedRecipe && toggleFavorite(selectedRecipe)}
          isFavorite={selectedRecipe && favoriteRecipes.some(fav => fav.id === selectedRecipe.id)}
        />
      </Modal>

      {/* Ingredient Scanner Modal */}
      <Modal
        visible={showIngredientScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowIngredientScanner(false)}
      >
        <BarcodeScanner
          onScan={handleIngredientScan}
          onClose={() => setShowIngredientScanner(false)}
          title="Scan Ingredient Barcode"
        />
      </Modal>

      {/* Add Ingredient Modal */}
      <Modal
        visible={showAddIngredient}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddIngredient(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addIngredientModal}>
            <Text style={styles.modalTitle}>Add Ingredient</Text>
            <TextInput
              style={styles.ingredientInput}
              placeholder="Enter ingredient name..."
              value={newIngredient}
              onChangeText={setNewIngredient}
              autoFocus={true}
              onSubmitEditing={addIngredient}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddIngredient(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addIngredientButton}
                onPress={addIngredient}
              >
                <Text style={styles.addIngredientButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  // Return either embedded or modal version
  if (embedded) {
    return (
      <View style={styles.embeddedContainer}>
        <MainContent />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <MainContent />
      </SafeAreaView>
    </Modal>
  );
};

// Recipe Details Modal Component
const RecipeDetailsModal = ({ recipe, onClose, onSelectRecipe, onToggleFavorite, isFavorite }) => {
  if (!recipe) return null;

  const nutrition = recipe.nutrition || {};

  return (
    <SafeAreaView style={styles.detailsContainer}>
      <ScrollView style={styles.detailsScroll}>
        {/* Header */}
        <View style={styles.detailsHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF6B6B" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        {/* Recipe Image */}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.detailsImage} />
        ) : (
          <View style={[styles.detailsImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.detailsContent}>
          <Text style={styles.detailsTitle}>{recipe.title}</Text>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#50E3C2" />
              <Text style={styles.statText}>{recipe.readyInMinutes || 30} min</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color="#50E3C2" />
              <Text style={styles.statText}>{recipe.servings || 1} serving{(recipe.servings || 1) > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bar-chart-outline" size={20} color="#50E3C2" />
              <Text style={styles.statText}>{recipe.difficulty || 'Medium'}</Text>
            </View>
          </View>

          {/* Detailed Nutrition Facts */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Nutrition Facts (per serving)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.calories || 0}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.protein || 0}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.carbs || 0}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.fat || 0}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.fiber || 0}g</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.sodium || 0}mg</Text>
                <Text style={styles.nutritionLabel}>Sodium</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          {recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientDetailItem}>
                  <Text style={styles.ingredientDetailText}>
                    • {typeof ingredient === 'string' ? ingredient : ingredient.original || ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructions */}
          {recipe.instructions && Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}</Text>
                  <Text style={styles.instructionText}>
                    {typeof instruction === 'string' ? instruction : instruction.step}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Diet Tags */}
          <View style={styles.dietTagsSection}>
            {recipe.isVegetarian && <Text style={styles.dietTag}>🌱 Vegetarian</Text>}
            {recipe.isVegan && <Text style={styles.dietTag}>🌿 Vegan</Text>}
            {recipe.isGlutenFree && <Text style={styles.dietTag}>🚫 Gluten Free</Text>}
            {recipe.isDairyFree && <Text style={styles.dietTag}>🥛 Dairy Free</Text>}
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.selectRecipeButton}
          onPress={() => {
            onSelectRecipe(recipe);
            onClose();
          }}
        >
          <Text style={styles.selectRecipeButtonText}>Add to My Meals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  embeddedContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#50E3C2',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#50E3C2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 0,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '300',
  },
  filterContainer: {
    marginBottom: 4,
    paddingHorizontal: spacing.xs,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    height: 32,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#50E3C2',
    fontWeight: '500',
    marginHorizontal: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    height: 28,
    minWidth: 50,
  },
  filterPillActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderColor: '#50E3C2',
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
    fontWeight: '400',
    lineHeight: 13,
  },
  filterPillTextActive: {
    color: '#50E3C2',
    fontWeight: '500',
  },
  recipeRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recipeCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  nutritionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#50E3C2',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
  },
  recipeMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  dietTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietTag: {
    fontSize: 10,
    color: '#666',
    marginRight: 8,
    marginBottom: 2,
  },
  pantryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pantryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  pantryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#50E3C2',
  },
  scanButtonText: {
    color: '#50E3C2',
    fontWeight: '500',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#50E3C2',
  },
  addButtonText: {
    color: '#50E3C2',
    fontWeight: '500',
    marginLeft: 4,
  },
  ingredientsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  ingredientRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ingredientItem: {
    width: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeIngredientButton: {
    marginLeft: 8,
  },
  findRecipesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#50E3C2',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  findRecipesButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  recipesList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIngredientModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: width * 0.8,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  addIngredientButton: {
    flex: 1,
    backgroundColor: '#50E3C2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addIngredientButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Recipe Details Modal Styles
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsScroll: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  detailsImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F8F9FA',
  },
  detailsContent: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    lineHeight: 30,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 4,
  },
  nutritionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionCard: {
    width: (width - 64) / 3,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  ingredientDetailItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ingredientDetailText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#50E3C2',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  dietTagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectRecipeButton: {
    backgroundColor: '#50E3C2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectRecipeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecipeBrowserScreen;
