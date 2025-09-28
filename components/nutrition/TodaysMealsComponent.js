import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import SwipeToDeleteWrapper from '../shared/SimpleSwipeToDelete';

// Define colors directly
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
  danger: '#DC3545',
};

const TodaysMealsComponent = ({ 
  styles, 
  showViewAll = true, 
  onViewAllPress,
  onMealPress,
  maxMealsToShow = null,
  emptyStateMessage = "No meals logged today",
  emptyStateSubtext = "Tap the + button to add your first meal"
}) => {
  const { todaysMeals, deleteMeal } = useDailyCalories();

  const handleDeleteMeal = async (mealId) => {
    try {
      console.log('🗑️ Deleting meal:', mealId);
      const result = await deleteMeal(mealId);
      
      if (result.success) {
        console.log('✅ Meal deleted successfully');
      } else {
        console.error('❌ Failed to delete meal:', result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting meal:', error);
    }
  };

  // Limit meals if maxMealsToShow is specified
  const mealsToShow = maxMealsToShow ? todaysMeals.slice(0, maxMealsToShow) : todaysMeals;
  const hasMoreMeals = maxMealsToShow && todaysMeals.length > maxMealsToShow;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {showViewAll && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={styles.sectionAction}>
              {hasMoreMeals ? `View All (${todaysMeals.length})` : 'View All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionLine} />
      
      <View style={styles.card}>
        {todaysMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color={AppColors.textSecondary} />
            <Text style={styles.emptyStateText}>{emptyStateMessage}</Text>
            <Text style={styles.emptyStateSubtext}>{emptyStateSubtext}</Text>
          </View>
        ) : (
          mealsToShow.map((meal, index) => (
            <View key={meal.id}>
              <SwipeToDeleteWrapper 
                onDelete={() => handleDeleteMeal(meal.id)}
                enabled={true}
                mealName={meal.name}
              >
                <TouchableOpacity 
                  style={styles.mealRow}
                  onPress={() => onMealPress && onMealPress(meal)}
                >
                  <View style={styles.mealInfo}>
                    <Ionicons name="restaurant-outline" size={18} color={AppColors.nutrition} />
                    <View style={styles.mealDetails}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealTime}>
                        {meal.meal_type || meal.method || 'Meal'} • {meal.time}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealCalories}>
                    <Text style={styles.mealValue}>{meal.calories}</Text>
                    <Text style={styles.mealUnit}>cal</Text>
                  </View>
                </TouchableOpacity>
              </SwipeToDeleteWrapper>
              {index < mealsToShow.length - 1 && <View style={styles.mealDivider} />}
            </View>
          ))
        )}
        
        {/* Show "and X more..." if there are more meals */}
        {hasMoreMeals && (
          <TouchableOpacity 
            style={styles.moreRowButton}
            onPress={onViewAllPress}
          >
            <Text style={styles.moreRowText}>
              and {todaysMeals.length - maxMealsToShow} more meals...
            </Text>
            <Ionicons name="chevron-forward-outline" size={16} color={AppColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default TodaysMealsComponent;
