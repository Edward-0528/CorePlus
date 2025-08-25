import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const MealHistorySection = ({ historicalMeals, historyLoading }) => {
  const [expandedCards, setExpandedCards] = useState({});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const processedSummaries = useMemo(() => {
    if (!historicalMeals || typeof historicalMeals !== 'object') {
      return [];
    }

    const summaries = Object.keys(historicalMeals)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => {
        const meals = historicalMeals[date];
        if (!Array.isArray(meals)) return null;

        const processedMeals = meals.map(meal => ({
          id: meal.id,
          name: meal.meal_name,
          time: meal.meal_time,
          date: meal.meal_date,
          calories: meal.calories || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          protein: meal.protein || 0,
        }));

        const totalCalories = processedMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const totalCarbs = processedMeals.reduce((sum, meal) => sum + meal.carbs, 0);
        const totalFat = processedMeals.reduce((sum, meal) => sum + meal.fat, 0);
        const totalProtein = processedMeals.reduce((sum, meal) => sum + meal.protein, 0);

        return {
          date,
          displayDate: formatDate(date),
          mealCount: processedMeals.length,
          totalCalories,
          totalCarbs,
          totalFat,
          totalProtein,
          meals: processedMeals,
        };
      })
      .filter(Boolean);

    return summaries;
  }, [historicalMeals]);

  const toggleCard = (date) => {
    setExpandedCards(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  if (historyLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading meal history...</Text>
      </View>
    );
  }

  if (!processedSummaries || processedSummaries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant" size={48} color="#8E8E93" />
        <Text style={styles.emptyTitle}>No Meal History</Text>
        <Text style={styles.emptySubtitle}>
          Your previous meals will appear here once you start logging food
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {processedSummaries.map((summary) => (
          <View key={summary.date} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleCard(summary.date)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.cardDate}>{summary.displayDate}</Text>
                <Text style={styles.cardSubtitle}>
                  {summary.mealCount} meal{summary.mealCount !== 1 ? 's' : ''} • {summary.totalCalories} calories
                </Text>
              </View>
              <Ionicons 
                name={expandedCards[summary.date] ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#8E8E93" 
              />
            </TouchableOpacity>

            {expandedCards[summary.date] && (
              <View style={styles.expandedContent}>
                <View style={styles.nutritionSummary}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{summary.totalCalories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(summary.totalCarbs)}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(summary.totalFat)}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{Math.round(summary.totalProtein)}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                </View>

                <View style={styles.mealsList}>
                  {summary.meals.map((meal, index) => (
                    <View key={meal.id}>
                      <View style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <Text style={styles.mealTime}>{formatTime(meal.time)}</Text>
                        </View>
                        <View style={styles.mealNutritionRow}>
                          <View style={styles.mealNutritionItem}>
                            <Text style={styles.mealNutritionValue}>{meal.calories}</Text>
                            <Text style={styles.mealNutritionLabel}>Cal</Text>
                          </View>
                          <View style={styles.mealNutritionItem}>
                            <Text style={styles.mealNutritionValue}>{Math.round(meal.carbs)}g</Text>
                            <Text style={styles.mealNutritionLabel}>Carbs</Text>
                          </View>
                          <View style={styles.mealNutritionItem}>
                            <Text style={styles.mealNutritionValue}>{Math.round(meal.fat)}g</Text>
                            <Text style={styles.mealNutritionLabel}>Fat</Text>
                          </View>
                          <View style={styles.mealNutritionItem}>
                            <Text style={styles.mealNutritionValue}>{Math.round(meal.protein)}g</Text>
                            <Text style={styles.mealNutritionLabel}>Protein</Text>
                          </View>
                        </View>
                      </View>
                      {index < summary.meals.length - 1 && (
                        <View style={styles.mealDivider} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.medium,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fonts.title,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardDate: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  cardSubtitle: {
    fontSize: fonts.medium,
    color: '#8E8E93',
    marginTop: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    padding: spacing.lg,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  mealsList: {
    // Container for meals list
  },
  mealItem: {
    paddingVertical: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealName: {
    flex: 1,
    fontSize: fonts.medium,
    color: '#1D1D1F',
    fontWeight: '500',
    marginRight: spacing.md,
  },
  mealTime: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
  },
  mealNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  mealNutritionItem: {
    alignItems: 'center',
  },
  mealNutritionValue: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  mealNutritionLabel: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: 2,
  },
  mealDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: spacing.sm,
  },
});

export default MealHistorySection;