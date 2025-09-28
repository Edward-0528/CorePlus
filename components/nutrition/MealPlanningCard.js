import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const MealPlanningCard = ({ 
  dailyCalories = 0, 
  calorieGoal = 2000, 
  onViewRecipes, 
  onCreateMealPlan,
  onViewMealPlan,
  hasMealPlan = false,
  isPremium = false 
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const remainingCalories = calorieGoal - dailyCalories;
  const isLowCalories = remainingCalories > 400;

  useEffect(() => {
    // Smart suggestions based on remaining calories and time of day
    const hour = new Date().getHours();
    let suggestedMeal = null;

    if (isLowCalories) {
      if (hour < 10) {
        suggestedMeal = { type: 'breakfast', calories: Math.min(remainingCalories, 500) };
      } else if (hour < 15) {
        suggestedMeal = { type: 'lunch', calories: Math.min(remainingCalories, 600) };
      } else if (hour < 21) {
        suggestedMeal = { type: 'dinner', calories: Math.min(remainingCalories, 700) };
      } else {
        suggestedMeal = { type: 'snack', calories: Math.min(remainingCalories, 300) };
      }
    }

    setSuggestion(suggestedMeal);
  }, [remainingCalories, isLowCalories]);

  if (!isLowCalories && !hasMealPlan) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant-outline" size={20} color="#4682B4" />
          <Text style={styles.headerTitle}>Meal Planning</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Smart Suggestions */}
      {suggestion && (
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionTitle}>
              Suggested {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
            </Text>
            <Text style={styles.suggestionCalories}>{suggestion.calories} cal remaining</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipeScroll}>
            <TouchableOpacity 
              style={styles.quickRecipe} 
              onPress={() => onViewRecipes(suggestion.type, suggestion.calories)}
            >
              <View style={styles.recipeIcon}>
                <Ionicons name="search-outline" size={16} color="#4682B4" />
              </View>
              <Text style={styles.recipeText}>Find Recipes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickRecipe} 
              onPress={() => onCreateMealPlan(suggestion)}
            >
              <View style={styles.recipeIcon}>
                <Ionicons name="calendar-outline" size={16} color="#4682B4" />
              </View>
              <Text style={styles.recipeText}>Plan Week</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Existing Meal Plan */}
      {hasMealPlan && (
        <TouchableOpacity style={styles.mealPlanCard} onPress={onViewMealPlan}>
          <View style={styles.mealPlanContent}>
            <View style={styles.mealPlanIcon}>
              <Ionicons name="calendar-clear-outline" size={20} color="#4682B4" />
            </View>
            <View style={styles.mealPlanText}>
              <Text style={styles.mealPlanTitle}>This Week's Meal Plan</Text>
              <Text style={styles.mealPlanSubtitle}>Tap to view your planned meals</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.recipeButton]} 
          onPress={() => onViewRecipes()}
        >
          <Ionicons name="book-outline" size={18} color="#4682B4" />
          <Text style={styles.actionButtonText}>Browse Recipes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.planButton]} 
          onPress={() => onCreateMealPlan()}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Create Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: spacing.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: spacing.xs,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: fonts.small,
    fontWeight: '700',
    color: '#8B4513',
  },
  suggestionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  suggestionTitle: {
    fontSize: fonts.medium,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  suggestionCalories: {
    fontSize: fonts.small,
    color: '#4682B4',
    fontWeight: '500',
  },
  recipeScroll: {
    marginTop: spacing.xs,
  },
  quickRecipe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recipeIcon: {
    marginRight: spacing.xs,
  },
  recipeText: {
    fontSize: fonts.small,
    color: '#4682B4',
    fontWeight: '500',
  },
  mealPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  mealPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealPlanIcon: {
    marginRight: spacing.sm,
  },
  mealPlanText: {
    flex: 1,
  },
  mealPlanTitle: {
    fontSize: fonts.medium,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  mealPlanSubtitle: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  recipeButton: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4682B4',
  },
  planButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#4682B4',
    marginLeft: spacing.xs,
  },
});

export default MealPlanningCard;
