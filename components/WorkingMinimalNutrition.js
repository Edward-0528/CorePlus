import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Animated, Modal, View, Text as RNText, Alert } from 'react-native';
import { 
  View as RNUIView, 
  Text, 
  TouchableOpacity
} from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useAppContext } from '../contexts/AppContext';

// Components
import FoodCameraScreen from './FoodCameraScreen';
import FoodPredictionCard from './FoodPredictionCard';
import MultiFoodSelectionCard from './MultiFoodSelectionCard';
import SwipeToDeleteWrapper from './SimpleSwipeToDelete';
import TodaysMealsComponent from './TodaysMealsComponent';
import FoodSearchModal from './FoodSearchModal';

// Define colors directly
const AppColors = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#50E3C2',
  workout: '#FF6B6B',
  account: '#FFC107',
  success: '#28A745',
  warning: '#FFC107',
};

const WorkingMinimalNutrition = ({ user, onLogout, loading, styles }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { nutritionSubTab, setNutritionSubTab } = useAppContext();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isCalorieCardExpanded, setIsCalorieCardExpanded] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'week', 'month', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  
  // Food selection states
  const [showPredictionCard, setShowPredictionCard] = useState(false);
  const [showMultiSelectionCard, setShowMultiSelectionCard] = useState(false);
  const [foodPredictions, setFoodPredictions] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);

  // Get real meal data from context
  const { 
    todaysMeals, 
    historicalMeals, 
    dailyCalories, 
    dailyMacros, 
    dailyMicros,
    mealsLoading,
    historyLoading,
    refreshMealsFromServer,
    addMeal,
    deleteMeal,
    clearCache
  } = useDailyCalories();

  // Define nutritional goals (can be made user-configurable later)
  const nutritionGoals = {
    protein: user?.protein_goal || 150, // grams
    carbs: user?.carbs_goal || 225, // grams  
    fat: user?.fat_goal || 65, // grams
    fiber: user?.fiber_goal || 25, // grams
    sugar: user?.sugar_goal || 50, // grams (WHO recommendation)
    sodium: user?.sodium_goal || 2300 // mg (FDA recommendation)
  };

  // Calculate progress percentages for nutrition values
  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'meals', label: 'Meals' },
    { id: 'recipes', label: 'Recipes' },
  ];

  const filterOptions = [
    { id: 'all', label: 'All Time', icon: 'time-outline' },
    { id: 'week', label: 'Last 7 Days', icon: 'calendar-outline' },
    { id: 'month', label: 'Last 30 Days', icon: 'calendar-outline' },
    { id: 'year', label: 'Last Year', icon: 'calendar-outline' },
  ];

  // Filter historical meals based on selected filter
  const getFilteredMeals = () => {
    if (selectedFilter === 'all') return historicalMeals;
    
    const today = new Date();
    let cutoffDate;
    
    switch (selectedFilter) {
      case 'week':
        cutoffDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (!customStartDate) return historicalMeals;
        cutoffDate = new Date(customStartDate);
        break;
      default:
        return historicalMeals;
    }
    
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    const filtered = {};
    
    Object.keys(historicalMeals).forEach(date => {
      if (selectedFilter === 'custom') {
        const endDate = customEndDate || today.toISOString().split('T')[0];
        if (date >= cutoffDateStr && date <= endDate) {
          filtered[date] = historicalMeals[date];
        }
      } else {
        if (date >= cutoffDateStr) {
          filtered[date] = historicalMeals[date];
        }
      }
    });
    
    return filtered;
  };

  // Calculate nutrition stats from real data
  const nutritionStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: AppColors.nutrition },
    { value: `${Math.round(dailyMacros.protein)}g`, label: 'Protein', color: AppColors.primary },
    { value: `${Math.round(dailyMacros.carbs)}g`, label: 'Carbs', color: AppColors.workout },
    { value: `${Math.round(dailyMacros.fat)}g`, label: 'Fat', color: AppColors.account },
  ];

  const quickActions = [
    { icon: 'camera-outline', title: 'Scan Food', color: AppColors.nutrition },
    { icon: 'restaurant-outline', title: 'Log Meal', color: AppColors.primary },
    { icon: 'water-outline', title: 'Water', color: AppColors.primary },
  ];

  // Helper function to format date for display
  function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = dateString === today.toISOString().split('T')[0];
    const isYesterday = dateString === yesterday.toISOString().split('T')[0];
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Helper function to calculate daily totals for a date
  function calculateDayTotals(meals) {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  const renderMealHistory = () => {
    const filteredMeals = getFilteredMeals();
    const historyDates = Object.keys(filteredMeals).sort((a, b) => new Date(b) - new Date(a));
    
    if (historyLoading) {
      return (
        <View style={minimalStyles.emptyState}>
          <Ionicons name="restaurant-outline" size={32} color={AppColors.textSecondary} />
          <Text style={minimalStyles.emptyStateText}>Loading meal history...</Text>
        </View>
      );
    }

    const filterLabel = filterOptions.find(f => f.id === selectedFilter)?.label || 'All Time';

    return (
      <View>
        {/* Filter Header */}
        <View style={minimalStyles.section}>
          <View style={minimalStyles.compactFilterHeader}>
            <TouchableOpacity 
              style={minimalStyles.compactFilterButton}
              onPress={() => setShowDateFilter(true)}
            >
              <Ionicons name="filter-outline" size={16} color={AppColors.nutrition} />
              <RNText style={minimalStyles.filterLabel}>{filterLabel}</RNText>
            </TouchableOpacity>
          </View>
          <View style={minimalStyles.sectionLine} />
        </View>

        {historyDates.length === 0 ? (
          <View style={minimalStyles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color={AppColors.textSecondary} />
            <Text style={minimalStyles.emptyStateText}>
              {selectedFilter === 'all' ? 'No meal history found' : `No meals found for ${filterLabel.toLowerCase()}`}
            </Text>
            <Text style={minimalStyles.emptyStateSubtext}>
              {selectedFilter === 'all' 
                ? 'Start logging meals to build your history'
                : 'Try selecting a different time period'
              }
            </Text>
          </View>
        ) : (
          historyDates.map((date) => {
            const dayMeals = filteredMeals[date] || [];
            const dayTotals = calculateDayTotals(dayMeals);
            
            return (
              <View key={date} style={minimalStyles.section}>
                <View style={minimalStyles.historyDateHeader}>
                  <Text style={minimalStyles.historyDate}>{formatDateForDisplay(date)}</Text>
                  <Text style={minimalStyles.historyTotals}>
                    {dayTotals.calories} cal • {Math.round(dayTotals.protein)}p • {Math.round(dayTotals.carbs)}c • {Math.round(dayTotals.fat)}f
                  </Text>
                </View>
                <View style={minimalStyles.sectionLine} />
                
                <View style={minimalStyles.card}>
                  {dayMeals.map((meal, index) => (
                    <View key={meal.id}>
                      <SwipeToDeleteWrapper 
                        onDelete={() => handleDeleteMeal(meal.id)}
                        enabled={true}
                        mealName={meal.name}
                      >
                        <View style={minimalStyles.mealRow}>
                          <View style={minimalStyles.mealInfo}>
                            <Ionicons name="restaurant-outline" size={16} color={AppColors.nutrition} />
                            <View style={minimalStyles.mealDetails}>
                              <Text style={minimalStyles.mealName}>{meal.name}</Text>
                              <Text style={minimalStyles.mealTime}>
                                {meal.meal_type || meal.method || 'Meal'} • {meal.time}
                              </Text>
                            </View>
                          </View>
                          <View style={minimalStyles.mealCalories}>
                            <Text style={minimalStyles.mealValue}>{meal.calories}</Text>
                            <Text style={minimalStyles.mealUnit}>cal</Text>
                          </View>
                        </View>
                      </SwipeToDeleteWrapper>
                      {index < dayMeals.length - 1 && <View style={minimalStyles.mealDivider} />}
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

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

  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    try {
      await deleteMeal(mealId);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  // Food camera handlers
  const handlePhotoTaken = (photoUri) => {
    console.log('Photo taken:', photoUri);
    // Photo is handled by the camera component
  };

  const handleFoodAnalysisComplete = async (predictions, imageUri, isLoading, errorMessage) => {
    console.log('Food analysis complete:', { predictions, imageUri, isLoading, errorMessage });
    
    if (errorMessage) {
      console.error('❌ Food analysis error:', errorMessage);
      setShowFoodCamera(false);
      return;
    }

    if (isLoading) {
      console.log('📋 Food analysis in progress, showing loading screen...');
      // Close camera and show loading screen immediately
      setFoodPredictions([]); // Empty predictions for loading state
      setCapturedImage(imageUri);
      setShowFoodCamera(false);
      setShowMultiSelectionCard(true); // Show loading in multi-selection card
      return;
    }

    if (predictions && predictions.length > 0) {
      console.log(`📋 Showing ${predictions.length} food predictions`);
      setFoodPredictions(predictions);
      setCapturedImage(imageUri);
      
      // Show appropriate selection interface based on number of predictions
      if (predictions.length === 1) {
        setShowMultiSelectionCard(false); // Close any existing loading screen
        setShowPredictionCard(true);
      } else {
        // Multi-selection card will automatically update from loading to content
        // No need to close/reopen since it's already showing
      }
    } else {
      console.log('❌ No food predictions received');
      setShowFoodCamera(false);
    }
  };

  // Food selection handlers
  const handleFoodSelection = async (selectedFood) => {
    if (selectedFood === null) {
      // User chose manual entry - could show manual entry modal here
      setShowPredictionCard(false);
      console.log('User chose manual entry');
      return;
    }

    try {
      // Add the selected food as a meal
      const result = await addMeal({
        name: selectedFood.name,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        fiber: selectedFood.fiber || 0,
        sugar: selectedFood.sugar || 0,
        sodium: selectedFood.sodium || 0,
        method: 'camera',
        confidence: selectedFood.confidence,
        imageUri: capturedImage
      });

      if (result.success) {
        console.log('✅ Meal added successfully');
        await refreshMealsFromServer();
      } else {
        console.error('❌ Failed to add meal:', result.error);
      }
    } catch (error) {
      console.error('❌ Error adding selected meal:', error);
    }
    
    setShowPredictionCard(false);
  };

  const handleMultipleFoodSelection = async (selectedFoods) => {
    if (selectedFoods === null) {
      // User chose manual entry
      setShowMultiSelectionCard(false);
      console.log('User chose manual entry');
      return;
    }

    if (selectedFoods && selectedFoods.length > 0) {
      try {
        if (selectedFoods.length === 1) {
          // Single food - add as-is
          const food = selectedFoods[0];
          const result = await addMeal({
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            fiber: food.fiber || 0,
            sugar: food.sugar || 0,
            sodium: food.sodium || 0,
            method: 'camera',
            confidence: food.confidence,
            imageUri: capturedImage
          });

          if (result.success) {
            console.log('✅ Single meal added successfully');
            await refreshMealsFromServer();
          }
        } else {
          // Multiple foods - combine into a single meal entry
          const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
          const totalProtein = selectedFoods.reduce((sum, food) => sum + food.protein, 0);
          const totalCarbs = selectedFoods.reduce((sum, food) => sum + food.carbs, 0);
          const totalFat = selectedFoods.reduce((sum, food) => sum + food.fat, 0);
          const totalFiber = selectedFoods.reduce((sum, food) => sum + (food.fiber || 0), 0);
          const totalSugar = selectedFoods.reduce((sum, food) => sum + (food.sugar || 0), 0);
          const totalSodium = selectedFoods.reduce((sum, food) => sum + (food.sodium || 0), 0);
          
          const foodNames = selectedFoods.map(food => food.name).join(', ');
          const avgConfidence = selectedFoods.reduce((sum, food) => sum + food.confidence, 0) / selectedFoods.length;

          const result = await addMeal({
            name: foodNames,
            calories: Math.round(totalCalories),
            protein: Math.round(totalProtein * 10) / 10,
            carbs: Math.round(totalCarbs * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
            fiber: Math.round(totalFiber * 10) / 10,
            sugar: Math.round(totalSugar * 10) / 10,
            sodium: Math.round(totalSodium * 10) / 10,
            method: 'camera',
            confidence: avgConfidence,
            imageUri: capturedImage
          });

          if (result.success) {
            console.log('✅ Combined meal added successfully');
            await refreshMealsFromServer();
          }
        }
      } catch (error) {
        console.error('❌ Error adding selected foods:', error);
      }
    }
    
    setShowMultiSelectionCard(false);
  };

  const handleCameraClose = () => {
    setShowFoodCamera(false);
  };

  const handleFoodSearchMeal = async (mealData) => {
    try {
      console.log('📝 Adding meal from search:', mealData);
      
      const result = await addMeal({
        name: mealData.name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        fiber: mealData.fiber || 0,
        sugar: mealData.sugar || 0,
        sodium: mealData.sodium || 0,
        method: 'search',
        confidence: mealData.confidence || 0.8
      });

      if (result.success) {
        console.log('✅ Search meal added successfully');
        await refreshMealsFromServer();
      }
    } catch (error) {
      console.error('❌ Error adding search meal:', error);
    }
  };

  const handleRecipeSelect = async (recipe) => {
    try {
      console.log('🍳 Recipe selected:', recipe.title);
      
      // Convert recipe to meal format
      const mealData = {
        name: recipe.title,
        calories: recipe.nutrition?.calories || 0,
        carbs: recipe.nutrition?.carbs || 0,
        protein: recipe.nutrition?.protein || 0,
        fat: recipe.nutrition?.fat || 0,
        fiber: recipe.nutrition?.fiber || 0,
        sugar: recipe.nutrition?.sugar || 0,
        sodium: recipe.nutrition?.sodium || 0,
        method: 'recipe',
        recipeId: recipe.id,
        servings: recipe.servings || 1,
        prepTime: recipe.readyInMinutes || 30
      };

      // Add to meals
      const result = await addMeal(mealData);
      if (result.success) {
        console.log('✅ Recipe meal added successfully');
        await refreshMealsFromServer();
      }
    } catch (error) {
      console.error('❌ Error adding recipe meal:', error);
    }
  };

  const handleQuickAction = (action) => {
    console.log(`🎯 Quick action clicked: ${action.title}`);
    setShowQuickActions(false);
    
    switch (action.title) {
      case 'Scan Food':
        console.log('📸 Opening food camera...');
        setShowFoodCamera(true);
        break;
      case 'Log Meal':
        console.log('📝 Opening manual meal entry...');
        setShowFoodSearchModal(true);
        break;
      case 'Water':
        // TODO: Implement water logging
        console.log('💧 Water logging not implemented yet');
        break;
      default:
        console.log('❓ Unknown action:', action.title);
    }
  };

  const renderHeader = () => (
    <View style={minimalStyles.header}>
      <View style={minimalStyles.headerContent}>
        <View>
          <Text style={minimalStyles.title}>Nutrition</Text>
          <Text style={minimalStyles.subtitle}>Track your daily intake</Text>
        </View>
        <TouchableOpacity onPress={() => setShowQuickActions(true)}>
          <Ionicons name="add-outline" size={24} color={AppColors.nutrition} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[minimalStyles.section, { marginTop: -8 }]}>
      <View style={minimalStyles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              minimalStyles.tab,
              nutritionSubTab === tab.id && minimalStyles.activeTab
            ]}
            onPress={() => setNutritionSubTab(tab.id)}
          >
            <Text 
              style={[
                minimalStyles.tabText,
                { color: nutritionSubTab === tab.id ? AppColors.nutrition : AppColors.textSecondary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNutritionStats = () => (
    <View style={[minimalStyles.section, { marginTop: 0 }]}>
      <View style={minimalStyles.statsContainer}>
        {nutritionStats.map((stat, index) => (
          <View key={index} style={minimalStyles.statItem}>
            <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={minimalStyles.statLabel}>{stat.label}</Text>
            {index < nutritionStats.length - 1 && <View style={minimalStyles.statDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderDateFilterModal = () => (
    <Modal
      visible={showDateFilter}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDateFilter(false)}
    >
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <View style={popupStyles.header}>
            <Text style={popupStyles.title}>Filter Meals</Text>
            <TouchableOpacity 
              onPress={() => setShowDateFilter(false)} 
              style={popupStyles.closeButton}
            >
              <Ionicons name="close-outline" size={20} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={popupStyles.content}>
            {filterOptions.map((option, index) => (
              <TouchableOpacity 
                key={option.id} 
                style={[
                  popupStyles.actionItem,
                  index < filterOptions.length - 1 && popupStyles.actionItemBorder,
                  selectedFilter === option.id && popupStyles.selectedFilterItem
                ]}
                onPress={() => {
                  setSelectedFilter(option.id);
                  setShowDateFilter(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={selectedFilter === option.id ? AppColors.nutrition : AppColors.textSecondary} 
                />
                <Text style={[
                  popupStyles.actionText,
                  selectedFilter === option.id && { color: AppColors.nutrition, fontWeight: '600' }
                ]}>{option.label}</Text>
                {selectedFilter === option.id && (
                  <Ionicons name="checkmark-outline" size={16} color={AppColors.nutrition} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderQuickActionsPopup = () => (
    <Modal
      visible={showQuickActions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowQuickActions(false)}
    >
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <View style={popupStyles.header}>
            <Text style={popupStyles.title}>Quick Actions</Text>
            <TouchableOpacity 
              onPress={() => setShowQuickActions(false)} 
              style={popupStyles.closeButton}
            >
              <Ionicons name="close-outline" size={20} color={AppColors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={popupStyles.content}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  popupStyles.actionItem,
                  index < quickActions.length - 1 && popupStyles.actionItemBorder
                ]}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
                <Text style={popupStyles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderQuickActions = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.actionsRow}>
        {quickActions.map((action, index) => (
          <TouchableOpacity key={index} style={minimalStyles.action} onPress={() => console.log(`Action: ${action.title}`)}>
            <Ionicons name={action.icon} size={20} color={action.color} />
            <Text style={minimalStyles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCalorieProgress = () => {
    // Default calorie goal - could be made configurable per user
    const calorieGoal = user?.calorie_goal || 2000;
    const consumed = dailyCalories;
    const remaining = Math.max(0, calorieGoal - consumed);
    const progressPercentage = Math.min(100, (consumed / calorieGoal) * 100);

    return (
      <View style={minimalStyles.section}>
        <View style={minimalStyles.sectionHeader}>
          <Text style={minimalStyles.sectionTitle}>Daily Goal</Text>
        </View>
        <View style={minimalStyles.sectionLine} />
        
        <TouchableOpacity 
          style={minimalStyles.card}
          onPress={() => setIsCalorieCardExpanded(!isCalorieCardExpanded)}
          activeOpacity={0.7}
        >
          <View style={minimalStyles.cardRow}>
            <Text style={minimalStyles.cardLabel}>Calories Consumed</Text>
            <Text style={[minimalStyles.cardValue, { color: AppColors.nutrition }]}>
              {consumed.toLocaleString()} / {calorieGoal.toLocaleString()}
            </Text>
          </View>
          <View style={minimalStyles.progressBar}>
            <View style={[
              minimalStyles.progressFill, 
              { 
                width: `${progressPercentage}%`, 
                backgroundColor: progressPercentage > 100 ? AppColors.warning : AppColors.nutrition 
              }
            ]} />
          </View>
          <Text style={minimalStyles.cardSubtext}>
            {remaining > 0 ? `${remaining} calories remaining` : `${consumed - calorieGoal} calories over goal`}
          </Text>

          {/* Expanded Nutrition Details */}
          {isCalorieCardExpanded && (
            <View style={minimalStyles.expandedNutrition}>
              <View style={minimalStyles.nutritionDivider} />
              
              {/* Macronutrients Section */}
              <View style={{ marginBottom: 20 }}>
                {/* 3x3 Nutrition Grid */}
                <View style={{ paddingHorizontal: 4 }}>
                  {/* Row 1 */}
                  <View style={{ 
                    flexDirection: 'row', 
                    marginBottom: 12
                  }}>
                    {/* Protein */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMacros.protein, nutritionGoals.protein) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Protein</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMacros.protein, nutritionGoals.protein) > 100 ? '#DC3545' : '#4A90E2', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMacros.protein)}g
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMacros.protein, nutritionGoals.protein))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMacros.protein, nutritionGoals.protein) > 100 ? '#DC3545' : '#4A90E2', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.protein}g</Text>
                    </View>

                    {/* Carbs */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMacros.carbs, nutritionGoals.carbs) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Carbs</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMacros.carbs, nutritionGoals.carbs) > 100 ? '#DC3545' : '#FF6B6B', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMacros.carbs)}g
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMacros.carbs, nutritionGoals.carbs))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMacros.carbs, nutritionGoals.carbs) > 100 ? '#DC3545' : '#FF6B6B', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.carbs}g</Text>
                    </View>

                    {/* Fat */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMacros.fat, nutritionGoals.fat) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Fat</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMacros.fat, nutritionGoals.fat) > 100 ? '#DC3545' : '#FFC107', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMacros.fat)}g
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMacros.fat, nutritionGoals.fat))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMacros.fat, nutritionGoals.fat) > 100 ? '#DC3545' : '#FFC107', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.fat}g</Text>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={{ 
                    flexDirection: 'row', 
                    marginBottom: 12
                  }}>
                    {/* Fiber */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMicros.fiber, nutritionGoals.fiber) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Fiber</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMicros.fiber, nutritionGoals.fiber) > 100 ? '#DC3545' : '#28A745', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMicros.fiber)}g
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMicros.fiber, nutritionGoals.fiber))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMicros.fiber, nutritionGoals.fiber) > 100 ? '#DC3545' : '#28A745', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.fiber}g</Text>
                    </View>

                    {/* Sugar */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMicros.sugar, nutritionGoals.sugar) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Sugar</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMicros.sugar, nutritionGoals.sugar) > 100 ? '#DC3545' : '#FF8C42', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMicros.sugar)}g
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMicros.sugar, nutritionGoals.sugar))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMicros.sugar, nutritionGoals.sugar) > 100 ? '#DC3545' : '#FF8C42', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.sugar}g</Text>
                    </View>

                    {/* Sodium */}
                    <View style={{ 
                      flex: 1, 
                      marginHorizontal: 2,
                      minHeight: 75
                    }}>
                      <Text style={{ 
                        fontSize: 11, 
                        color: calculateProgress(dailyMicros.sodium, nutritionGoals.sodium) > 100 ? '#DC3545' : '#666', 
                        fontWeight: '500', 
                        textAlign: 'center', 
                        height: 16, 
                        lineHeight: 16 
                      }}>Sodium</Text>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        color: calculateProgress(dailyMicros.sodium, nutritionGoals.sodium) > 100 ? '#DC3545' : '#6C757D', 
                        textAlign: 'center', 
                        height: 20, 
                        lineHeight: 20, 
                        marginTop: 4 
                      }}>
                        {Math.round(dailyMicros.sodium)}mg
                      </Text>
                      <View style={{ width: '100%', height: 3, backgroundColor: '#DDDDDD', borderRadius: 1.5, marginTop: 8 }}>
                        <View style={{ 
                          width: `${Math.min(100, calculateProgress(dailyMicros.sodium, nutritionGoals.sodium))}%`, 
                          height: 3, 
                          backgroundColor: calculateProgress(dailyMicros.sodium, nutritionGoals.sodium) > 100 ? '#DC3545' : '#6C757D', 
                          borderRadius: 1.5 
                        }} />
                      </View>
                      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', height: 12, lineHeight: 12, marginTop: 4 }}>{nutritionGoals.sodium}mg</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={minimalStyles.expandHint}>
                <Text style={minimalStyles.expandHintText}>
                  Tap to {isCalorieCardExpanded ? 'collapse' : 'expand'} details
                </Text>
              </View>
            </View>
          )}

          {/* Collapse hint when not expanded */}
          {!isCalorieCardExpanded && (
            <View style={minimalStyles.expandHint}>
              <Text style={minimalStyles.expandHintText}>Tap to view detailed nutrition</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderTodaysMeals = () => (
    <TodaysMealsComponent 
      styles={minimalStyles}
      showViewAll={true}
      onViewAllPress={() => {
        // Could navigate to full meals view or switch to meals tab
        console.log('View all meals pressed');
      }}
      onMealPress={(meal) => {
        // Could open meal details modal
        console.log('Meal pressed:', meal.name);
      }}
    />
  );

  const renderRecipeContent = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={minimalStyles.section}>
          <View style={minimalStyles.card}>
            <View style={minimalStyles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={AppColors.nutrition} />
              <Text style={minimalStyles.emptyStateText}>Coming Soon</Text>
              <Text style={minimalStyles.emptyStateSubtext}>
                We're building an amazing recipe collection for you. Check back soon for personalized meal ideas and cooking inspiration!
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (nutritionSubTab) {
      case 'today':
        return (
          <>
            {renderNutritionStats()}
            {renderCalorieProgress()}
            {/* Debug component removed */}
            {renderTodaysMeals()}
          </>
        );
      case 'meals':
        return renderMealHistory();
      case 'recipes':
        return renderRecipeContent();
      default:
        return null;
    }
  };

  return (
    <View style={minimalStyles.container}>
      {renderHeader()}
      {renderTabs()}
      
      {/* Conditional ScrollView - don't use for recipes tab to avoid VirtualizedList nesting */}
      {nutritionSubTab === 'recipes' ? (
        renderContent()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
        >
          {renderContent()}
        </ScrollView>
      )}

      {/* Quick Actions Popup */}
      {renderQuickActionsPopup()}
      
      {/* Date Filter Modal */}
      {renderDateFilterModal()}

      {/* Food Camera Modal */}
      {showFoodCamera && (
        <Modal
          visible={showFoodCamera}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleCameraClose}
        >
          <FoodCameraScreen
            onPhotoTaken={handlePhotoTaken}
            onClose={handleCameraClose}
            onAnalysisComplete={handleFoodAnalysisComplete}
          />
        </Modal>
      )}

      {/* Food Prediction Card */}
      <FoodPredictionCard
        visible={showPredictionCard}
        onClose={() => setShowPredictionCard(false)}
        predictions={foodPredictions}
        onSelectFood={handleFoodSelection}
        imageUri={capturedImage}
      />

      {/* Multiple Food Selection Card */}
      <MultiFoodSelectionCard
        visible={showMultiSelectionCard}
        onClose={() => setShowMultiSelectionCard(false)}
        predictions={foodPredictions}
        onSelectFoods={handleMultipleFoodSelection}
        imageUri={capturedImage}
      />

      {/* Food Search Modal */}
      <FoodSearchModal
        visible={showFoodSearchModal}
        onClose={() => setShowFoodSearchModal(false)}
        onAddMeal={handleFoodSearchMeal}
      />
    </View>
  );
};

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    color: AppColors.primary,
  },
  sectionLine: {
    height: 1,
    backgroundColor: AppColors.border,
    width: '100%',
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: AppColors.nutrition,
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 1,
    backgroundColor: AppColors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  action: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  actionText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 4,
    padding: 16,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: AppColors.backgroundSecondary,
    borderRadius: 1,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealDetails: {
    marginLeft: 12,
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  mealTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  mealUnit: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },
  mealDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginTop: 8,
    width: '100%',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 16,
  },
});

// Popup styles for quick actions
const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    shadowColor: AppColors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  expandedNutrition: {
    marginTop: 16,
  },
  nutritionDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginBottom: 16,
  },
  nutritionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  nutritionProgressItem: {
    marginBottom: 12,
  },
  nutritionItemDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 8,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionProgressBar: {
    height: 12,
    backgroundColor: '#DDDDDD',
    borderRadius: 6,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionProgressFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
  progressPercentage: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  micronutrientSection: {
    marginTop: 16,
  },
  nutritionLabel: {
    fontSize: 13,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
  },
  expandHintText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  historyDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  historyTotals: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  compactFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    flex: 1,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 13,
    color: AppColors.nutrition,
    marginLeft: 6,
    fontWeight: '500',
    flexShrink: 1,
  },
  compactFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.nutrition,
    maxWidth: 200,
    minWidth: 80,
  },
  selectedFilterItem: {
    backgroundColor: AppColors.nutrition + '10',
  },
});

export default WorkingMinimalNutrition;
