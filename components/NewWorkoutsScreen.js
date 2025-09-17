import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, scaleWidth } from '../utils/responsive';
import { workoutService } from '../services/workoutService';
import { workoutCacheService } from '../services/workoutCacheService';
import { planService } from '../services/planService';
import { workoutPlanService } from '../services/workoutPlanService';

const { width: screenWidth } = Dimensions.get('window');

// Workout Logger Modal Component
const WorkoutLoggerModal = ({ visible, onClose, onSave, isLoading }) => {
  const [workoutData, setWorkoutData] = useState({
    name: '',
    duration: '',
    caloriesBurned: '',
    notes: '',
    type: 'strength' // strength, cardio, flexibility, sports
  });

  const resetForm = () => {
    setWorkoutData({
      name: '',
      duration: '',
      caloriesBurned: '',
      notes: '',
      type: 'strength'
    });
  };

  const handleSave = () => {
    if (!workoutData.name.trim()) {
      Alert.alert('Required Field', 'Please enter a workout name.');
      return;
    }
    if (!workoutData.duration || parseInt(workoutData.duration) <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid workout duration.');
      return;
    }

    onSave({
      ...workoutData,
      duration: parseInt(workoutData.duration) || 0,
      caloriesBurned: parseInt(workoutData.caloriesBurned) || 0
    });
    resetForm();
  };

  const workoutTypes = [
    { id: 'strength', name: 'Strength', emoji: '💪', color: '#FF6B6B' },
    { id: 'cardio', name: 'Cardio', emoji: '❤️', color: '#4ECDC4' },
    { id: 'flexibility', name: 'Flexibility', emoji: '🧘', color: '#45B7D1' },
    { id: 'sports', name: 'Sports', emoji: '⚽', color: '#96CEB4' }
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Log Workout</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Text style={styles.modalSave}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Workout Type Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <View style={styles.typeGrid}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    { borderColor: type.color },
                    workoutData.type === type.id && { backgroundColor: type.color + '20' }
                  ]}
                  onPress={() => setWorkoutData(prev => ({ ...prev, type: type.id }))}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[styles.typeName, workoutData.type === type.id && { color: type.color }]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Workout Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Workout Name *</Text>
            <TextInput
              style={styles.textInput}
              value={workoutData.name}
              onChangeText={(text) => setWorkoutData(prev => ({ ...prev, name: text }))}
              placeholder="e.g., Morning Run, Push Day, Yoga Session"
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Duration and Calories Row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.inputLabel}>Duration (min) *</Text>
              <TextInput
                style={styles.textInput}
                value={workoutData.duration}
                onChangeText={(text) => setWorkoutData(prev => ({ ...prev, duration: text }))}
                placeholder="30"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Calories Burned</Text>
              <TextInput
                style={styles.textInput}
                value={workoutData.caloriesBurned}
                onChangeText={(text) => setWorkoutData(prev => ({ ...prev, caloriesBurned: text }))}
                placeholder="200"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={workoutData.notes}
              onChangeText={(text) => setWorkoutData(prev => ({ ...prev, notes: text }))}
              placeholder="How did the workout feel? Any achievements or observations?"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Today's Schedule Component
const TodaysSchedule = ({ scheduledWorkouts, onStartWorkout }) => {
  const now = new Date();
  const currentHour = now.getHours();

  if (!scheduledWorkouts || scheduledWorkouts.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Schedule</Text>
          <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
        </View>
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyScheduleText}>No workouts scheduled for today</Text>
          <Text style={styles.emptyScheduleSubtext}>Generate a plan or log a quick workout</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Today's Schedule</Text>
        <Text style={styles.scheduleCount}>{scheduledWorkouts.length} workout{scheduledWorkouts.length !== 1 ? 's' : ''}</Text>
      </View>
      
      {scheduledWorkouts.map((workout, index) => {
        const isUpcoming = workout.scheduled_time ? new Date(workout.scheduled_time).getHours() > currentHour : true;
        const isPast = workout.scheduled_time ? new Date(workout.scheduled_time).getHours() < currentHour : false;
        
        return (
          <View key={index} style={[styles.scheduleItem, isPast && styles.scheduleItemPast]}>
            <View style={styles.scheduleTime}>
              <Text style={[styles.scheduleTimeText, isPast && styles.scheduleTimeTextPast]}>
                {workout.scheduled_time ? new Date(workout.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Any time'}
              </Text>
              {isUpcoming && <View style={styles.upcomingDot} />}
            </View>
            
            <View style={styles.scheduleDetails}>
              <Text style={[styles.scheduleWorkoutName, isPast && styles.scheduleWorkoutNamePast]}>
                {workout.name}
              </Text>
              <Text style={[styles.scheduleWorkoutInfo, isPast && styles.scheduleWorkoutInfoPast]}>
                {workout.estimated_duration} min • {workout.type}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.startButton, isPast && styles.startButtonPast]}
              onPress={() => onStartWorkout(workout)}
              disabled={isPast}
            >
              <Text style={[styles.startButtonText, isPast && styles.startButtonTextPast]}>
                {isPast ? 'Missed' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

// Quick Stats Component
const QuickStats = ({ stats, todaysWorkouts, weeklyGoal }) => {
  const weeklyProgress = stats && weeklyGoal ? 
    Math.min(100, ((stats.total_workouts_this_week || 0) / Math.max(1, weeklyGoal)) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>This Week</Text>
        <Text style={styles.progressText}>{Math.round(weeklyProgress)}%</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${weeklyProgress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {stats?.total_workouts_this_week || 0} of {weeklyGoal || 3} workouts
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{todaysWorkouts?.length || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.current_streak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.total_workouts || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
};

// Main WorkoutsScreen Component
const NewWorkoutsScreen = ({ user, onLogout, loading, styles: globalStyles }) => {
  const [workoutStats, setWorkoutStats] = useState(null);
  const [todaysWorkouts, setTodaysWorkouts] = useState([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showLogger, setShowLogger] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggerLoading, setIsLoggerLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [userWorkoutPlan, setUserWorkoutPlan] = useState(null);
  const [showWorkoutPlan, setShowWorkoutPlan] = useState(false);

  // Memoized weekly goal
  const weeklyGoal = useMemo(() => {
    return workoutStats?.weekly_goal || 3;
  }, [workoutStats?.weekly_goal]);

  // Load all workout data
  const loadWorkoutData = useCallback(async (useCache = true) => {
    if (!mounted) return;
    
    try {
      setIsLoading(true);
      
      // Load user profile and workout data in parallel
      const [profileResult, statsResult, todayResult] = await Promise.all([
        loadUserProfile(),
        workoutService.getUserWorkoutStats(useCache),
        workoutService.getTodaysWorkouts(useCache)
      ]);

      if (!mounted) return;

      if (statsResult.success) {
        setWorkoutStats(statsResult.stats);
      }

      if (todayResult.success) {
        setTodaysWorkouts(todayResult.workouts);
      }

      // Load today's scheduled workouts from Apple Health or workout plan service
      await loadScheduledWorkouts(profileResult);

    } catch (error) {
      console.error('Error loading workout data:', error);
      if (mounted) {
        Alert.alert('Error', 'Failed to load workout data. Please try again.');
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  }, [mounted]);

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }, [user?.id]);

  // Load scheduled workouts from Apple Health or workout plan service
  const loadScheduledWorkouts = async (profile) => {
    try {
      // Try to get planned workouts from Apple Health first
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      // Check if health service is available and has permissions
      const healthInitialized = await healthService.initialize();
      if (healthInitialized) {
        const hasPermissions = await healthService.requestPermissions();
        if (hasPermissions) {
          // Get planned workouts from Apple Health (if any)
          const plannedWorkouts = await healthService.getPlannedWorkouts?.(startOfDay, endOfDay);
          if (plannedWorkouts?.length > 0) {
            setScheduledWorkouts(plannedWorkouts);
            return;
          }
        }
      }
      
      // If no Apple Health data or service unavailable, check if user has any active workout plans
      // This could integrate with a workout planning service in the future
      setScheduledWorkouts([]); // No scheduled workouts for now
      console.log('📅 No scheduled workouts found for today');
      
    } catch (error) {
      console.error('❌ Error loading scheduled workouts:', error);
      setScheduledWorkouts([]);
    }
  };

  // Handle workout logging
  const handleLogWorkout = useCallback(async (workoutData) => {
    if (!mounted) return;
    
    setIsLoggerLoading(true);
    try {
      const result = await workoutService.logQuickWorkout(workoutData);
      
      if (!mounted) return;
      
      if (result.success) {
        setShowLogger(false);
        await loadWorkoutData(false); // Refresh data
        Alert.alert('Success! 🎉', 'Workout logged successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      if (mounted) {
        Alert.alert('Error', 'Failed to log workout');
      }
    } finally {
      if (mounted) {
        setIsLoggerLoading(false);
      }
    }
  }, [mounted, loadWorkoutData]);

  // Handle starting a scheduled workout
  const handleStartWorkout = useCallback((workout) => {
    Alert.alert(
      'Start Workout',
      `Ready to start ${workout.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // In a real app, this would open a workout session
            Alert.alert('Feature Coming Soon', 'Guided workout sessions will be available in the next update!');
          }
        }
      ]
    );
  }, []);

  // Generate weekly workout plan with Gemini AI
  const handleGeneratePlan = useCallback(async () => {
    console.log('🏋️ Generate Plan button pressed!');
    console.log('🏋️ Debug - mounted:', mounted, 'userProfile:', !!userProfile, 'user.id:', user?.id);
    
    if (!mounted) {
      console.log('🏋️ Early return: component not mounted');
      return;
    }
    
    if (!userProfile) {
      console.log('🏋️ Early return: no user profile found');
      Alert.alert('Profile Required', 'Please complete your fitness profile first to generate a workout plan.');
      return;
    }
    
    setIsGeneratingPlan(true);
    try {
      console.log('🏋️ Generating AI-powered workout plan...');
      
      // Get user's fitness profile for AI generation
      const profileResult = await workoutPlanService.getUserFitnessProfile(user.id);
      
      if (!profileResult.success) {
        Alert.alert('Profile Required', 'Please complete your fitness profile to generate a workout plan.');
        return;
      }

      const userFitnessProfile = profileResult.profile;
      
      // Generate AI-powered workout plan
      const planResult = await workoutPlanService.generateAdaptivePlan(user.id, userFitnessProfile);
      
      if (!mounted) return;
      
      if (planResult.success) {
        setUserWorkoutPlan(planResult.plan);
        Alert.alert(
          'AI Workout Plan Generated! 🤖✨',
          'Your personalized workout plan has been created using AI. It rotates muscle groups to prevent strain and adapts to your fitness goals.',
          [
            { text: 'View Plan', onPress: () => setShowWorkoutPlan(true) },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', planResult.error || 'Failed to generate workout plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI workout plan:', error);
      if (mounted) {
        Alert.alert('Error', 'Failed to generate workout plan. Please check your internet connection and try again.');
      }
    } finally {
      if (mounted) {
        setIsGeneratingPlan(false);
      }
    }
  }, [mounted, userProfile, user?.id]);

  // Load user's existing workout plan
  const loadUserWorkoutPlan = useCallback(async () => {
    try {
      const planResult = await workoutPlanService.getUserActivePlan(user.id);
      if (planResult.success && planResult.plan) {
        setUserWorkoutPlan(planResult.plan);
      }
    } catch (error) {
      console.error('Error loading user workout plan:', error);
    }
  }, [user.id]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!mounted) return;
    
    setRefreshing(true);
    await loadWorkoutData(false); // Force fresh data
    if (mounted) {
      setRefreshing(false);
    }
  }, [mounted, loadWorkoutData]);

  // Initialize data
  useEffect(() => {
    setMounted(true);
    loadWorkoutData();
    loadUserWorkoutPlan();
    
    return () => {
      setMounted(false);
    };
  }, [loadWorkoutData, loadUserWorkoutPlan]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your workout data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workouts</Text>
          <Text style={styles.headerSubtitle}>Stay consistent, stay strong</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setShowLogger(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Log Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, userWorkoutPlan && { backgroundColor: '#E8F5E8' }]}
            onPress={userWorkoutPlan ? () => setShowWorkoutPlan(true) : handleGeneratePlan}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Ionicons 
                name={userWorkoutPlan ? "checkmark-circle" : "flash"} 
                size={20} 
                color={userWorkoutPlan ? "#34C759" : "#4A90E2"} 
              />
            )}
            <Text style={[styles.secondaryButtonText, userWorkoutPlan && { color: '#34C759' }]}>
              {isGeneratingPlan ? 'Generating AI Plan...' : 
               userWorkoutPlan ? 'View Your Plan' : 'Generate AI Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <QuickStats 
          stats={workoutStats} 
          todaysWorkouts={todaysWorkouts}
          weeklyGoal={weeklyGoal}
        />

        {/* Today's Schedule */}
        <TodaysSchedule 
          scheduledWorkouts={scheduledWorkouts}
          onStartWorkout={handleStartWorkout}
        />

        {/* Recent Activity */}
        {todaysWorkouts && todaysWorkouts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Workouts</Text>
              <Text style={styles.completedBadge}>✅ {todaysWorkouts.length} completed</Text>
            </View>
            
            {todaysWorkouts.map((workout, index) => (
              <View key={workout.id || index} style={styles.workoutItem}>
                <View style={styles.workoutIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
                <View style={styles.workoutDetails}>
                  <Text style={styles.workoutName}>{workout.workout_name}</Text>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutMetaText}>
                      {workout.total_duration} min
                    </Text>
                    {workout.calories_burned > 0 && (
                      <Text style={styles.workoutMetaText}>
                        • {workout.calories_burned} cal
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.workoutTime}>
                  {new Date(workout.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Goal-Based Motivation */}
        {userProfile && (
          <View style={styles.card}>
            <View style={styles.motivationHeader}>
              <Text style={styles.motivationTitle}>
                {getMotivationTitle(userProfile.main_goal)}
              </Text>
              <Text style={styles.motivationSubtitle}>
                {getMotivationMessage(userProfile.main_goal, workoutStats)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Workout Logger Modal */}
      <WorkoutLoggerModal
        visible={showLogger}
        onClose={() => setShowLogger(false)}
        onSave={handleLogWorkout}
        isLoading={isLoggerLoading}
      />

      {/* Workout Plan Modal */}
      <Modal
        visible={showWorkoutPlan}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5EA'
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A' }}>
                Your AI Workout Plan
              </Text>
              <TouchableOpacity onPress={() => setShowWorkoutPlan(false)}>
                <Text style={{ fontSize: 16, color: '#007AFF' }}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Plan Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              {userWorkoutPlan && (
                <>
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 }}>
                      {userWorkoutPlan.name}
                    </Text>
                    {userWorkoutPlan.description && (
                      <Text style={{ fontSize: 14, color: '#6C757D', marginBottom: 12 }}>
                        {userWorkoutPlan.description}
                      </Text>
                    )}
                    {userWorkoutPlan.plan_metadata?.ai_generated && (
                      <View style={{ 
                        backgroundColor: '#E8F5E8', 
                        padding: 12, 
                        borderRadius: 8, 
                        marginBottom: 16 
                      }}>
                        <Text style={{ color: '#34C759', fontSize: 12, fontWeight: '600' }}>
                          🤖 AI-Generated Plan - Optimized for muscle group rotation and your goals
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Weekly Schedule */}
                  {userWorkoutPlan.plan_metadata?.weekly_schedule && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1A1A1A' }}>
                        Weekly Schedule ({userWorkoutPlan.plan_metadata.days_per_week} days/week)
                      </Text>
                      {userWorkoutPlan.plan_metadata.weekly_schedule.map((workout, index) => (
                        <View key={index} style={{ 
                          backgroundColor: '#F8F9FA', 
                          padding: 16, 
                          borderRadius: 12, 
                          marginBottom: 12 
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
                            Day {workout.day}: {workout.workout_name}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#6C757D', marginBottom: 8 }}>
                            Focus: {workout.focus} • Duration: {workout.duration_minutes} min
                          </Text>
                          <Text style={{ fontSize: 14, color: '#6C757D' }}>
                            {workout.exercises?.length || 0} exercises
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Safety Notes */}
                  {userWorkoutPlan.plan_metadata?.safety_notes && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1A1A1A' }}>
                        Safety Guidelines
                      </Text>
                      {userWorkoutPlan.plan_metadata.safety_notes.map((note, index) => (
                        <Text key={index} style={{ 
                          fontSize: 14, 
                          color: '#6C757D', 
                          marginBottom: 8,
                          paddingLeft: 16
                        }}>
                          • {note}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Nutrition Tips */}
                  {userWorkoutPlan.plan_metadata?.nutrition_tips && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1A1A1A' }}>
                        Nutrition Tips
                      </Text>
                      {userWorkoutPlan.plan_metadata.nutrition_tips.map((tip, index) => (
                        <Text key={index} style={{ 
                          fontSize: 14, 
                          color: '#6C757D', 
                          marginBottom: 8,
                          paddingLeft: 16
                        }}>
                          • {tip}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// Helper functions
const getMotivationTitle = (goal) => {
  const titles = {
    'lose_weight': '🔥 Burn & Transform',
    'build_muscle': '💪 Build & Grow',
    'keep_fit': '⚡ Stay Strong'
  };
  return titles[goal] || '🎯 Keep Going';
};

const getMotivationMessage = (goal, stats) => {
  const streak = stats?.current_streak || 0;
  
  if (streak === 0) {
    const messages = {
      'lose_weight': 'Every workout burns calories. Start your journey today!',
      'build_muscle': 'Muscle grows with consistency. Begin your transformation!',
      'keep_fit': 'Fitness is a lifestyle. Make today count!'
    };
    return messages[goal] || 'Your fitness journey starts with one workout.';
  }
  
  if (streak < 7) {
    return `Great start! You're ${streak} day${streak !== 1 ? 's' : ''} into building a healthy habit.`;
  }
  
  return `Amazing! ${streak} days strong. You're building incredible momentum!`;
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.medium,
    color: '#666',
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.medium,
    color: '#666',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.medium,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    gap: spacing.xs,
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: fonts.medium,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressText: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#4A90E2',
  },
  progressBarContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: fonts.small,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: fonts.small,
    color: '#666',
    marginTop: spacing.xs,
  },
  scheduleCount: {
    fontSize: fonts.small,
    color: '#4A90E2',
    fontWeight: '500',
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyScheduleText: {
    fontSize: fonts.medium,
    color: '#666',
    marginBottom: spacing.xs,
  },
  emptyScheduleSubtext: {
    fontSize: fonts.small,
    color: '#999',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleItemPast: {
    opacity: 0.6,
  },
  scheduleTime: {
    width: 80,
    alignItems: 'center',
    position: 'relative',
  },
  scheduleTimeText: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#4A90E2',
  },
  scheduleTimeTextPast: {
    color: '#999',
  },
  upcomingDot: {
    width: 6,
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    position: 'absolute',
    top: -2,
    right: 10,
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  scheduleWorkoutName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: spacing.xs,
  },
  scheduleWorkoutNamePast: {
    color: '#999',
  },
  scheduleWorkoutInfo: {
    fontSize: fonts.small,
    color: '#666',
  },
  scheduleWorkoutInfoPast: {
    color: '#999',
  },
  startButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  startButtonPast: {
    backgroundColor: '#F0F0F0',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.small,
    fontWeight: '600',
  },
  startButtonTextPast: {
    color: '#999',
  },
  completedBadge: {
    fontSize: fonts.small,
    color: '#4CAF50',
    fontWeight: '500',
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  workoutIcon: {
    marginRight: spacing.md,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: spacing.xs,
  },
  workoutMeta: {
    flexDirection: 'row',
  },
  workoutMetaText: {
    fontSize: fonts.small,
    color: '#666',
  },
  workoutTime: {
    fontSize: fonts.small,
    color: '#999',
  },
  motivationHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  motivationTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  motivationSubtitle: {
    fontSize: fonts.medium,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: fonts.medium,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSave: {
    fontSize: fonts.medium,
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: (screenWidth - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeName: {
    fontSize: fonts.small,
    fontWeight: '500',
    color: '#666',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fonts.medium,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default NewWorkoutsScreen;
