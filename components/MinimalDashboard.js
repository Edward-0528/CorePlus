import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/AppColors';
import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';

// Minimal Components
import MinimalComponents from './design/MinimalComponentsFixed';
const { 
  MinimalCard,
  MinimalMetric,
  MinimalButton,
  MinimalSection,
  MinimalStats,
  MinimalProgress,
  MinimalAction
} = MinimalComponents;

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const MinimalDashboard = ({ user, onLogout, loading, styles }) => {
  const { dailyCalories, addCalories, foodEntries } = useDailyCalories();
  const { isPremium } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  
  // Mock data for metrics
  const todayStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: AppColors.nutrition },
    { value: '45', label: 'Protein', color: AppColors.primary },
    { value: '8.2k', label: 'Steps', color: AppColors.workout },
    { value: '7.5h', label: 'Sleep', color: AppColors.account },
  ];

  const quickActions = [
    { icon: 'restaurant-outline', title: 'Log Meal', color: AppColors.nutrition },
    { icon: 'fitness-outline', title: 'Workout', color: AppColors.workout },
    { icon: 'water-outline', title: 'Water', color: AppColors.primary },
    { icon: 'moon-outline', title: 'Sleep', color: AppColors.account },
  ];

  const recentMeals = foodEntries.slice(0, 3).map(entry => ({
    name: entry.description || 'Food Item',
    calories: entry.calories || 0,
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calorieGoal = 2000;
  const calorieProgress = (dailyCalories / calorieGoal) * 100;

  const renderMinimalHeader = () => (
    <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
      <View row centerV spread marginB-lg>
        <View>
          <Text h4 color={Colors.textPrimary}>
            Good morning, {user?.user_metadata?.first_name || 'User'}
          </Text>
          <Text body2 color={Colors.textSecondary}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Thin line separator */}
      <View style={{ height: 1, backgroundColor: Colors.border, width: '100%' }} />
    </View>
  );

  const renderCalorieProgress = () => (
    <View paddingH-20>
      <MinimalSection title="Daily Calories" action="Set Goal" />
      <MinimalCard style={{ marginTop: 8 }}>
        <View row centerV spread marginB-sm>
          <Text h5 color={Colors.textPrimary}>{dailyCalories}</Text>
          <Text body2 color={Colors.textSecondary}>/ {calorieGoal} cal</Text>
        </View>
        <MinimalProgress progress={calorieProgress} color={Colors.nutrition} height={3} />
        <Text caption color={Colors.textSecondary} marginT-sm>
          {calorieGoal - dailyCalories} calories remaining
        </Text>
      </MinimalCard>
    </View>
  );

  const renderTodayStats = () => (
    <View paddingH-20>
      <MinimalStats stats={todayStats} />
    </View>
  );

  const renderQuickActions = () => (
    <View paddingH-20>
      <MinimalSection title="Quick Actions" />
      <View row spread marginT-sm>
        {quickActions.map((action, index) => (
          <MinimalAction
            key={index}
            icon={action.icon}
            title={action.title}
            color={action.color}
            onPress={() => console.log(`Pressed ${action.title}`)}
          />
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View paddingH-20>
      <MinimalSection title="Recent Meals" action="View All" />
      <MinimalCard style={{ marginTop: 8 }}>
        {recentMeals.length > 0 ? (
          recentMeals.map((meal, index) => (
            <MinimalMetric
              key={index}
              icon="restaurant-outline"
              title={`${meal.name} • ${meal.time}`}
              value={meal.calories}
              unit="cal"
              color={Colors.nutrition}
            />
          ))
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Ionicons name="restaurant-outline" size={32} color={Colors.border} />
            <Text body2 color={Colors.textSecondary} marginT-sm>No meals logged today</Text>
            <MinimalButton
              title="Log your first meal"
              color={Colors.nutrition}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </MinimalCard>
    </View>
  );

  const renderWorkoutSummary = () => (
    <View paddingH-20>
      <MinimalSection title="Today's Activity" />
      <MinimalCard style={{ marginTop: 8 }}>
        <MinimalMetric
          icon="fitness-outline"
          title="Workout Duration"
          value="45"
          unit="min"
          color={Colors.workout}
        />
        <MinimalMetric
          icon="flame-outline"
          title="Calories Burned"
          value="320"
          unit="cal"
          color={Colors.workout}
        />
        <MinimalMetric
          icon="footsteps-outline"
          title="Steps Today"
          value="8,247"
          color={Colors.primary}
        />
      </MinimalCard>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundSecondary }}>
      {renderMinimalHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {renderCalorieProgress()}
        
        <View marginT-lg>
          {renderTodayStats()}
        </View>
        
        <View marginT-lg>
          {renderQuickActions()}
        </View>
        
        <View marginT-lg>
          {renderRecentActivity()}
        </View>
        
        <View marginT-lg>
          {renderWorkoutSummary()}
        </View>
        
        {/* Bottom spacing */}
        <View height={100} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalDashboard;
