import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fonts } from '../utils/responsive';
import SwipeToDeleteWrapper from './common/SwipeToDeleteWrapper';
import MinimalisticDeleteModal from './MinimalisticDeleteModal';

const TodaysMealsSection = ({ meals, onDeleteMeal, getMealMethodIcon, getMealMethodColor, isLoading, onMealCountChange }) => {
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [mealToDelete, setMealToDelete] = React.useState(null);

  const totalMeals = meals ? meals.length : 0;
  
  // Notify parent of meal count changes
  React.useEffect(() => {
    if (onMealCountChange) {
      onMealCountChange(totalMeals);
    }
  }, [totalMeals, onMealCountChange]);
  
  // Sort meals by time (most recent first) for display
  const sortedMeals = useMemo(() => {
    if (!meals || meals.length === 0) return [];
    
    return [...meals].sort((a, b) => {
      const timeA = a.time || 'Unknown';
      const timeB = b.time || 'Unknown';
      
      if (timeA === 'Unknown') return 1;
      if (timeB === 'Unknown') return -1;
      
      try {
        // Parse time strings for comparison
        const parsedTimeA = timeA.split(':').map(num => parseInt(num));
        const parsedTimeB = timeB.split(':').map(num => parseInt(num));
        
        // Convert to minutes for easier comparison
        const minutesA = parsedTimeA[0] * 60 + (parsedTimeA[1] || 0);
        const minutesB = parsedTimeB[0] * 60 + (parsedTimeB[1] || 0);
        
        return minutesB - minutesA; // Most recent first
      } catch (error) {
        console.warn('Error sorting times:', error);
        return timeB.localeCompare(timeA);
      }
    });
  }, [meals]);

  const handleDeleteMeal = (mealId, mealName) => {
    setMealToDelete({ id: mealId, name: mealName });
    setDeleteModalVisible(true);
  };

  const confirmDeleteMeal = () => {
    if (mealToDelete) {
      onDeleteMeal(mealToDelete.id);
    }
    setMealToDelete(null);
  };

  const formatTime = (time) => {
    if (!time || time === 'Unknown') return 'Unknown';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      if (isNaN(hour) || isNaN(minute)) return 'Unknown';
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (totalMeals === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No meals logged yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your nutrition by logging your first meal!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mealsList}>
        {sortedMeals.map((meal, index) => (
          <SwipeToDeleteWrapper
            key={`meal-${meal.id}-${index}`}
            onDelete={() => handleDeleteMeal(meal.id, meal.name)}
            enabled={true}
          >
            <View style={styles.mealItem}>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <View style={styles.mealMeta}>
                    <Text style={styles.timeText}>{formatTime(meal.time)}</Text>
                    {getMealMethodIcon && (
                      <View style={[styles.methodBadge, { backgroundColor: getMealMethodColor(meal.method) }]}>
                        <Text style={styles.methodIcon}>{getMealMethodIcon(meal.method)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.caloriesSection}>
                  <Text style={styles.caloriesText}>{meal.calories || 0}</Text>
                  <Text style={styles.caloriesLabel}>cal</Text>
                </View>
              </View>
              
              {/* Nutrition breakdown */}
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.carbs || 0}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.protein || 0}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.fat || 0}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </SwipeToDeleteWrapper>
        ))}
      </View>
      
      {/* Minimalistic Delete Modal */}
      <MinimalisticDeleteModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setMealToDelete(null);
        }}
        onConfirm={confirmDeleteMeal}
        title="Delete Meal"
        message="Remove this meal from your log?"
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
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fonts.medium,
    color: '#8E8E93',
  },
  mealsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mealItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  mealName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  caloriesSection: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  caloriesLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginHorizontal: spacing.md,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fonts.small,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default TodaysMealsSection;
