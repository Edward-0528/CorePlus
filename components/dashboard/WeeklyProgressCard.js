import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import { useMealManager } from '../../hooks/useMealManager';
import { getLocalDateString, getLocalDateStringFromDate } from '../../utils/dateUtils';
import { AppColors } from '../../constants/AppColors';

const WeeklyProgressCard = ({ onPress, calorieGoal = 2000 }) => {
  const { dailyCalories } = useDailyCalories();
  const { getNutritionTotalsForDate } = useMealManager();
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgCalories, setAvgCalories] = useState(0);
  const [onGoalStreak, setOnGoalStreak] = useState(0);

  // Get last 7 days of data
  useEffect(() => {
    loadWeeklyData();
  }, [dailyCalories]);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateStringFromDate(date);
        
        let calories = 0;
        if (i === 0) {
          // Today's calories from context
          calories = dailyCalories;
        } else {
          // Historical calories
          const totals = await getNutritionTotalsForDate(dateStr);
          calories = totals.calories;
        }
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        const isOnGoal = calories >= (calorieGoal * 0.85) && calories <= (calorieGoal * 1.15); // 15% tolerance
        const isOverGoal = calories > (calorieGoal * 1.15);
        
        last7Days.push({
          date: dateStr,
          dayName,
          calories,
          isOnGoal,
          isOverGoal,
          percentage: Math.min(calories / calorieGoal, 1.5) // Cap at 150% for visual purposes
        });
      }
      
      setWeeklyData(last7Days);
      
      // Calculate average calories
      const totalCalories = last7Days.reduce((sum, day) => sum + day.calories, 0);
      setAvgCalories(Math.round(totalCalories / 7));
      
      // Calculate current streak (consecutive days on goal from today backwards)
      let streak = 0;
      for (let i = last7Days.length - 1; i >= 0; i--) {
        if (last7Days[i].isOnGoal) {
          streak++;
        } else {
          break;
        }
      }
      setOnGoalStreak(streak);
      
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayNames = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
    });
  };

  const getBarColor = (day) => {
    if (day.calories === 0) return AppColors.border;
    if (day.isOverGoal) return AppColors.amber;
    if (day.isOnGoal) return AppColors.success;
    return AppColors.primary; // Under goal
  };

  const getBarHeight = (percentage) => {
    const minHeight = 12;
    const maxHeight = 60;
    return Math.max(minHeight, percentage * maxHeight);
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading weekly data...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>Last 7 days</Text>
        <Text style={styles.subtitle}>
          Under-goal days in primary, over-goal in amber
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.barColumn}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: getBarHeight(day.percentage),
                    backgroundColor: getBarColor(day)
                  }
                ]} 
              />
              <Text style={styles.dayLabel}>{day.dayName}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg kcal</Text>
          <Text style={styles.statValue}>{avgCalories}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>On-goal streak</Text>
          <Text style={styles.statValue}>{onGoalStreak} day{onGoalStreak !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  chartContainer: {
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
});

export default WeeklyProgressCard;
