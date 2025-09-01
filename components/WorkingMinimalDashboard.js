import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Modal, TextInput, Alert, View } from 'react-native';
import { 
  View as RNUIView, 
  Text, 
  TouchableOpacity
} from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAppContext } from '../contexts/AppContext';

// Utils
import { getLocalDateString } from '../utils/dateUtils';

// Components
import TodaysMealsComponent from './TodaysMealsComponent';

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

const WorkingMinimalDashboard = ({ user, onLogout, loading, styles }) => {
  const { 
    dailyCalories, 
    addCalories, 
    foodEntries = [],
    todaysMeals = [],
    deleteMeal,
    mealsLoading
  } = useDailyCalories();
  const { isPremium } = useSubscription();
  const { setActiveTab, setNutritionSubTab } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [tempGoal, setTempGoal] = useState('2000');
  const [waterIntake, setWaterIntake] = useState(0); // New state for water tracking
  const [currentDate, setCurrentDate] = useState(getLocalDateString()); // Track current date for resets

  // Load water intake from storage on component mount
  useEffect(() => {
    loadWaterIntake();
  }, []);

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

  const recentMeals = foodEntries.slice(0, 3).map(entry => ({
    name: entry.description || 'Food Item',
    calories: entry.calories || 0,
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  const onRefresh = async () => {
    setRefreshing(true);
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

  const renderHeader = () => (
    <View style={minimalStyles.header}>
      <View style={minimalStyles.headerContent}>
        <View>
          <Text style={minimalStyles.greeting}>{getGreeting()}</Text>
          <Text style={minimalStyles.userName}>
            {user?.user_metadata?.first_name || 'User'}
          </Text>
          <Text style={minimalStyles.subtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity style={minimalStyles.avatarContainer}>
          <View style={minimalStyles.avatar}>
            <Text style={minimalStyles.avatarText}>
              {user?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={minimalStyles.separator} />
    </View>
  );

  const renderCalorieProgress = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Daily Calories</Text>
        <TouchableOpacity onPress={handleSetGoal}>
          <Text style={minimalStyles.sectionAction}>Set Goal</Text>
        </TouchableOpacity>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.card}>
        <View style={minimalStyles.cardRow}>
          <Text style={minimalStyles.cardValue}>{dailyCalories}</Text>
          <Text style={minimalStyles.cardUnit}>/ {calorieGoal} cal</Text>
        </View>
        <View style={minimalStyles.progressBar}>
          <View style={[minimalStyles.progressFill, { width: `${Math.min(calorieProgress, 100)}%` }]} />
        </View>
        <Text style={minimalStyles.cardSubtext}>
          {calorieGoal - dailyCalories} calories remaining
        </Text>
      </View>
    </View>
  );

  const renderTodayStats = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.statsContainer}>
        {todayStats.map((stat, index) => (
          <View key={index} style={minimalStyles.statItem}>
            {stat.tappable ? (
              <TouchableOpacity 
                onPress={stat.onPress} 
                style={minimalStyles.tappableStat}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={minimalStyles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={minimalStyles.statLabel}>{stat.label}</Text>
              </>
            )}
            {index < todayStats.length - 1 && <View style={minimalStyles.statDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => {
    // Dashboard-specific styles for TodaysMealsComponent
    const dashboardMealStyles = {
      section: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
      },
      sectionAction: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
      },
      sectionLine: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginBottom: 16,
      },
      card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 0,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
      },
      emptyStateText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6C757D',
        marginTop: 8,
      },
      emptyStateSubtext: {
        fontSize: 12,
        color: '#ADB5BD',
        marginTop: 4,
        textAlign: 'center',
      },
      mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
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
        color: '#1A1A1A',
      },
      mealTime: {
        fontSize: 12,
        color: '#6C757D',
        marginTop: 2,
      },
      mealCalories: {
        alignItems: 'flex-end',
      },
      mealValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
      },
      mealUnit: {
        fontSize: 12,
        color: '#6C757D',
      },
      mealDivider: {
        height: 1,
        backgroundColor: '#F1F3F4',
        marginHorizontal: 16,
      },
      moreRowButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      moreRowText: {
        fontSize: 13,
        color: '#6C757D',
        marginRight: 4,
      },
    };

    return (
      <TodaysMealsComponent
        styles={dashboardMealStyles}
        maxMealsToShow={3}
        showViewAll={true}
        onViewAllPress={() => {
          setNutritionSubTab('meals');
          setActiveTab('nutrition');
        }}
        emptyStateMessage="No meals logged today"
        emptyStateSubtext="Log your first meal to get started"
      />
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
        {renderCalorieProgress()}
        {renderTodayStats()}
        {renderRecentActivity()}
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

export default WorkingMinimalDashboard;
