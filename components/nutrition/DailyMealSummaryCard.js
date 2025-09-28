import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts } from '../utils/responsive';

const DailyMealSummaryCard = ({ date, totalCalories, mealCount, meals, onPress, getMealMethodIcon, getMealMethodColor }) => {
  const [expanded, setExpanded] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
    if (onPress) onPress(date, !expanded);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Calculate total nutrition
  const totalCarbs = meals ? meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) : 0;
  const totalProtein = meals ? meals.reduce((sum, meal) => sum + (meal.protein || 0), 0) : 0;
  const totalFat = meals ? meals.reduce((sum, meal) => sum + (meal.fat || 0), 0) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.leftSection}>
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <Text style={styles.mealCountText}>
              {mealCount} meal{mealCount !== 1 ? 's' : ''} • {totalCalories} calories
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Animated.View style={[styles.chevron, { transform: [{ rotate: rotateInterpolate }] }]}>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.summaryRow}>
            <View style={styles.nutritionSummary}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalCarbs)}g</Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalProtein)}g</Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(totalFat)}g</Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.mealsList}>
            {meals && meals.length > 0 ? meals.map((meal, index) => (
              <View key={meal.id || index} style={styles.mealItem}>
                {getMealMethodIcon && getMealMethodColor && (
                  <View style={[styles.mealMethodIcon, { backgroundColor: getMealMethodColor(meal.method) }]}>
                    <Ionicons name={getMealMethodIcon(meal.method)} size={12} color="#FFF" />
                  </View>
                )}
                <Text style={styles.mealName} numberOfLines={1}>
                  {meal.name}
                </Text>
                <Text style={styles.mealCalories}>
                  {meal.calories} cal
                </Text>
              </View>
            )) : (
              <Text style={styles.noMealsText}>No meals recorded</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  dateSection: {
    flex: 1,
  },
  dateText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  mealCountText: {
    fontSize: fonts.small,
    color: '#8E8E93',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FAFAFA',
  },
  summaryRow: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  nutritionLabel: {
    fontSize: fonts.tiny,
    color: '#8E8E93',
    marginTop: 1,
  },
  mealsList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  mealMethodIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  mealName: {
    flex: 1,
    fontSize: fonts.small,
    color: '#1D1D1F',
    marginRight: spacing.sm,
  },
  mealCalories: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontWeight: '500',
  },
  noMealsText: {
    fontSize: fonts.small,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});

export default DailyMealSummaryCard;
