import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';
import { formatTo12Hour } from '../utils/timeUtils';
import SwipeToDeleteWrapper from './common/SwipeToDeleteWrapper';
import MinimalisticDeleteModal from './MinimalisticDeleteModal';

const MealHistoryCard = ({ 
  historicalMeals = [], 
  onDeleteMeal, 
  getMealMethodIcon, 
  getMealMethodColor, 
  isLoading = false,
  daysToShow = 7
}) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [showAllDates, setShowAllDates] = useState(false);

  // Debug log to check if component is rendering
  console.log('🏷️ MealHistoryCard rendered with ULTRA TIGHT spacing - v2');

  console.log('🏠🏠 MealHistoryCard props:', {
    historicalMealsCount: historicalMeals?.length || 0,
    isLoading,
    daysToShow,
    sampleMeal: historicalMeals?.[0]
  });

  // Sort and group meals by date
  const groupedMeals = useMemo(() => {
    console.log('� MealHistoryCard grouping meals:', historicalMeals?.length || 0);
    if (!historicalMeals || historicalMeals.length === 0) return {};

    const grouped = {};
    
    historicalMeals
      .sort((a, b) => new Date(b.date || b.created_at || b.meal_date) - new Date(a.date || a.created_at || a.meal_date))
      .forEach(meal => {
        const dateKey = new Date(meal.date || meal.created_at || meal.meal_date).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({
          id: meal.id,
          name: meal.name || meal.meal_name,
          time: meal.time || meal.meal_time,
          calories: meal.calories || 0,
          carbs: meal.carbs || 0,
          protein: meal.protein || 0,
          fat: meal.fat || 0,
          method: meal.method || meal.meal_method || 'manual'
        });
      });

    console.log('� Final grouped meals keys:', Object.keys(grouped));
    console.log('� Final grouped meals:', grouped);
    return grouped;
  }, [historicalMeals]);

  const displayData = useMemo(() => {
    const allDates = Object.keys(groupedMeals);
    const dates = showAllDates ? allDates : allDates.slice(0, daysToShow);
    let totalMeals = 0;
    
    dates.forEach(date => {
      totalMeals += groupedMeals[date].length;
    });

    console.log('� Display data calculation:', {
      allDatesCount: allDates.length,
      allDates: allDates,
      displayedDatesCount: dates.length,
      totalMeals,
      showAllDates,
      daysToShow,
      isEmpty: totalMeals === 0
    });

    return { 
      dates, 
      totalMeals, 
      hasMore: allDates.length > daysToShow,
      totalDatesAvailable: allDates.length 
    };
  }, [groupedMeals, showAllDates, daysToShow]);

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Always show the actual date instead of relative dates
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (time) => {
    if (!time || time === 'Unknown') return 'Unknown';
    try {
      return formatTo12Hour(time);
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleDeleteMeal = (mealId, mealName) => {
    setMealToDelete({ id: mealId, name: mealName });
    setDeleteModalVisible(true);
  };

  const confirmDeleteMeal = async () => {
    if (mealToDelete && onDeleteMeal) {
      try {
        await onDeleteMeal(mealToDelete.id);
        setDeleteModalVisible(false);
        setMealToDelete(null);
      } catch (error) {
        console.error('Error deleting meal:', error);
        Alert.alert('Error', 'Failed to delete meal. Please try again.');
      }
    }
  };

  const toggleDateExpansion = (dateKey) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const getDayTotalCalories = (meals) => {
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  };

  const getDayNutritionTotals = (meals) => {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      protein: totals.protein + (meal.protein || 0),
      fat: totals.fat + (meal.fat || 0)
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="time-outline" size={18} color="#4682B4" />
            <Text style={styles.sectionTitle}>Meal History</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  if (displayData.totalMeals === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="time-outline" size={18} color="#4682B4" />
            <Text style={styles.sectionTitle}>Meal History</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#C7C7CC" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No meal history yet</Text>
          <Text style={styles.emptySubtitle}>
            Your previous meals will appear here once you start logging regularly.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={18} color="#4682B4" />
          <Text style={styles.sectionTitle}>Meal History</Text>
        </View>
        
        {displayData.totalMeals > 0 && (
          <Text style={styles.mealCount}>
            {displayData.totalMeals} meal{displayData.totalMeals !== 1 ? 's' : ''} across {displayData.dates.length} day{displayData.dates.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.historyList}>
        {displayData.dates.map((dateKey, dayIndex) => {
          const isExpanded = expandedDates.has(dateKey);
          const dayMeals = groupedMeals[dateKey];
          const dayTotalCalories = getDayTotalCalories(dayMeals);
          const dayNutritionTotals = getDayNutritionTotals(dayMeals);
          
          return (
            <View key={dateKey}>
              <View style={styles.dateGroup}>
              <TouchableOpacity 
                style={styles.dateHeader}
                onPress={() => toggleDateExpansion(dateKey)}
                activeOpacity={0.7}
              >
                <View style={styles.dateHeaderLeft}>
                  <Text style={styles.dateLabel}>{formatRelativeDate(dateKey)}</Text>
                  <Text style={styles.dateSubLabel}>
                    {dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''} • {dayTotalCalories} cal
                  </Text>
                </View>
                <View style={styles.dateHeaderRight}>
                  <Ionicons 
                    name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                    size={16} 
                    color="#4682B4" 
                    style={styles.chevronIcon}
                  />
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Condensed meal list */}
                  <View style={styles.mealsList}>
                    {dayMeals.map((meal, index) => (
                      <SwipeToDeleteWrapper
                        key={meal.id + '-' + index}
                        onDelete={() => handleDeleteMeal(meal.id, meal.name)}
                        enabled={true}
                      >
                        <View style={styles.condensedMealItem}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <View style={styles.condensedMealContent}>
                            <Text style={styles.condensedMealName} numberOfLines={1}>
                              {meal.name}
                            </Text>
                          </View>
                        </View>
                      </SwipeToDeleteWrapper>
                    ))}
                  </View>
                  
                  {/* Daily nutrition totals */}
                  <View style={styles.dailyTotalsSection}>
                    <Text style={styles.dailyTotalsLabel}>Daily Total</Text>
                    <View style={styles.dailyNutritionRow}>
                      <View style={styles.dailyNutritionItem}>
                        <Text style={styles.dailyNutritionValue}>{Math.round(dayNutritionTotals.calories)}</Text>
                        <Text style={styles.dailyNutritionLabel}>cal</Text>
                      </View>
                      <View style={styles.dailyNutritionItem}>
                        <Text style={styles.dailyNutritionValue}>{Math.round(dayNutritionTotals.carbs)}g</Text>
                        <Text style={styles.dailyNutritionLabel}>carbs</Text>
                      </View>
                      <View style={styles.dailyNutritionItem}>
                        <Text style={styles.dailyNutritionValue}>{Math.round(dayNutritionTotals.protein)}g</Text>
                        <Text style={styles.dailyNutritionLabel}>protein</Text>
                      </View>
                      <View style={styles.dailyNutritionItem}>
                        <Text style={styles.dailyNutritionValue}>{Math.round(dayNutritionTotals.fat)}g</Text>
                        <Text style={styles.dailyNutritionLabel}>fat</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              </View>
              
              {/* Day divider - show between days except after the last day */}
              {dayIndex < displayData.dates.length - 1 && (
                <View style={styles.dayDivider} />
              )}
            </View>
          );
        })}
      </View>

      {displayData.hasMore && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setShowAllDates(!showAllDates)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandButtonText}>
            {showAllDates 
              ? `Show Less (showing ${displayData.dates.length}/${displayData.totalDatesAvailable} days)` 
              : `Show ${displayData.totalDatesAvailable - daysToShow} More Days`
            }
          </Text>
          <Ionicons 
            name={showAllDates ? "chevron-up-outline" : "chevron-down-outline"} 
            size={16} 
            color="#4682B4" 
          />
        </TouchableOpacity>
      )}

      <MinimalisticDeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setMealToDelete(null);
        }}
        onConfirm={confirmDeleteMeal}
        title="Delete Meal"
        message="Remove this meal from your history?"
        mealName={mealToDelete ? mealToDelete.name : null}
        confirmText="Delete"
        isMultiple={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: spacing.xs,
  },
  mealCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: spacing.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    marginTop: spacing.sm,
  },
  dateGroup: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  dateHeaderLeft: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  dateSubLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  dateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCountBadge: {
    backgroundColor: '#4682B4',
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: spacing.xs,
    minWidth: 20,
    textAlign: 'center',
  },
  chevronIcon: {
    marginLeft: spacing.xs,
  },
  mealsContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  mealItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  mealInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: spacing.xs,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: spacing.sm,
  },
  methodBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  methodIcon: {
    fontSize: 12,
    color: 'white',
  },
  caloriesSection: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  mealDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 0,
  },
  dayDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: spacing.md,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: spacing.sm,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  
  // Condensed meal styles
  expandedContent: {
    backgroundColor: '#FFFFFF',
  },
  mealsList: {
    paddingVertical: 1,
  },
  condensedMealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 1,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: spacing.xs,
    marginTop: 2,
  },
  condensedMealContent: {
    flex: 1,
  },
  condensedMealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  
  // Daily totals styles
  dailyTotalsSection: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingHorizontal: spacing.md,
  },
  dailyTotalsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dailyNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dailyNutritionItem: {
    alignItems: 'center',
  },
  dailyNutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  dailyNutritionLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default MealHistoryCard;