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
  const [healthScore, setHealthScore] = useState(0);

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
          console.log('📊 WeeklyProgressCard - Today calories:', calories, 'Goal:', calorieGoal, 'Percentage:', Math.round((calories / calorieGoal) * 100) + '%');
        } else {
          // Historical calories
          const totals = await getNutritionTotalsForDate(dateStr);
          calories = totals.calories;
        }
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        const isOnGoal = calories >= (calorieGoal * 0.85) && calories <= calorieGoal; // At or slightly under goal
        const isOverGoal = calories > calorieGoal; // Any amount over goal
        
        if (i === 0) {
          console.log('📊 WeeklyProgressCard - Today status: isOnGoal:', isOnGoal, 'isOverGoal:', isOverGoal);
        }
        
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
      
      // Calculate Health Score (0-100)
      const daysWithMeals = last7Days.filter(day => day.calories > 0).length;
      const daysOnGoal = last7Days.filter(day => day.isOnGoal).length;
      const daysUnderGoal = last7Days.filter(day => day.calories > 0 && day.calories < calorieGoal * 0.85).length;
      const daysOverGoal = last7Days.filter(day => day.isOverGoal).length;
      
      let score = 0;
      // Base score: tracking consistency (40 points max)
      score += (daysWithMeals / 7) * 40;
      
      // On-goal days (40 points max)
      score += (daysOnGoal / 7) * 40;
      
      // Penalty for being way over goal (up to -20 points)
      const severeOverGoalDays = last7Days.filter(day => day.calories > calorieGoal * 1.2).length;
      score -= (severeOverGoalDays / 7) * 20;
      
      // Bonus for consistency (20 points max)
      if (daysWithMeals >= 5) score += 10; // Tracking 5+ days
      if (streak >= 3) score += 10; // 3+ day streak
      
      // Ensure score is between 0-100
      score = Math.max(0, Math.min(100, Math.round(score)));
      setHealthScore(score);
      
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
    if (day.isOverGoal) {
      console.log('📊 WeeklyProgressCard - Bar color RED for day:', day.dayName, 'calories:', day.calories, 'isOverGoal:', day.isOverGoal);
      return AppColors.danger; // Red for over goal
    }
    console.log('📊 WeeklyProgressCard - Bar color GREEN for day:', day.dayName, 'calories:', day.calories, 'isOverGoal:', day.isOverGoal);
    return AppColors.success; // Green for under goal and on goal
  };

  const getBarHeight = (percentage) => {
    const minHeight = 16;
    const maxHeight = 100;
    // Cap the percentage at 1.0 (100%) so bars don't exceed maxHeight
    const cappedPercentage = Math.min(percentage, 1.0);
    return Math.max(minHeight, cappedPercentage * maxHeight);
  };

  const getHealthScoreColor = () => {
    if (healthScore >= 80) return '#34C759'; // Green - Excellent
    if (healthScore >= 60) return '#FFB800'; // Yellow - Good
    if (healthScore >= 40) return '#FF9500'; // Orange - Fair
    return '#FF3B30'; // Red - Needs improvement
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
      {/* Header with Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Progress</Text>
        <View style={[styles.healthScoreBadge, { backgroundColor: getHealthScoreColor() }]}>
          <Text style={styles.healthScoreValue}>{healthScore}</Text>
        </View>
      </View>
      
      {/* Chart */}
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
      
      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{avgCalories}</Text>
          <Text style={styles.statLabel}>avg kcal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{onGoalStreak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{weeklyData.filter(d => d.calories > 0).length}/7</Text>
          <Text style={styles.statLabel}>tracked</Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.success }]} />
          <Text style={styles.legendText}>On target</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.danger }]} />
          <Text style={styles.legendText}>Over goal</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  healthScoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  healthScoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chartContainer: {
    marginBottom: 24,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 10,
    minHeight: 16,
  },
  dayLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
});

export default WeeklyProgressCard;
