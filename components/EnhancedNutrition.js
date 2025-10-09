import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TodayNutritionView from './nutrition/TodayNutritionView';
import CalendarMealHistory from './nutrition/CalendarMealHistory';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';

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

const EnhancedNutrition = ({ user, onLogout, loading, styles }) => {
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'
  const { dailyCalories } = useDailyCalories();
  const calorieGoal = user?.calorie_goal || 2000; // Get from user settings

  const tabs = [
    {
      id: 'today',
      title: 'Today',
      icon: 'today',
      component: TodayNutritionView
    },
    {
      id: 'history',
      title: 'History',
      icon: 'calendar',
      component: CalendarMealHistory
    }
  ];

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
      <View style={enhancedStyles.header}>
        <Text style={enhancedStyles.headerTitle}>Nutrition</Text>
        <View style={enhancedStyles.headerStats}>
          <Text style={enhancedStyles.headerCalories}>
            {dailyCalories} / {calorieGoal} cal
          </Text>
          <View style={enhancedStyles.progressIndicator}>
            <View style={[
              enhancedStyles.progressFill,
              { width: `${Math.min((dailyCalories / calorieGoal) * 100, 100)}%` }
            ]} />
          </View>
        </View>
      </View>
      
      {renderTabBar()}
      
      <View style={enhancedStyles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  progressIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 2,
    marginLeft: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 2,
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
