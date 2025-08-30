import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Modal, TextInput, Alert, View } from 'react-native';
import { 
  View as RNUIView, 
  Text, 
  TouchableOpacity
} from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useSubscription } from '../contexts/SubscriptionContext';

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
  const { dailyCalories, addCalories, foodEntries = [] } = useDailyCalories();
  const { isPremium } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [tempGoal, setTempGoal] = useState('2000');

  // Calculate recommended calories based on age (simple estimation)
  const getRecommendedCalories = () => {
    // This is a simplified calculation - in reality, you'd use more factors
    // like gender, weight, height, activity level
    return 2000; // Default recommendation
  };

  // Mock data for metrics
  const todayStats = [
    { value: dailyCalories.toString(), label: 'Calories', color: AppColors.nutrition },
    { value: '45', label: 'Protein', color: AppColors.primary },
    { value: '8.2k', label: 'Steps', color: AppColors.workout },
    { value: '7.5h', label: 'Sleep', color: AppColors.account },
  ];

  const quickActions = [
    { icon: 'restaurant-outline', title: 'Log Meal', color: AppColors.nutrition },
    { icon: 'fitness-outline', title: 'Workout', color: AppColors.workout },
    { icon: 'water-outline', title: 'Water', color: AppColors.primary },
    { icon: 'moon-outline', title: 'Sleep', color: AppColors.account },
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
            <Text style={[minimalStyles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={minimalStyles.statLabel}>{stat.label}</Text>
            {index < todayStats.length - 1 && <View style={minimalStyles.statDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.actionsRow}>
        {quickActions.map((action, index) => (
          <TouchableOpacity key={index} style={minimalStyles.action} onPress={() => console.log(`Pressed ${action.title}`)}>
            <Ionicons name={action.icon} size={20} color={action.color} />
            <Text style={minimalStyles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={minimalStyles.section}>
      <View style={minimalStyles.sectionHeader}>
        <Text style={minimalStyles.sectionTitle}>Recent Meals</Text>
        <TouchableOpacity>
          <Text style={minimalStyles.sectionAction}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={minimalStyles.sectionLine} />
      
      <View style={minimalStyles.card}>
        {recentMeals.length > 0 ? (
          recentMeals.map((meal, index) => (
            <View key={index}>
              <TouchableOpacity style={minimalStyles.mealRow}>
                <View style={minimalStyles.mealInfo}>
                  <Ionicons name="restaurant-outline" size={18} color={AppColors.nutrition} />
                  <Text style={minimalStyles.mealName}>{meal.name} • {meal.time}</Text>
                </View>
                <View style={minimalStyles.mealCalories}>
                  <Text style={minimalStyles.mealValue}>{meal.calories}</Text>
                  <Text style={minimalStyles.mealUnit}>cal</Text>
                </View>
              </TouchableOpacity>
              {index < recentMeals.length - 1 && <View style={minimalStyles.mealDivider} />}
            </View>
          ))
        ) : (
          <View style={minimalStyles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color={AppColors.border} />
            <Text style={minimalStyles.emptyText}>No meals logged today</Text>
            <TouchableOpacity style={minimalStyles.emptyButton}>
              <Text style={minimalStyles.emptyButtonText}>Log your first meal</Text>
              <View style={minimalStyles.emptyButtonUnderline} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

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
        {renderQuickActions()}
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
