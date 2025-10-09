import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import TodaysMealsComponent from './TodaysMealsComponent';

const AppColors = {
  primary: '#6B8E23',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
};

const TodayNutritionView = ({ user, calorieGoal = 2000 }) => {
  const { 
    dailyCalories, 
    dailyMacros, 
    todaysMeals, 
    mealsLoading,
    refreshMealsFromServer 
  } = useDailyCalories();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMealsFromServer();
    } catch (error) {
      console.error('Error refreshing meals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const nutritionGoals = {
    protein: user?.protein_goal || 150,
    carbs: user?.carbs_goal || 225,
    fat: user?.fat_goal || 65,
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const renderCalorieProgress = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Daily Progress</Text>
      <View style={styles.calorieCard}>
        <View style={styles.calorieHeader}>
          <Text style={styles.calorieNumber}>{dailyCalories}</Text>
          <Text style={styles.calorieUnit}>/ {calorieGoal} calories</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${Math.min((dailyCalories / calorieGoal) * 100, 100)}%` }
          ]} />
        </View>
        <Text style={styles.remainingText}>
          {Math.max(0, calorieGoal - dailyCalories)} calories remaining
        </Text>
      </View>
    </View>
  );

  const renderMacroProgress = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Macronutrients</Text>
      <View style={styles.macroContainer}>
        {Object.entries(nutritionGoals).map(([macro, goal]) => {
          const current = dailyMacros[macro] || 0;
          const progress = calculateProgress(current, goal);
          
          return (
            <View key={macro} style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>
                  {macro.charAt(0).toUpperCase() + macro.slice(1)}
                </Text>
                <Text style={styles.macroValue}>
                  {Math.round(current)}g / {goal}g
                </Text>
              </View>
              <View style={styles.macroProgressBar}>
                <View style={[
                  styles.macroProgressFill,
                  { 
                    width: `${progress}%`,
                    backgroundColor: progress >= 80 ? AppColors.success : AppColors.primary
                  }
                ]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderQuickStats = () => {
    const mealCount = todaysMeals.length;
    const avgCaloriesPerMeal = mealCount > 0 ? Math.round(dailyCalories / mealCount) : 0;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="restaurant" size={24} color={AppColors.primary} />
            <Text style={styles.statNumber}>{mealCount}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={24} color={AppColors.success} />
            <Text style={styles.statNumber}>{avgCaloriesPerMeal}</Text>
            <Text style={styles.statLabel}>Avg/Meal</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={
              dailyCalories >= calorieGoal * 0.8 && dailyCalories <= calorieGoal * 1.2 
                ? AppColors.success : AppColors.warning
            } />
            <Text style={styles.statNumber}>
              {Math.round((dailyCalories / calorieGoal) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        </View>
      </View>
    );
  };

  if (mealsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading today's nutrition...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[AppColors.primary]}
          tintColor={AppColors.primary}
        />
      }
    >
      {renderCalorieProgress()}
      {renderMacroProgress()}
      {renderQuickStats()}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <TodaysMealsComponent 
          showViewAll={false}
          maxMealsToShow={null}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundSecondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  calorieCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  calorieUnit: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginLeft: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  macroContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
  },
  macroItem: {
    marginBottom: 20,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  macroValue: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  macroProgressBar: {
    height: 6,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});

export default TodayNutritionView;
