import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Animated, Modal, View, Text, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useDailyCalories } from '../../../contexts/DailyCaloriesContext';
import { useAppContext } from '../../../contexts/AppContext';

// Components
import FoodCameraScreen from '../../food/FoodCameraScreen';
import FoodPredictionCard from '../../food/FoodPredictionCard';
import MultiFoodSelectionCard from '../../food/MultiFoodSelectionCard';
import SwipeToDeleteWrapper from '../../shared/SimpleSwipeToDelete';
import TodaysMealsComponent from '../../nutrition/TodaysMealsComponent';
import FoodSearchModal from '../../food/FoodSearchModal';

// Define colors directly
const AppColors = {
  primary: '#6B8E23',
  white: '#FFFFFF',
  border: '#E9ECEF',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  backgroundSecondary: '#F8F9FA',
  nutrition: '#8FBC8F',
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
    { id: 'meals', label: 'Previous Meals' },
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
          <View style={modernCardStyles.container}>
            <View style={modernHistoryStyles.filterHeader}>
              <TouchableOpacity 
                style={modernHistoryStyles.filterButton}
                onPress={() => setShowDateFilter(true)}
              >
                <Ionicons name="filter-outline" size={16} color="#007AFF" />
                <Text style={modernHistoryStyles.filterLabel}>{filterLabel}</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {historyDates.length === 0 ? (
          <View style={minimalStyles.section}>
            <View style={modernCardStyles.container}>
              <View style={modernMealsStyles.emptyState}>
                <View style={modernMealsStyles.emptyStateIconContainer}>
                  <Ionicons name="add-circle" size={40} color="#007AFF" />
                </View>
                <Text style={modernMealsStyles.emptyStateText}>
                  {selectedFilter === 'all' ? 'No meal history found' : `No meals found for ${filterLabel.toLowerCase()}`}
                </Text>
                <Text style={modernMealsStyles.emptyStateSubtext}>
                  {selectedFilter === 'all' 
                    ? 'Start logging meals to build your history'
                    : 'Try selecting a different time period'
                  }
                </Text>
              </View>
            </View>
          </View>
        ) : (
          historyDates.map((date) => {
            const dayMeals = filteredMeals[date] || [];
            const dayTotals = calculateDayTotals(dayMeals);
            
            return (
              <View key={date} style={minimalStyles.section}>
                <View style={modernCardStyles.container}>
                  <Text style={modernCardStyles.subtitle}>{formatDateForDisplay(date)}</Text>
                  <Text style={modernHistoryStyles.dayTotals}>
                    {dayTotals.calories} cal • {Math.round(dayTotals.protein)}p • {Math.round(dayTotals.carbs)}c • {Math.round(dayTotals.fat)}f
                  </Text>
                  
                  <View style={modernHistoryStyles.mealsContainer}>
                    {dayMeals.map((meal, index) => (
                      <View key={meal.id}>
                        <SwipeToDeleteWrapper 
                          onDelete={() => handleDeleteMeal(meal.id)}
                          enabled={true}
                          mealName={meal.name}
                        >
                          <View style={modernMealsStyles.mealCard}>
                            <View style={modernMealsStyles.mealHeader}>
                              <Text 
                                style={modernMealsStyles.mealType}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {meal.name}
                              </Text>
                              <View style={modernMealsStyles.calorieInfo}>
                                <Text style={modernMealsStyles.calorieValue}>{meal.calories}</Text>
                                <Text style={modernMealsStyles.calorieUnit}>kcal</Text>
                              </View>
                            </View>
                            
                            <Text style={modernMealsStyles.mealTime}>{meal.time}</Text>
                            
                            <View style={modernMealsStyles.macroContainer}>
                              <View style={modernMealsStyles.macroItem}>
                                <Text style={modernMealsStyles.macroLabel}>P</Text>
                                <Text style={modernMealsStyles.macroValue}>{Math.round(meal.protein || 0)}g</Text>
                              </View>
                              <View style={[modernMealsStyles.macroItem, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={[modernMealsStyles.macroLabel, { color: '#1976D2' }]}>C</Text>
                                <Text style={modernMealsStyles.macroValue}>{Math.round(meal.carbs || 0)}g</Text>
                              </View>
                              <View style={[modernMealsStyles.macroItem, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={[modernMealsStyles.macroLabel, { color: '#F57C00' }]}>F</Text>
                                <Text style={modernMealsStyles.macroValue}>{Math.round(meal.fat || 0)}g</Text>
                              </View>
                            </View>
                          </View>
                        </SwipeToDeleteWrapper>
                        {index < dayMeals.length - 1 && <View style={modernMealsStyles.mealDivider} />}
                      </View>
                    ))}
                  </View>
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
    const calorieGoal = user?.calorie_goal || 2400;
    const consumed = dailyCalories;
    const remaining = Math.max(0, calorieGoal - consumed);
    const progressPercentage = Math.min(100, (consumed / calorieGoal) * 100);

    return (
      <View style={minimalStyles.section}>
        <TouchableOpacity 
          style={modernCardStyles.container}
          onPress={() => setIsCalorieCardExpanded(!isCalorieCardExpanded)}
          activeOpacity={0.7}
        >
          <Text style={modernCardStyles.subtitle}>Calories and macronutrients</Text>
          
          <View style={modernCardStyles.mainContent}>
            <Text style={modernCardStyles.mainValue}>
              {consumed.toLocaleString()} / {calorieGoal.toLocaleString()}
            </Text>
            <Text style={modernCardStyles.unit}>kcal</Text>
            <Text style={modernCardStyles.percentage}>{Math.round(progressPercentage)}%</Text>
          </View>

          {/* Macronutrient Progress Bars */}
          <View style={modernCardStyles.macroSection}>
            {/* Protein */}
            <View style={modernCardStyles.macroItem}>
              <Text style={modernCardStyles.macroLabel}>Protein</Text>
              <Text style={modernCardStyles.macroValue}>
                {Math.round(dailyMacros.protein)}g / {nutritionGoals.protein}g
              </Text>
              <View style={modernCardStyles.progressContainer}>
                <View style={[
                  modernCardStyles.progressBar,
                  { 
                    width: `${Math.min(100, calculateProgress(dailyMacros.protein, nutritionGoals.protein))}%`,
                    backgroundColor: '#4CAF50'
                  }
                ]} />
              </View>
            </View>

            {/* Carbs */}
            <View style={modernCardStyles.macroItem}>
              <Text style={modernCardStyles.macroLabel}>Carbs</Text>
              <Text style={modernCardStyles.macroValue}>
                {Math.round(dailyMacros.carbs)}g / {nutritionGoals.carbs}g
              </Text>
              <View style={modernCardStyles.progressContainer}>
                <View style={[
                  modernCardStyles.progressBar,
                  { 
                    width: `${Math.min(100, calculateProgress(dailyMacros.carbs, nutritionGoals.carbs))}%`,
                    backgroundColor: '#4CAF50'
                  }
                ]} />
              </View>
            </View>

            {/* Fat */}
            <View style={modernCardStyles.macroItem}>
              <Text style={modernCardStyles.macroLabel}>Fat</Text>
              <Text style={modernCardStyles.macroValue}>
                {Math.round(dailyMacros.fat)}g / {nutritionGoals.fat}g
              </Text>
              <View style={modernCardStyles.progressContainer}>
                <View style={[
                  modernCardStyles.progressBar,
                  { 
                    width: `${Math.min(100, calculateProgress(dailyMacros.fat, nutritionGoals.fat))}%`,
                    backgroundColor: '#4CAF50'
                  }
                ]} />
              </View>
            </View>
          </View>

          {/* Expanded Nutrition Details */}
          {isCalorieCardExpanded && (
            <View style={minimalStyles.expandedNutrition}>
              <View style={minimalStyles.nutritionDivider} />
              
              {/* Micronutrients Section */}
              <View style={[modernCardStyles.macroSection, { marginTop: 8 }]}>
                {/* Fiber */}
                <View style={modernCardStyles.macroItem}>
                  <Text style={modernCardStyles.macroLabel}>Fiber</Text>
                  <Text style={modernCardStyles.macroValue}>
                    {Math.round(dailyMicros.fiber)}g / {nutritionGoals.fiber}g
                  </Text>
                  <View style={modernCardStyles.progressContainer}>
                    <View style={[
                      modernCardStyles.progressBar,
                      { 
                        width: `${Math.min(100, calculateProgress(dailyMicros.fiber, nutritionGoals.fiber))}%`,
                        backgroundColor: calculateProgress(dailyMicros.fiber, nutritionGoals.fiber) > 100 ? '#DC3545' : '#4CAF50'
                      }
                    ]} />
                  </View>
                </View>

                {/* Sugar */}
                <View style={modernCardStyles.macroItem}>
                  <Text style={modernCardStyles.macroLabel}>Sugar</Text>
                  <Text style={modernCardStyles.macroValue}>
                    {Math.round(dailyMicros.sugar)}g / {nutritionGoals.sugar}g
                  </Text>
                  <View style={modernCardStyles.progressContainer}>
                    <View style={[
                      modernCardStyles.progressBar,
                      { 
                        width: `${Math.min(100, calculateProgress(dailyMicros.sugar, nutritionGoals.sugar))}%`,
                        backgroundColor: calculateProgress(dailyMicros.sugar, nutritionGoals.sugar) > 100 ? '#DC3545' : '#4CAF50'
                      }
                    ]} />
                  </View>
                </View>

                {/* Sodium */}
                <View style={modernCardStyles.macroItem}>
                  <Text style={modernCardStyles.macroLabel}>Sodium</Text>
                  <Text style={modernCardStyles.macroValue}>
                    {Math.round(dailyMicros.sodium)}mg / {nutritionGoals.sodium}mg
                  </Text>
                  <View style={modernCardStyles.progressContainer}>
                    <View style={[
                      modernCardStyles.progressBar,
                      { 
                        width: `${Math.min(100, calculateProgress(dailyMicros.sodium, nutritionGoals.sodium))}%`,
                        backgroundColor: calculateProgress(dailyMicros.sodium, nutritionGoals.sodium) > 100 ? '#DC3545' : '#4CAF50'
                      }
                    ]} />
                  </View>
                </View>
              </View>

            </View>
          )}

          {/* Visual Expand/Collapse Indicator */}
          <View style={modernCardStyles.expandIndicator}>
            <View style={modernCardStyles.expandLine} />
            <View style={modernCardStyles.expandIconContainer}>
              <Ionicons 
                name={isCalorieCardExpanded ? 'remove' : 'add'} 
                size={16} 
                color="#8E8E93" 
              />
            </View>
            <View style={modernCardStyles.expandLine} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTodaysMeals = () => (
    <View style={modernCardStyles.mealsSection}>
      <View style={modernCardStyles.container}>
        <TodaysMealsComponent 
          styles={modernMealsStyles}
          showViewAll={true}
          onViewAllPress={() => {
            // Could navigate to full meals view or switch to meals tab
            console.log('View all meals pressed');
          }}
          onMealPress={(meal) => {
            // Could open meal details modal
            console.log('Meal pressed:', meal.name);
          }}
          onEmptyStatePress={() => {
            console.log('🎯 Empty state pressed! Opening quick actions modal...');
            setShowQuickActions(true);
          }}
        />
      </View>
    </View>
  );

  

  const renderContent = () => {
    switch (nutritionSubTab) {
      case 'today':
        return (
          <>
            {renderCalorieProgress()}
            {/* Today's Meals Section Title */}
            <View style={modernCardStyles.titleSection}>
              <Text style={modernCardStyles.sectionTitle}>Today's Meals</Text>
            </View>
            {renderTodaysMeals()}
          </>
        );
      case 'meals':
        return renderMealHistory();
      default:
        return null;
    }
  };

  return (
    <View style={minimalStyles.container}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
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
    marginBottom: 16,
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
  emptyStateIconContainer: {
    marginBottom: 16,
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
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: AppColors.primary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
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

// Modern card styles inspired by the design reference
const modernCardStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 20, // Strong rounded corners for friendliness
    padding: 24,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 0,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
  },
  mealsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 2,
  },
  percentage: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 'auto',
  },
  macroSection: {
    gap: 16,
  },
  macroItem: {
    // No additional styling needed, using gap for spacing
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  // Visual expand/collapse indicator
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  expandLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  expandIconContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
});

// Modern meals styles to match the nutrition card
const modernMealsStyles = StyleSheet.create({
  section: {
    // Remove section styling - handled by parent container
  },
  sectionHeader: {
    // Hide the header - handled by parent
    display: 'none',
  },
  sectionLine: {
    // Hide the line - handled by parent
    display: 'none',
  },
  card: {
    // Remove card styling - parent container handles it
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    margin: 0,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  mealCard: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  calorieInfo: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  calorieUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: -2,
  },
  calorieLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  mealTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  macroContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 2,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  mealDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 0,
    width: '100%',
  },
  moreRowButton: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreRowText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
});

// Modern history styles for meal history cards
const modernHistoryStyles = StyleSheet.create({
  filterHeader: {
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
    marginRight: 4,
  },
  dayTotals: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 16,
  },
  mealsContainer: {
    marginTop: 8,
  },
});

export default WorkingMinimalNutrition;
