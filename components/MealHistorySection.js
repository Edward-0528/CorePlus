import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { spacing, fonts } from '../utils/responsive';
import DailyMealSummaryCard from './DailyMealSummaryCard';

const MealHistorySection = ({ mealManager, getMealMethodIcon, getMealMethodColor }) => {
  const [historyDates, setHistoryDates] = useState([]);
  const [dailySummaries, setDailySummaries] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Generate the last 7 days (excluding today)
  const generateHistoryDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }, []);

  // Load meal history for the past week
  const loadMealHistory = useCallback(async () => {
    if (!mealManager) return;
    
    setIsLoading(true);
    try {
      const dates = generateHistoryDates();
      setHistoryDates(dates);
      
      // Load meal history for all dates
      await mealManager.loadMealHistory(dates);
      
      // Generate daily summaries
      const summaries = {};
      for (const date of dates) {
        const meals = await mealManager.getMealsForDate(date);
        const nutrition = await mealManager.getNutritionTotalsForDate(date);
        
        if (meals && meals.length > 0) {
          summaries[date] = {
            date,
            meals,
            totalCalories: nutrition.calories,
            mealCount: nutrition.mealCount,
            totalCarbs: nutrition.carbs,
            totalProtein: nutrition.protein,
            totalFat: nutrition.fat,
          };
        }
      }
      
      setDailySummaries(summaries);
    } catch (error) {
      console.error('Error loading meal history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mealManager, generateHistoryDates]);

  // Load history when component mounts or mealManager changes
  useEffect(() => {
    loadMealHistory();
  }, [loadMealHistory]);

  const handleCardPress = useCallback((date, expanded) => {
    console.log(`📋 ${expanded ? 'Expanded' : 'Collapsed'} meal history for ${date}`);
  }, []);

  // Filter out dates with no meals and sort by date (most recent first)
  const datesWithMeals = historyDates.filter(date => dailySummaries[date]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading meal history...</Text>
      </View>
    );
  }

  if (datesWithMeals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No meal history yet</Text>
        <Text style={styles.emptySubtitle}>
          Your previous meals will appear here as you continue logging
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
        {datesWithMeals.map((date) => {
          const summary = dailySummaries[date];
          return (
            <DailyMealSummaryCard
              key={date}
              date={date}
              totalCalories={summary.totalCalories}
              mealCount={summary.mealCount}
              meals={summary.meals}
              onPress={handleCardPress}
              getMealMethodIcon={getMealMethodIcon}
              getMealMethodColor={getMealMethodColor}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.large,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  historyList: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    marginTop: spacing.sm,
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

export default MealHistorySection;
