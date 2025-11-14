import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import TodaysMealsComponent from './TodaysMealsComponent';
import { AppColors } from '../../constants/AppColors';

const TodayNutritionView = ({ user, calorieGoal = 2000, onOpenFoodSearch }) => {
  const { 
    dailyCalories, 
    dailyMacros, 
    dailyMicros,
    todaysMeals, 
    mealsLoading,
    refreshMealsFromServer 
  } = useDailyCalories();
  
  const [refreshing, setRefreshing] = useState(false);
  const [macroExpanded, setMacroExpanded] = useState(false);

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
    <View style={[styles.section, { marginTop: 20 }]}>
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

  const renderMacroProgress = () => {
    const microGoals = {
      fiber: user?.fiber_goal || 25,
      sugar: user?.sugar_goal || 50,
      sodium: user?.sodium_goal || 2300
    };

    const microUnits = {
      fiber: 'g',
      sugar: 'g', 
      sodium: 'mg'
    };

    return (
      <View style={[styles.section, { marginTop: 20 }]}>
        <TouchableOpacity 
          style={[styles.macroCard, macroExpanded && styles.macroCardExpanded]}
          onPress={() => setMacroExpanded(!macroExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.expandableHeader}>
            <Text style={styles.sectionTitle}>Macronutrients</Text>
            <Ionicons 
              name={macroExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={AppColors.textSecondary} 
            />
          </View>
        
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
          
          {macroExpanded && (
            <>
              <Text style={styles.microTitle}>Micronutrients</Text>
              {Object.entries(microGoals).map(([micro, goal]) => {
                const current = dailyMicros[micro] || 0;
                const progress = calculateProgress(current, goal);
                const unit = microUnits[micro];
                
                return (
                  <View key={micro} style={styles.macroItem}>
                    <View style={styles.macroHeader}>
                      <Text style={styles.macroLabel}>
                        {micro.charAt(0).toUpperCase() + micro.slice(1)}
                      </Text>
                      <Text style={styles.macroValue}>
                        {micro === 'sodium' ? Math.round(current) : Math.round(current * 10) / 10}{unit} / {goal}{unit}
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
            </>
          )}
          </View>
        </TouchableOpacity>
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
      {renderMacroProgress()}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <TodaysMealsComponent 
          showViewAll={false}
          maxMealsToShow={null}
          onEmptyStatePress={onOpenFoodSearch}
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
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  macroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  microTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
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
    // Container styling removed since it's now inside macroCard
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
});

export default TodayNutritionView;
