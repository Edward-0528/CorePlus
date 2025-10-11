import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import SwipeToDeleteWrapper from '../shared/SimpleSwipeToDelete';
import { AppColors } from '../../constants/AppColors';

const TodaysMealsComponent = ({ 
  showViewAll = true, 
  onViewAllPress,
  onMealPress,
  onEmptyStatePress,
  maxMealsToShow = null,
  emptyStateMessage = "No meals logged today",
  emptyStateSubtext = "Tap to log your first meal"
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
          <TouchableOpacity 
            style={styles.emptyState}
            onPress={() => {
              console.log('📱 Empty state TouchableOpacity pressed');
              if (onEmptyStatePress) {
                console.log('✅ Calling onEmptyStatePress handler');
                onEmptyStatePress();
              } else {
                console.log('❌ No onEmptyStatePress handler provided');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.emptyStateIconContainer}>
              <Ionicons name="add-circle" size={40} color={AppColors.primary} />
            </View>
            <Text style={styles.emptyStateText}>{emptyStateMessage}</Text>
            <Text style={styles.emptyStateSubtext}>{emptyStateSubtext}</Text>
          </TouchableOpacity>
        ) : (
          mealsToShow.map((meal, index) => (
            <View key={meal.id}>
              <SwipeToDeleteWrapper 
                onDelete={() => handleDeleteMeal(meal.id)}
                enabled={true}
                mealName={meal.name}
              >
                <TouchableOpacity 
                  style={styles.mealCard}
                  onPress={() => onMealPress && onMealPress(meal)}
                >
                  <View style={styles.mealHeader}>
                    <Text 
                      style={styles.mealType}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {meal.name}
                    </Text>
                    <View style={styles.calorieInfo}>
                      <Text style={styles.calorieValue}>{meal.calories}</Text>
                      <Text style={styles.calorieUnit}>kcal</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  
                  <View style={styles.macroContainer}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>P</Text>
                      <Text style={styles.macroValue}>{Math.round(meal.protein || 0)}g</Text>
                    </View>
                    <View style={[styles.macroItem, { backgroundColor: '#E3F2FD' }]}>
                      <Text style={[styles.macroLabel, { color: '#1976D2' }]}>C</Text>
                      <Text style={styles.macroValue}>{Math.round(meal.carbs || 0)}g</Text>
                    </View>
                    <View style={[styles.macroItem, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={[styles.macroLabel, { color: '#F57C00' }]}>F</Text>
                      <Text style={styles.macroValue}>{Math.round(meal.fat || 0)}g</Text>
                    </View>
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

const styles = StyleSheet.create({
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: AppColors.white,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  mealCard: {
    padding: 16,
    backgroundColor: AppColors.white,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    flex: 1,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  calorieUnit: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 2,
  },
  mealTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  mealDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
  moreRowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.backgroundSecondary,
  },
  moreRowText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});

export default TodaysMealsComponent;
