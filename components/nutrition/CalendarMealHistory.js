import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealManager } from '../../hooks/useMealManager';
import { useDailyCalories } from '../../contexts/DailyCaloriesContext';
import { getLocalDateString, getLocalDateStringFromDate } from '../../utils/dateUtils';
import DayDetailModal from './DayDetailModal';
import { AppColors } from '../../constants/AppColors';

const CalendarMealHistory = ({ calorieGoal = 2000 }) => {
  const { getNutritionTotalsForDate } = useMealManager();
  const { dailyCalories } = useDailyCalories();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [monthStats, setMonthStats] = useState({
    onTargetDays: 0,
    totalDays: 0,
    averageCalories: 0,
    bestStreak: 0
  });

  useEffect(() => {
    loadMonthData();
  }, [currentDate, dailyCalories]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const today = getLocalDateString();
      
      console.log('📅 [Calendar] Loading month data:', {
        year,
        month: month + 1, // month is 0-indexed
        monthName: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        today
      });
      
      // Get all days in the month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthData = {};
      let totalCalories = 0;
      let daysWithData = 0;
      let onTargetCount = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let streakActive = true;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = getLocalDateStringFromDate(date);
        
        let calories = 0;
        let totalsData = { calories: 0, mealCount: 0 };
        
        if (dateStr === today) {
          // Today's calories from context
          calories = dailyCalories;
        } else if (date <= new Date()) {
          // Historical data for past days only
          totalsData = await getNutritionTotalsForDate(dateStr);
          calories = totalsData.calories;
          
          // Debug logging for the specific date you mentioned (reduce logging for performance)
          if (dateStr === '2025-09-27') {
            console.log('📅 [Calendar Debug] Found data for 2025-09-27:', {
              dateStr,
              calories,
              mealCount: totalsData.mealCount
            });
          }
        }

        // Consider data to exist if we have calories OR if we have meal count
        const hasData = calories > 0 || totalsData.mealCount > 0 || dateStr === today;
        const isOnTarget = hasData && calories >= (calorieGoal * 0.85) && calories <= (calorieGoal * 1.15);
        const isOverGoal = hasData && calories > (calorieGoal * 1.15);
        const isUnderGoal = hasData && calories < (calorieGoal * 1.15) && calories > 0; // Under goal = green

        monthData[day] = {
          date: dateStr,
          calories,
          hasData,
          isOnTarget,
          isOverGoal,
          isUnderGoal,
          isToday: dateStr === today,
          isFuture: date > new Date(),
          mealCount: totalsData.mealCount || 0
        };

        // Debug logging for all days with data (reduce for performance)
        if (hasData && calories > 0 && dateStr === '2025-09-27') {
          console.log('📅 [Calendar] September 27 data:', {
            day,
            dateStr,
            calories,
            isOnTarget,
            isOverGoal,
            isUnderGoal
          });
        }

        if (hasData) {
          totalCalories += calories;
          daysWithData++;
          
          if (isOnTarget) {
            onTargetCount++;
            if (streakActive) currentStreak++;
          } else {
            if (streakActive) {
              bestStreak = Math.max(bestStreak, currentStreak);
              currentStreak = 0;
              streakActive = false;
            }
          }
        }
      }

      // Final streak check
      bestStreak = Math.max(bestStreak, currentStreak);

      setCalendarData(monthData);
      setMonthStats({
        onTargetDays: onTargetCount,
        totalDays: daysWithData,
        averageCalories: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
        bestStreak: bestStreak
      });

    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDayPress = async (day) => {
    const dayData = calendarData[day];
    console.log('📅 [Calendar] Day pressed:', {
      day,
      dayData,
      hasData: dayData?.hasData,
      calories: dayData?.calories
    });
    
    if (dayData && (dayData.hasData || dayData.calories > 0)) {
      // Pre-load meal data to make modal faster
      try {
        await getNutritionTotalsForDate(dayData.date);
      } catch (error) {
        console.log('📅 [Calendar] Pre-load failed, continuing anyway:', error);
      }
      
      setSelectedDay(dayData);
      setShowDayDetail(true);
    } else {
      console.log('📅 [Calendar] Day not clickable - no data');
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
        <Ionicons name="chevron-back" size={24} color={AppColors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.monthTitle}>
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      
      <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
        <Ionicons name="chevron-forward" size={24} color={AppColors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {monthStats.onTargetDays}/{monthStats.totalDays}
        </Text>
        <Text style={styles.statLabel}>On Target</Text>
      </View>
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {monthStats.totalDays > 0 ? Math.round((monthStats.onTargetDays / monthStats.totalDays) * 100) : 0}%
        </Text>
        <Text style={styles.statLabel}>Success Rate</Text>
      </View>
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{monthStats.averageCalories}</Text>
        <Text style={styles.statLabel}>Avg Calories</Text>
      </View>
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{monthStats.bestStreak}</Text>
        <Text style={styles.statLabel}>Best Streak</Text>
      </View>
    </View>
  );

  const renderWeekDays = () => (
    <View style={styles.weekDaysHeader}>
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
        <Text key={index} style={styles.weekDayText}>{day}</Text>
      ))}
    </View>
  );

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = calendarData[day];
      const isClickable = dayData?.hasData || (dayData && dayData.calories >= 0);
      
      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, getDayStyle(dayData)]}
          onPress={() => handleDayPress(day)}
          disabled={!isClickable}
        >
          <Text style={[styles.dayNumber, getDayTextStyle(dayData)]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return <View style={styles.calendarGrid}>{calendarDays}</View>;
  };

  const getDayStyle = (dayData) => {
    if (!dayData) return styles.noDataDay;
    
    // Debug logging for September 27th only (reduce for performance)
    if (dayData.date === '2025-09-27') {
      console.log('📅 [Calendar Style] September 27th styling:', {
        hasData: dayData.hasData,
        calories: dayData.calories,
        isOnTarget: dayData.isOnTarget,
        isOverGoal: dayData.isOverGoal,
        isUnderGoal: dayData.isUnderGoal
      });
    }
    
    if (dayData.isToday) {
      return styles.todayDay;
    } else if (dayData.isFuture) {
      return styles.futureDay;
    } else if (!dayData.hasData) {
      return styles.noDataDay;
    } else if (dayData.isOnTarget) {
      return styles.onTargetDay;
    } else if (dayData.isOverGoal) {
      return styles.overGoalDay;
    } else if (dayData.isUnderGoal) {
      return styles.underGoalDay; // This will be green
    }
    
    // Default for days with data but not categorized
    return styles.underGoalDay; // Default to green for any data
  };

  const getDayTextStyle = (dayData) => {
    if (!dayData) return {};
    
    if (dayData.isToday) {
      return styles.todayText;
    } else if (dayData.isFuture || !dayData.hasData) {
      return styles.inactiveText;
    } else {
      return styles.activeText;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCalendarHeader()}
      {renderStatsHeader()}
      {renderWeekDays()}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderCalendarGrid()}
        
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.legendText}>On Target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.legendText}>Over Goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.legendText}>Under Goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <DayDetailModal
        visible={showDayDetail}
        onClose={() => setShowDayDetail(false)}
        dayData={selectedDay}
        calorieGoal={calorieGoal}
      />
    </View>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    position: 'relative',
  },
  todayDay: {
    backgroundColor: AppColors.primary,
  },
  onTargetDay: {
    backgroundColor: AppColors.successLight,
    borderWidth: 2,
    borderColor: AppColors.success,
  },
  overGoalDay: {
    backgroundColor: AppColors.dangerLight,
    borderWidth: 2,
    borderColor: AppColors.danger,
  },
  underGoalDay: {
    backgroundColor: AppColors.successLight,
    borderWidth: 2,
    borderColor: AppColors.success,
  },
  noDataDay: {
    backgroundColor: AppColors.backgroundSecondary,
  },
  futureDay: {
    backgroundColor: AppColors.backgroundSecondary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayText: {
    color: AppColors.white,
  },
  activeText: {
    color: AppColors.textPrimary,
  },
  inactiveText: {
    color: AppColors.textLight,
  },
  legend: {
    margin: 20,
    padding: 16,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});

export default CalendarMealHistory;
