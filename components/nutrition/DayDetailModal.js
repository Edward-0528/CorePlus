import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealManager } from '../../hooks/useMealManager';

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
  successLight: '#D4EDDA',
  dangerLight: '#F8D7DA',
  warningLight: '#FFF3CD',
};

const DayDetailModal = ({ visible, onClose, dayData, calorieGoal = 2000 }) => {
  const { getMealsForDate } = useMealManager();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0
  });

  useEffect(() => {
    if (visible && dayData) {
      loadDayDetails();
    }
  }, [visible, dayData]);

  const loadDayDetails = async () => {
    if (!dayData?.date) return;
    
    setLoading(true);
    try {
      const dayMeals = await getMealsForDate(dayData.date);
      setMeals(dayMeals);
      
      // Calculate nutrition totals
      const totals = dayMeals.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        protein: acc.protein + (meal.protein || 0),
        fat: acc.fat + (meal.fat || 0)
      }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
      
      setNutrition(totals);
    } catch (error) {
      console.error('Error loading day details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealsByType = () => {
    const mealTypes = {
      breakfast: meals.filter(meal => meal.meal_type === 'breakfast'),
      lunch: meals.filter(meal => meal.meal_type === 'lunch'),
      dinner: meals.filter(meal => meal.meal_type === 'dinner'),
      snack: meals.filter(meal => meal.meal_type === 'snack' || !meal.meal_type)
    };
    return mealTypes;
  };

  const getProgressColor = () => {
    if (!dayData) return AppColors.textLight;
    
    if (dayData.isOnTarget) return AppColors.success;
    if (dayData.isOverGoal) return AppColors.danger;
    if (dayData.isUnderGoal) return AppColors.warning;
    return AppColors.textLight;
  };

  const getStatusText = () => {
    if (!dayData) return 'No data';
    
    if (dayData.isOnTarget) return 'On Target';
    if (dayData.isOverGoal) return 'Over Goal';
    if (dayData.isUnderGoal) return 'Under Goal';
    return 'No data';
  };

  const renderProgressBar = () => {
    const progress = Math.min((nutrition.calories / calorieGoal) * 100, 150); // Cap at 150%
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {nutrition.calories} / {calorieGoal} calories
        </Text>
      </View>
    );
  };

  const renderMealSection = (mealType, mealList) => {
    if (mealList.length === 0) return null;

    const mealIcons = {
      breakfast: 'sunny',
      lunch: 'restaurant',
      dinner: 'moon',
      snack: 'cafe'
    };

    const totalCalories = mealList.reduce((sum, meal) => sum + (meal.calories || 0), 0);

    return (
      <View style={styles.mealSection} key={mealType}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Ionicons 
              name={mealIcons[mealType]} 
              size={20} 
              color={AppColors.primary} 
              style={styles.mealIcon}
            />
            <Text style={styles.mealTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </View>
          <Text style={styles.mealCalories}>{Math.round(totalCalories)} cal</Text>
        </View>
        
        {mealList.map((meal, index) => (
          <View key={index} style={styles.mealItem}>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName} numberOfLines={1}>
                {meal.food_name || meal.name}
              </Text>
              <Text style={styles.mealDetails}>
                {meal.serving_qty} {meal.serving_unit}
              </Text>
            </View>
            <Text style={styles.mealItemCalories}>
              {Math.round(meal.calories || 0)} cal
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderNutritionSummary = () => (
    <View style={styles.nutritionContainer}>
      <Text style={styles.sectionTitle}>Nutrition Summary</Text>
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(nutrition.carbs)}g</Text>
          <Text style={styles.nutritionLabel}>Carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(nutrition.protein)}g</Text>
          <Text style={styles.nutritionLabel}>Protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{Math.round(nutrition.fat)}g</Text>
          <Text style={styles.nutritionLabel}>Fat</Text>
        </View>
      </View>
    </View>
  );

  if (!dayData) return null;

  const formattedDate = new Date(dayData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mealsByType = getMealsByType();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.dateTitle}>{formattedDate}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getProgressColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Loading meals...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderProgressBar()}
            {renderNutritionSummary()}
            
            <View style={styles.mealsContainer}>
              <Text style={styles.sectionTitle}>Meals</Text>
              {Object.entries(mealsByType).map(([mealType, mealList]) => 
                renderMealSection(mealType, mealList)
              )}
              
              {meals.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color={AppColors.textLight} />
                  <Text style={styles.emptyStateText}>No meals logged this day</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  progressContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  nutritionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  mealsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    marginRight: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 28,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  mealDetails: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  mealItemCalories: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: AppColors.textLight,
    marginTop: 12,
  },
});

export default DayDetailModal;
