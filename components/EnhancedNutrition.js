import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TodayNutritionView from './nutrition/TodayNutritionView';
import CalendarMealHistory from './nutrition/CalendarMealHistory';
import FoodSearchModal from './food/FoodSearchModal';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { AppColors } from '../constants/AppColors';
import { supabase } from '../supabaseConfig';

const EnhancedNutrition = ({ user, onLogout, loading, styles }) => {
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const { dailyCalories } = useDailyCalories();
  const calorieGoal = user?.calorie_goal || 2000; // Get from user settings

  // Calculate today's health score
  useEffect(() => {
    const calculateHealthScore = async () => {
      if (!user?.id) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's meals
        const { data: meals, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        if (error) throw error;

        // Calculate score components
        let score = 0;
        const hasTracking = meals && meals.length > 0;
        
        if (hasTracking) {
          score += 40; // Base score for tracking
          
          // Calorie adherence (40 points max)
          const caloriePercent = dailyCalories / calorieGoal;
          if (caloriePercent >= 0.9 && caloriePercent <= 1.1) {
            score += 40; // Within 10% of goal
          } else if (caloriePercent >= 0.8 && caloriePercent <= 1.2) {
            score += 30; // Within 20% of goal
          } else if (caloriePercent >= 0.7 && caloriePercent <= 1.3) {
            score += 20; // Within 30% of goal
          } else {
            score += 10; // More than 30% off
          }
          
          // Meal frequency bonus (20 points max)
          const mealCount = meals.length;
          if (mealCount >= 3) {
            score += 20; // 3+ meals
          } else if (mealCount === 2) {
            score += 15; // 2 meals
          } else if (mealCount === 1) {
            score += 10; // 1 meal
          }
        }

        setHealthScore(Math.min(100, score));
      } catch (error) {
        console.error('Error calculating health score:', error);
      }
    };

    calculateHealthScore();
  }, [user?.id, dailyCalories, calorieGoal]);

  // Handler to open food search modal
  const handleOpenFoodSearch = () => {
    setShowFoodSearchModal(true);
  };

  const tabs = [
    {
      id: 'today',
      title: 'Today',
      icon: 'today-outline',
      component: TodayNutritionView
    },
    {
      id: 'history',
      title: 'Journal',
      icon: 'calendar-outline',
      component: CalendarMealHistory
    }
  ];

  const renderHealthScoreCard = () => {
    const remaining = calorieGoal - dailyCalories;
    const isOverGoal = dailyCalories > calorieGoal;
    
    // Color based on score
    let scoreColor = AppColors.success;
    if (healthScore < 40) scoreColor = AppColors.error;
    else if (healthScore < 60) scoreColor = '#FF9500';
    else if (healthScore < 80) scoreColor = '#FFD700';

    return (
      <View style={enhancedStyles.healthScoreCard}>
        <View style={enhancedStyles.healthScoreHeader}>
          <View>
            <Text style={enhancedStyles.healthScoreLabel}>Today's Health Score</Text>
            <View style={enhancedStyles.calorieRow}>
              <Text style={enhancedStyles.caloriesConsumed}>{dailyCalories}</Text>
              <Text style={enhancedStyles.caloriesSeparator}> / </Text>
              <Text style={enhancedStyles.caloriesGoal}>{calorieGoal} cal</Text>
            </View>
            {remaining !== 0 && (
              <Text style={[
                enhancedStyles.remainingText,
                { color: isOverGoal ? AppColors.error : AppColors.success }
              ]}>
                {isOverGoal ? `${Math.abs(remaining)} cal over` : `${remaining} cal remaining`}
              </Text>
            )}
          </View>
          <View style={[enhancedStyles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={enhancedStyles.scoreValue}>{healthScore}</Text>
            <Text style={enhancedStyles.scoreMax}>/100</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={enhancedStyles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            enhancedStyles.tab,
            activeTab === tab.id && enhancedStyles.activeTab
          ]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons
            name={tab.icon}
            size={20}
            color={activeTab === tab.id ? AppColors.primary : AppColors.textSecondary}
            style={enhancedStyles.tabIcon}
          />
          <Text style={[
            enhancedStyles.tabText,
            activeTab === tab.id && enhancedStyles.activeTabText
          ]}>
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    const Component = activeTabData?.component;

    if (!Component) return null;

    if (activeTab === 'today') {
      return (
        <Component
          user={user}
          calorieGoal={calorieGoal}
          onOpenFoodSearch={handleOpenFoodSearch}
        />
      );
    } else if (activeTab === 'history') {
      return (
        <Component
          calorieGoal={calorieGoal}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={enhancedStyles.container}>
      {renderHealthScoreCard()}
      
      {renderTabBar()}
      
      <View style={enhancedStyles.content}>
        {renderContent()}
      </View>

      {/* Food Search Modal */}
      {showFoodSearchModal && (
        <FoodSearchModal
          visible={showFoodSearchModal}
          onClose={() => setShowFoodSearchModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  healthScoreCard: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  caloriesConsumed: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  caloriesSeparator: {
    fontSize: 20,
    color: AppColors.textSecondary,
  },
  caloriesGoal: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBadge: {
    minWidth: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  activeTabText: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default EnhancedNutrition;
