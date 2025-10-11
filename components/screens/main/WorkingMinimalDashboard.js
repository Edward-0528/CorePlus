import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Modal, TextInput, Alert, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts
import { useDailyCalories } from '../../../contexts/DailyCaloriesContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { useAppContext } from '../../../contexts/AppContext';

// Utils
import { getLocalDateString } from '../../../utils/dateUtils';

// Services
import { userStatsService } from '../../../services/userStatsService';

// Components
import WeeklyProgressCard from '../../dashboard/WeeklyProgressCard';
import FoodCameraScreen from '../../food/FoodCameraScreen';
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

const WorkingMinimalDashboard = ({ user, onLogout, loading, styles }) => {
  const { 
    dailyCalories, 
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
  const [waterIntake, setWaterIntake] = useState(0); // New state for water tracking
  const [currentDate, setCurrentDate] = useState(getLocalDateString()); // Track current date for resets
  
  // User statistics state
  const [daysActive, setDaysActive] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);
  
  // Quick Actions state
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);

  // Load water intake from storage on component mount
  useEffect(() => {
    loadWaterIntake();
    loadUserStats();
  }, []);

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const result = await userStatsService.getUserStats();
      if (result.success) {
        const stats = result.stats;
        setDaysActive(stats.daysActive);
        setCurrentStreak(stats.currentStreak);
        setTotalMeals(stats.totalMeals);
      } else {
        console.error('Failed to load user stats:', result.error);
        // Set default values on error
        setDaysActive(0);
        setCurrentStreak(0);
        setTotalMeals(0);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default values on error
      setDaysActive(0);
      setCurrentStreak(0);
      setTotalMeals(0);
    }
  };

  // Check for date changes and reset water intake at local midnight
  useEffect(() => {
    const checkDateChange = () => {
      const today = getLocalDateString();
      if (today !== currentDate) {
        console.log('🕛 Water tracker: Date changed! Resetting water intake for new day (local timezone):', today);
        console.log('Previous date:', currentDate);
        console.log('New date:', today);
        
        // Update current date state
        setCurrentDate(today);
        
        // Reset water intake for the new day
        console.log('💧 Resetting water intake for new day');
        setWaterIntake(0);
        
        // Clear previous day's water data to save storage space
        const yesterdayKey = `water_intake_${currentDate}`;
        AsyncStorage.removeItem(yesterdayKey).catch(console.warn);
        
        // Load water intake for the new day (should be 0 but check anyway)
        loadWaterIntake();
      }
    };

    // Check immediately when component mounts
    checkDateChange();
    
    // Set up interval to check every 10 seconds (same as meals system)
    const interval = setInterval(checkDateChange, 10000);

    return () => clearInterval(interval);
  }, [currentDate]);

  // Load water intake from AsyncStorage
  const loadWaterIntake = async () => {
    try {
      const today = getLocalDateString(); // Use local timezone date
      const savedWater = await AsyncStorage.getItem(`water_intake_${today}`);
      if (savedWater) {
        const intake = parseInt(savedWater);
        console.log(`💧 Loaded water intake for ${today}: ${intake} cups`);
        setWaterIntake(intake);
      } else {
        console.log(`💧 No saved water intake for ${today}, starting fresh`);
        setWaterIntake(0);
      }
    } catch (error) {
      console.warn('Error loading water intake:', error);
    }
  };

  // Save water intake to AsyncStorage
  const saveWaterIntake = async (newIntake) => {
    try {
      const today = getLocalDateString(); // Use local timezone date
      await AsyncStorage.setItem(`water_intake_${today}`, newIntake.toString());
    } catch (error) {
      console.warn('Error saving water intake:', error);
    }
  };

  // Calculate recommended calories based on age (simple estimation)
  const getRecommendedCalories = () => {
    // This is a simplified calculation - in reality, you'd use more factors
    // like gender, weight, height, activity level
    return 2000; // Default recommendation
  };

  // Handle water intake increment
  const handleWaterIncrement = () => {
    const newIntake = waterIntake + 1;
    console.log(`💧 Water intake incremented: ${waterIntake} → ${newIntake} cups (${getLocalDateString()})`);
    setWaterIntake(newIntake);
    saveWaterIntake(newIntake);
  };

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
    { 
      value: `${waterIntake}`, 
      label: 'Water (cups)', 
      color: AppColors.primary,
      onPress: handleWaterIncrement,
      tappable: true
    },
    { value: getCaloriesBurned(), label: 'Burned', color: AppColors.workout },
    { value: calculateBMI(), label: 'BMI', color: getBMIColor() },
  ];

  // Quick Actions for meal logging
  const quickActions = [
    { icon: 'camera-outline', title: 'Scan Food', color: AppColors.nutrition },
    { icon: 'restaurant-outline', title: 'Log Meal', color: AppColors.primary },
    { icon: 'water-outline', title: 'Water', color: AppColors.primary },
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
      case 'Log Meal':
        console.log('📝 Opening manual meal entry...');
        setShowFoodSearchModal(true);
        break;
      case 'Water':
        console.log('💧 Adding water...');
        handleWaterIncrement();
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
      await loadUserStats();
      await loadWaterIntake();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calorieProgress = (dailyCalories / calorieGoal) * 100;

  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

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

  const renderHeader = () => (
    <View style={enhancedStyles.header}>
      <View style={enhancedStyles.headerContent}>
        <View style={enhancedStyles.greetingSection}>
          <Text style={enhancedStyles.greeting}>{getGreeting()}</Text>
          <Text style={enhancedStyles.userName}>
            {user?.user_metadata?.first_name || 'User'}
          </Text>
          <Text style={enhancedStyles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={enhancedStyles.streakSection}>
          {/* Streak badge removed per user request */}
          <TouchableOpacity style={enhancedStyles.avatarContainer}>
            <View style={enhancedStyles.avatar}>
              <Text style={enhancedStyles.avatarText}>
                {user?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPrimaryCalorieProgress = () => (
    <View style={enhancedStyles.primarySection}>
      <View style={enhancedStyles.calorieProgressContainer}>
        <View style={enhancedStyles.circularProgress}>
          <View style={enhancedStyles.progressCircle}>
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

        <TouchableOpacity 
          style={enhancedStyles.actionButton}
          onPress={() => addWater()}
        >
          <View style={[enhancedStyles.actionIcon, { backgroundColor: '#36C5F0' }]}>
            <Ionicons name="water" size={24} color="#FFFFFF" />
          </View>
          <Text style={enhancedStyles.actionLabel}>Add Water</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserStatistics = () => (
    <View style={enhancedStyles.section}>
      <Text style={enhancedStyles.sectionTitle}>Your Progress</Text>
      <View style={enhancedStyles.statsGrid}>
        <View style={enhancedStyles.statCard}>
          <View style={[enhancedStyles.statIconContainer, { backgroundColor: '#E8F5E8' }]}>
            <Ionicons name="calendar" size={20} color="#28A745" />
          </View>
          <Text style={enhancedStyles.statNumber}>{daysActive}</Text>
          <Text style={enhancedStyles.statLabel}>Days Active</Text>
        </View>
        
        <View style={enhancedStyles.statCard}>
          <View style={[enhancedStyles.statIconContainer, { backgroundColor: '#FFF2E8' }]}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
          </View>
          <Text style={enhancedStyles.statNumber}>{currentStreak}</Text>
          <Text style={enhancedStyles.statLabel}>Day Streak</Text>
        </View>
        
        <View style={enhancedStyles.statCard}>
          <View style={[enhancedStyles.statIconContainer, { backgroundColor: '#E8F4FD' }]}>
            <Ionicons name="restaurant" size={20} color="#4A90E2" />
          </View>
          <Text style={enhancedStyles.statNumber}>{totalMeals}</Text>
          <Text style={enhancedStyles.statLabel}>Total Meals</Text>
        </View>
        
        <View style={enhancedStyles.statCard}>
          <View style={[enhancedStyles.statIconContainer, { backgroundColor: '#F0F8FF' }]}>
            <Ionicons name="water" size={20} color="#36C5F0" />
          </View>
          <Text style={enhancedStyles.statNumber}>{waterIntake}</Text>
          <Text style={enhancedStyles.statLabel}>Glasses Today</Text>
        </View>
      </View>
    </View>
  );

  const renderWeeklyProgress = () => {
    return (
      <View style={minimalStyles.section}>
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
    <View style={minimalStyles.container}>
      {renderHeader()}
      
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
        {renderPrimaryCalorieProgress()}
        {renderQuickActions()}
        {renderWeeklyProgress()}
        {renderUserStatistics()}
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
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  <Text style={popupStyles.actionText}>{action.title}</Text>
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
            onAnalysisComplete={(predictions) => {
              // Handle food analysis results - you can implement this similar to WorkingMinimalNutrition
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
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.white,
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
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginLeft: 12,
  },
});

const enhancedStyles = StyleSheet.create({
  // Header Styles
  header: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 20,
    paddingTop: 16, // Reduced from 60 to 16 since SafeAreaView handles status bar spacing
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Keep flex-start for proper layout
  },
  greetingSection: {
    flex: 1,
    justifyContent: 'flex-start',
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
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  streakSection: {
    alignItems: 'center',
    marginTop: 14, // Fine-tuned to align avatar center with user name center
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
    margin: 20,
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
    borderColor: AppColors.primary,
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
});

export default WorkingMinimalDashboard;
