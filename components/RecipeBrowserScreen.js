import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Image,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const RecipeBrowserScreen = ({ 
  visible, 
  onClose, 
  onSelectRecipe,
  mealType = null,
  targetCalories = null,
  isPremium = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample recipe data - in real app, this would come from your API
  const sampleRecipes = [
    {
      id: 1,
      name: 'Greek Chicken Bowl',
      calories: 450,
      protein: 35,
      carbs: 25,
      fat: 22,
      time: 25,
      difficulty: 'Easy',
      category: 'lunch',
      image: 'https://example.com/greek-bowl.jpg',
      ingredients: ['Chicken breast', 'Quinoa', 'Cucumber', 'Feta cheese', 'Olive oil'],
      isPremium: false
    },
    {
      id: 2,
      name: 'Salmon Teriyaki',
      calories: 380,
      protein: 32,
      carbs: 18,
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
