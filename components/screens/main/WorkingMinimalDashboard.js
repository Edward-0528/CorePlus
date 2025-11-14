import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Modal, TextInput, Alert, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Contexts
import { useDailyCalories } from '../../../contexts/DailyCaloriesContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAppContext } from '../../../contexts/AppContext';

// Utils  
import { getLocalDateString } from '../../../utils/dateUtils';

// Services (progress tracking imports removed to focus on AI coach)
import { supabase } from '../../../supabaseConfig';

// Components
import WeeklyProgressCard from '../../dashboard/WeeklyProgressCard';
import FoodCameraScreen from '../../food/FoodCameraScreen';
import FoodAnalysisResultsScreen from '../FoodAnalysisResultsScreen';
import FoodSearchModal from '../../food/FoodSearchModal';
import ShouldIEatItCamera from '../../food/ShouldIEatItCamera';
import FoodRecommendationScreen from '../FoodRecommendationScreen';
import EditProfileModal from '../../modals/EditProfileModal';

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
  danger: '#DC3545',
  black: '#000000',
};

const WorkingMinimalDashboard = ({ user, onLogout, loading }) => {
  // State for refreshed user data
  const [currentUser, setCurrentUser] = useState(user);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Refresh user data function
  const refreshUserData = async () => {
    try {
      console.log('🔄 Refreshing user data in Dashboard...');
      const { data: { user: updatedUser }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (updatedUser) {
        console.log('✅ User data refreshed in Dashboard');
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('❌ Error refreshing user data in Dashboard:', error);
    }
  };

  // Refresh user data when screen comes into focus
  useEffect(() => {
    refreshUserData();
  }, []);
  const { 
    dailyCalories, 
    dailyMacros,
    addCalories, 
    foodEntries = [],
    todaysMeals = [],
    deleteMeal,
    mealsLoading,
    addMeal,
    refreshMealsFromServer
  } = useDailyCalories();
  const { isPremium } = useSubscription();
  const { setActiveTab, setNutritionSubTab } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [tempGoal, setTempGoal] = useState('2000');
  // Progress statistics removed to focus on AI coach
  
  // Quick Actions state
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [showShouldIEatItCamera, setShowShouldIEatItCamera] = useState(false);
  const [showFoodRecommendation, setShowFoodRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Food analysis states
  const [showAnalysisResultsScreen, setShowAnalysisResultsScreen] = useState(false);
  const [foodPredictions, setFoodPredictions] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Progress statistics loading removed to focus on AI coach

  // Progress statistics and water tracking removed to focus on AI coach

  // Calculate recommended calories based on age (simple estimation)
  const getRecommendedCalories = () => {
    // This is a simplified calculation - in reality, you'd use more factors
    // like gender, weight, height, activity level
    return 2000; // Default recommendation
  };

  // Water tracking removed to focus on AI coach

  // Calculate BMI if user has height and weight data
  const calculateBMI = () => {
    // Mock values - in real app you'd get these from user profile
    // Set to healthy BMI range for normal display
    const weight = 70; // kg (healthy weight)
    const height = 1.75; // meters
    
    if (weight && height) {
      const bmi = (weight / (height * height)).toFixed(1);
      return bmi;
    }
    return '22.5'; // Default BMI
  };

  // Get BMI color based on health ranges
  const getBMIColor = () => {
    const bmiValue = parseFloat(calculateBMI());
    let color, category;
    
    if (bmiValue < 18.5) {
      // Underweight - Blue/Light Blue
      color = '#4A90E2'; // Light blue for underweight
      category = 'Underweight';
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      // Normal weight - Green
      color = '#28A745'; // Green for healthy range
      category = 'Normal';
    } else if (bmiValue >= 25 && bmiValue < 30) {
      // Overweight - Yellow/Orange
      color = '#FFC107'; // Yellow/amber for overweight
      category = 'Overweight';
    } else {
      // Obese - Red
      color = '#DC3545'; // Red for obese
      category = 'Obese';
    }
    
    console.log(`📊 BMI: ${bmiValue} (${category}) - Color: ${color}`);
    return color;
  };

  // Mock calories burned - in real app you'd get this from fitness tracking
  const getCaloriesBurned = () => {
    return '320'; // Mock calories burned
  };

  // Mock data for metrics
  const todayStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: AppColors.nutrition },
    { value: getCaloriesBurned(), label: 'Burned', color: AppColors.workout },
    { value: calculateBMI(), label: 'BMI', color: getBMIColor() },
  ];

  // Quick Actions for meal logging
  const quickActions = [
    { icon: 'camera-outline', title: 'Scan Food', color: AppColors.nutrition },
    { icon: 'help-circle-outline', title: 'Should I Eat It?', color: AppColors.warning, premium: true },
    { icon: 'restaurant-outline', title: 'Log Meal', color: AppColors.primary },
  ];

  // Handle quick action selections
  const handleQuickAction = (action) => {
    console.log(`🎯 Quick action clicked: ${action.title}`);
    setShowQuickActions(false);
    
    switch (action.title) {
      case 'Scan Food':
        console.log('📸 Opening food camera...');
        setShowFoodCamera(true);
        break;
      case 'Should I Eat It?':
        console.log('🤔 Opening Should I Eat It camera...');
        setShowShouldIEatItCamera(true);
        break;
      case 'Log Meal':
        console.log('📝 Opening manual meal entry...');
        setShowFoodSearchModal(true);
        break;
      default:
        console.log('Unknown action:', action.title);
    }
  };

  const recentMeals = foodEntries.slice(0, 3).map(entry => ({
    name: entry.description || 'Food Item',
    calories: entry.calories || 0,
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh functionality simplified - progress tracking removed
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calorieProgress = (dailyCalories / calorieGoal) * 100;

  // Handle opening the goal modal
  const handleSetGoal = () => {
    setTempGoal(calorieGoal.toString());
    setShowGoalModal(true);
  };

  // Handle saving the new calorie goal
  const handleSaveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (isNaN(newGoal) || newGoal < 800 || newGoal > 5000) {
      Alert.alert(
        'Invalid Goal',
        'Please enter a calorie goal between 800 and 5000 calories.',
        [{ text: 'OK' }]
      );
      return;
    }
    setCalorieGoal(newGoal);
    setShowGoalModal(false);
  };

  // Handle canceling the goal modal
  const handleCancelGoal = () => {
    setTempGoal(calorieGoal.toString());
    setShowGoalModal(false);
  };

  // Handle adding meal from food search
  const handleFoodSearchMeal = async (mealData) => {
    try {
      console.log('📝 Adding meal from search in dashboard:', mealData);
      
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
        console.log('✅ Search meal added successfully from dashboard');
        await refreshMealsFromServer();
        setShowFoodSearchModal(false);
      }
    } catch (error) {
      console.error('❌ Error adding search meal from dashboard:', error);
    }
  };

  // Handle food recommendation completion
  const handleRecommendationComplete = (recommendation) => {
    console.log('🤔 Food recommendation received:', recommendation.recommendation.shouldEat ? 'Yes' : 'No');
    setCurrentRecommendation(recommendation);
    setShowShouldIEatItCamera(false);
    setShowFoodRecommendation(true);
  };

  // Handle trying another recommendation
  const handleTryAnotherRecommendation = () => {
    setShowFoodRecommendation(false);
    setCurrentRecommendation(null);
    setShowShouldIEatItCamera(true);
  };

  // Simple Nutrition Overview
  const renderSimpleNutritionOverview = () => {
    const mealCount = todaysMeals.length;
    const proteinGoal = currentUser?.protein_goal || 150;
    const carbGoal = currentUser?.carbs_goal || 225;
    const fatGoal = currentUser?.fat_goal || 65;
    
    // Calculate percentages
    const proteinPercent = proteinGoal > 0 ? Math.round((dailyMacros.protein / proteinGoal) * 100) : 0;
    const carbPercent = carbGoal > 0 ? Math.round((dailyMacros.carbs / carbGoal) * 100) : 0;
    const fatPercent = fatGoal > 0 ? Math.round((dailyMacros.fat / fatGoal) * 100) : 0;
    const caloriePercent = calorieGoal > 0 ? Math.round((dailyCalories / calorieGoal) * 100) : 0;

    // Generate helpful suggestions based on macro balance
    const getSuggestion = () => {
      if (mealCount === 0) {
        return "Ready to start your day? Log your first meal to track your progress.";
      }

      if (caloriePercent < 30 && mealCount < 2) {
        return "You're off to a light start. Consider adding a balanced meal.";
      }

      if (proteinPercent > 150) {
        return "High protein intake today! Balance with some vegetables and carbs.";
      }

      if (carbPercent > 150) {
        return "Carb-heavy day. Try adding lean protein and healthy fats next.";
      }

      if (fatPercent > 150) {
        return "High fat intake today. Consider lighter, veggie-rich meals ahead.";
      }

      if (caloriePercent > 90 && caloriePercent <= 110) {
        return "Great calorie balance! You're right on track for your goals.";
      }

      if (caloriePercent > 120) {
        return "You've exceeded your calorie goal. Consider lighter options if eating more.";
      }

      if (mealCount >= 2 && caloriePercent < 60) {
        return "You might need more fuel. Consider a nutritious snack or meal.";
      }

      return "Looking good! Keep up the balanced eating throughout the day.";
    };

    const suggestion = getSuggestion();
    const isWarning = proteinPercent > 150 || carbPercent > 150 || fatPercent > 150 || caloriePercent > 120;

    return (
      <View style={enhancedStyles.nutritionOverview}>
        <View style={enhancedStyles.overviewHeader}>
          <Ionicons 
            name={mealCount === 0 ? "restaurant-outline" : isWarning ? "warning" : "checkmark-circle"} 
            size={20} 
            color={mealCount === 0 ? AppColors.textSecondary : isWarning ? AppColors.warning : AppColors.success} 
          />
          <Text style={enhancedStyles.overviewTitle}>
            {mealCount === 0 ? "No meals logged" : `${mealCount} meal${mealCount > 1 ? 's' : ''} logged`}
          </Text>
        </View>
        <Text style={[
          enhancedStyles.overviewSuggestion,
          { color: isWarning ? AppColors.warning : AppColors.textSecondary }
        ]}>
          {suggestion}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[enhancedStyles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E9ECEF' }]}>
      <View style={enhancedStyles.headerContent}>
        <View style={enhancedStyles.greetingSection}>
          <Text style={[enhancedStyles.userName, { color: '#212529' }]}>
            {currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.first_name || 'User'}
          </Text>
        </View>
        <View style={enhancedStyles.streakSection}>
          {/* Streak badge removed per user request */}
          <TouchableOpacity 
            style={[
              enhancedStyles.avatarContainer, 
              { 
                borderWidth: 3,
                borderColor: isPremium ? AppColors.primary : AppColors.black, // Olive for premium, black for free
                backgroundColor: AppColors.white, // White background
              }
            ]}
            activeOpacity={0.8}
            onPress={() => setShowEditProfileModal(true)}
          >
            <View style={[enhancedStyles.avatar, { backgroundColor: AppColors.white, position: 'relative' }]}>
              {/* Render Image component if profile image exists */}
              {currentUser?.user_metadata?.profile_image ? (
                <Image 
                  key={currentUser.user_metadata.profile_image}
                  source={{ 
                    uri: currentUser.user_metadata.profile_image,
                    cache: 'reload'
                  }} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: 28,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[enhancedStyles.avatarText, { color: AppColors.primary }]}>
                  {(currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.first_name)?.[0]?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPrimaryCalorieProgress = () => {
    // Determine if user is over their calorie goal
    const isOverGoal = dailyCalories > calorieGoal;
    const ringColor = isOverGoal ? AppColors.danger : AppColors.primary;
    
    return (
      <View style={enhancedStyles.primarySection}>
        <View style={enhancedStyles.calorieProgressContainer}>
          <View style={enhancedStyles.circularProgress}>
            <View style={[enhancedStyles.progressCircle, { borderColor: ringColor }]}>
              <Text style={enhancedStyles.calorieNumber}>{dailyCalories}</Text>
              <Text style={enhancedStyles.calorieUnit}>calories</Text>
              <Text style={enhancedStyles.goalText}>of {calorieGoal}</Text>
            </View>
          </View>
          <View style={enhancedStyles.progressStats}>
            <View style={enhancedStyles.statRow}>
              <Text style={enhancedStyles.statLabel}>Remaining</Text>
              <Text style={enhancedStyles.statValue}>
                {Math.max(0, calorieGoal - dailyCalories)} cal
              </Text>
            </View>
            <View style={enhancedStyles.statRow}>
              <Text style={enhancedStyles.statLabel}>Progress</Text>
              <Text style={enhancedStyles.statValue}>{Math.round(calorieProgress)}%</Text>
            </View>
            <TouchableOpacity onPress={handleSetGoal} style={enhancedStyles.goalButton}>
              <Text style={enhancedStyles.goalButtonText}>Adjust Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={enhancedStyles.section}>
      <Text style={enhancedStyles.sectionTitle}>Quick Actions</Text>
      <View style={enhancedStyles.quickActionsContainer}>
        <TouchableOpacity 
          style={enhancedStyles.actionButton}
          onPress={() => setShowFoodSearchModal(true)}
        >
          <View style={[enhancedStyles.actionIcon, { backgroundColor: '#8FBC8F' }]}>
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </View>
          <Text style={enhancedStyles.actionLabel}>Add Food</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={enhancedStyles.actionButton}
          onPress={() => setShowFoodCamera(true)}
        >
          <View style={[enhancedStyles.actionIcon, { backgroundColor: '#556B2F' }]}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </View>
          <Text style={enhancedStyles.actionLabel}>Scan Food</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={enhancedStyles.actionButton}
          onPress={() => setShowShouldIEatItCamera(true)}
        >
          <View style={[enhancedStyles.actionIcon, { backgroundColor: '#FF8C00' }]}>
            <Ionicons name="star" size={24} color="#FFFFFF" />
          </View>
          <Text style={enhancedStyles.actionLabel}>Scan to Rate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={enhancedStyles.actionButton}
          onPress={() => {
            setNutritionSubTab('meals');
            setActiveTab('nutrition');
          }}
        >
          <View style={[enhancedStyles.actionIcon, { backgroundColor: '#6B8E23' }]}>
            <Ionicons name="restaurant" size={24} color="#FFFFFF" />
          </View>
          <Text style={enhancedStyles.actionLabel}>View Meals</Text>
        </TouchableOpacity>

        {/* Water tracking removed to focus on AI coach */}
      </View>
    </View>
  );

  // Progress statistics section removed to focus on AI coach

  const renderWeeklyProgress = () => {
    return (
      <View style={enhancedStyles.section}>
        <WeeklyProgressCard 
          calorieGoal={calorieGoal}
          onPress={() => {
            setNutritionSubTab('meals');
            setActiveTab('nutrition');
          }}
        />
      </View>
    );
  };

  return (
    <View style={[minimalStyles.container, { backgroundColor: '#F8F9FA' }]}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        {renderSimpleNutritionOverview()}
        {renderPrimaryCalorieProgress()}
        {renderQuickActions()}
        {renderWeeklyProgress()}
      </ScrollView>

      {/* Calorie Goal Setting Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelGoal}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Set Daily Calorie Goal</Text>
              <TouchableOpacity onPress={handleCancelGoal} style={modalStyles.closeButton}>
                <Ionicons name="close-outline" size={24} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <Text style={modalStyles.label}>Daily Calorie Target</Text>
              <TextInput
                style={modalStyles.input}
                value={tempGoal}
                onChangeText={setTempGoal}
                keyboardType="numeric"
                placeholder="Enter calories (e.g., 2000)"
                placeholderTextColor={AppColors.textLight}
                autoFocus={true}
                selectTextOnFocus={true}
              />
              
              <View style={modalStyles.disclaimer}>
                <Text style={modalStyles.disclaimerText}>
                  <Text style={{ fontStyle: 'italic' }}>
                    The current daily limit of {getRecommendedCalories()} calories is based on the recommended average for your age group. 
                    Consult with a healthcare professional for personalized nutrition advice.
                  </Text>
                </Text>
              </View>
            </View>

            <View style={modalStyles.actions}>
              <TouchableOpacity onPress={handleCancelGoal} style={modalStyles.cancelButton}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveGoal} style={modalStyles.saveButton}>
                <Text style={modalStyles.saveText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Actions Modal */}
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
                  <View style={popupStyles.actionIconContainer}>
                    <Ionicons name={action.icon} size={20} color={action.color} />
                    {action.premium && !isPremium && (
                      <View style={popupStyles.premiumBadge}>
                        <Ionicons name="diamond" size={12} color={AppColors.white} />
                      </View>
                    )}
                  </View>
                  <Text style={popupStyles.actionText}>{action.title}</Text>
                  {action.premium && !isPremium && (
                    <Text style={popupStyles.premiumText}>PRO</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Food Camera Modal */}
      {showFoodCamera && (
        <Modal
          visible={showFoodCamera}
          animationType="slide"
          onRequestClose={() => setShowFoodCamera(false)}
        >
          <FoodCameraScreen
            onPhotoTaken={(imageUri) => {
              console.log('Photo taken:', imageUri);
            }}
            onClose={() => setShowFoodCamera(false)}
            user={user}
            onAnalysisComplete={(predictions, imageUri, isLoading, errorMessage, action) => {
              console.log('🔥🔥🔥 Dashboard analysis complete:', { 
                predictions: predictions?.length || 0, 
                imageUri, 
                isLoading, 
                errorMessage,
                action
              });
              
              if (action === 'showAnalysisScreen') {
                console.log('📋 Dashboard showing analysis results screen...');
                setFoodPredictions(predictions);
                setCapturedImage(imageUri);
                setAnalysisError(errorMessage);
                setShowFoodCamera(false);
                setShowAnalysisResultsScreen(true);
                return;
              }
              
              if (action === 'updateAnalysisScreen') {
                console.log('📋 Dashboard updating analysis results screen with results...');
                setFoodPredictions(predictions);
                setAnalysisError(errorMessage);
                return;
              }
              
              // Legacy handling
              console.log('Food analyzed:', predictions);
              setShowFoodCamera(false);
            }}
          />
        </Modal>
      )}

      {/* Food Search Modal */}
      {showFoodSearchModal && (
        <FoodSearchModal
          visible={showFoodSearchModal}
          onClose={() => setShowFoodSearchModal(false)}
          onAddMeal={handleFoodSearchMeal}
        />
      )}

      {/* Should I Eat It Camera Modal */}
      {showShouldIEatItCamera && (
        <Modal
          visible={showShouldIEatItCamera}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <ShouldIEatItCamera
            onClose={() => setShowShouldIEatItCamera(false)}
            onRecommendationComplete={handleRecommendationComplete}
          />
        </Modal>
      )}

      {/* Food Recommendation Screen Modal */}
      {showFoodRecommendation && currentRecommendation && (
        <Modal
          visible={showFoodRecommendation}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <FoodRecommendationScreen
            recommendation={currentRecommendation}
            onClose={() => {
              setShowFoodRecommendation(false);
              setCurrentRecommendation(null);
            }}
            onTryAgain={handleTryAnotherRecommendation}
          />
        </Modal>
      )}

      {/* Food Analysis Results Screen */}
      {showAnalysisResultsScreen && (
        <Modal
          visible={showAnalysisResultsScreen}
          animationType="slide"
          onRequestClose={() => setShowAnalysisResultsScreen(false)}
        >
          <FoodAnalysisResultsScreen
            route={{
              params: {
                imageUri: capturedImage,
                predictions: foodPredictions,
                error: analysisError
              }
            }}
            navigation={{
              goBack: () => setShowAnalysisResultsScreen(false)
            }}
          />
        </Modal>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={currentUser}
        onProfileUpdate={refreshUserData}
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
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginTop: 2,
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
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: AppColors.white,
    shadowColor: AppColors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden', // Ensure image is clipped to circle
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  avatarImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FF0000', // Temporary red border to see if Image renders
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
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  cardUnit: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
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
    backgroundColor: AppColors.nutrition,
    borderRadius: 1,
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
  tappableStat: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 50, // Ensures consistent height
    backgroundColor: 'transparent',
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
  mealName: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 12,
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
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  emptyButtonText: {
    fontSize: 14,
    color: AppColors.nutrition,
    fontWeight: '500',
  },
  emptyButtonUnderline: {
    height: 1,
    backgroundColor: AppColors.nutrition,
    marginTop: 2,
    width: '100%',
  },
});

// Modal styles for the calorie goal setting widget
const modalStyles = StyleSheet.create({
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
    maxWidth: 400,
    shadowColor: AppColors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    backgroundColor: AppColors.backgroundSecondary,
    marginBottom: 16,
  },
  disclaimer: {
    backgroundColor: AppColors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  disclaimerText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
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
  actionIconContainer: {
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.warning,
    backgroundColor: AppColors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});

const enhancedStyles = StyleSheet.create({
  // Header Styles
  header: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 20,
    paddingTop: 12, // Further reduced for more compact header
    paddingBottom: 12, // Reduced from 20 to 12 for more compact look
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed to center for vertical centering
  },
  greetingSection: {
    flex: 1,
    justifyContent: 'center', // Center the content vertically
  },
  greeting: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 2,
    marginTop: 0, // Ensure no extra top margin
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  dateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  streakSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.white,
  },

  // Primary Calorie Progress
  primarySection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calorieProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularProgress: {
    flex: 1,
    alignItems: 'center',
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  calorieNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  calorieUnit: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: -2,
  },
  goalText: {
    fontSize: 10,
    color: AppColors.textLight,
    marginTop: 2,
  },
  progressStats: {
    flex: 1,
    paddingLeft: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  goalButton: {
    backgroundColor: AppColors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goalButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },

  // Section Styles
  section: {
    marginTop: 0,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    textAlign: 'center',
  },

  // User Statistics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  // Nutrition Overview Styles
  nutritionOverview: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginLeft: 8,
  },
  overviewSuggestion: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textSecondary,
  },
});

export default WorkingMinimalDashboard;
