import React, { memo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, useWindowDimensions, SafeAreaView, Modal, TextInput, Switch, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '../contexts/AppContext';
import { useDailyCalories } from '../contexts/DailyCaloriesContext';
import { useMealManager } from '../hooks/useMealManager';
import OptimizedButton from './common/OptimizedButton';
import AnimatedBackground from './common/AnimatedBackground';
import LeaderboardScreen from './LeaderboardScreen';
import { biometricService } from '../biometricService';
import { workoutPlanService } from '../services/workoutPlanService';
import { styles as appStyles } from '../styles/AppStyles';
import { responsivePadding, fonts, spacing, scaleWidth, scaleHeight } from '../utils/responsive';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import DailyIntakeCard from './DailyIntakeCard';

const DashboardScreen = ({ user, onLogout, loading, styles = appStyles }) => {
  const { count, setCount, setActiveTab: setGlobalActiveTab } = useAppContext();
  const { dailyCalories, dailyMacros, dailyMicros, mealsLoading } = useDailyCalories();
  const mealManager = useMealManager();
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [dailyIntakeExpanded, setDailyIntakeExpanded] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    isEnabled: false,
    biometricType: 'Biometric'
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [workoutPlanLoading, setWorkoutPlanLoading] = useState(false);
  const [userWorkoutPlan, setUserWorkoutPlan] = useState(null);
  const [showWorkoutPlan, setShowWorkoutPlan] = useState(false);
  // Animated water fill state - REMOVED
  // Wave animations for water effect
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const wave4 = useRef(new Animated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Responsive values based on screen size
  const isSmallScreen = screenHeight < 700;
  const responsiveSpacing = isSmallScreen ? spacing.sm : spacing.md;

  // Health tracking removed - simplified dashboard

  // Fetch user fitness profile
  useEffect(() => {
    fetchUserProfile();
    fetchUserRanking();
    fetchLeaderboard();
    checkBiometricStatus();
    loadUserWorkoutPlan(); // Load user's workout plan
    
    // Start wave animations for water effect
    const startWaveAnimations = () => {
      // Wave 1 - fastest, 7s duration
      Animated.loop(
        Animated.timing(wave1, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        })
      ).start();

      // Wave 2 - 10s duration
      Animated.loop(
        Animated.timing(wave2, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();

      // Wave 3 - 13s duration
      Animated.loop(
        Animated.timing(wave3, {
          toValue: 1,
          duration: 13000,
          useNativeDriver: true,
        })
      ).start();

      // Wave 4 - slowest, 20s duration
      Animated.loop(
        Animated.timing(wave4, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    };
    startWaveAnimations();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // BMI calculation functions removed - no longer needed for simplified dashboard

  const getGoalText = (goalId) => {
    const goals = {
      'lose_weight': 'Lose Weight',
      'gain_muscle': 'Gain Muscle',
      'improve_endurance': 'Improve Endurance',
      'general_fitness': 'General Fitness',
      'strength_training': 'Strength Training'
    };
    return goals[goalId] || 'General Fitness';
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getUserRanking = () => {
    // Return the calculated rank based on streak data
    return userRank || 0;
  };

  const fetchUserRanking = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Get all users' current streaks and rank them
      const { data: allStreaks, error } = await supabase
        .from('user_streaks')
        .select('user_id, current_streak')
        .order('current_streak', { ascending: false });
      
      if (error) {
        console.error('Error fetching user rankings:', error);
        return;
      }
      
      // Find current user's rank
      const userIndex = allStreaks.findIndex(streak => streak.user_id === user.id);
      const rank = userIndex + 1; // Rank starts from 1
      
      setUserRank(rank);
      setTotalUsers(allStreaks.length);
    } catch (error) {
      console.error('Error in fetchUserRanking:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Get all users by current streak with their profile data
      const { data: allStreaks, error } = await supabase
        .from('user_streaks')
        .select(`
          current_streak,
          total_workouts,
          longest_streak,
          last_workout_date,
          user_id
        `)
        .order('current_streak', { ascending: false })
        .order('total_workouts', { ascending: false }); // Secondary sort by total workouts
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      // Create a user profile lookup from authenticated user and generate display names
      const formattedData = allStreaks.map((item, index) => {
        // For the current user, we have their data
        if (item.user_id === user.id) {
          const firstName = user?.user_metadata?.first_name;
          const email = user?.email;
          const displayName = firstName || email?.split('@')[0] || 'You';
          
          return {
            rank: index + 1,
            name: displayName,
            email: email,
            streak: item.current_streak,
            workouts: item.total_workouts,
            longestStreak: item.longest_streak,
            lastWorkout: item.last_workout_date,
            user_id: item.user_id,
            isCurrentUser: true,
            avatar: firstName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'Y'
          };
        } else {
          // For other users, generate anonymous display names
          const anonymousNames = [
            'Fitness Pro', 'Gym Warrior', 'Health Hero', 'Workout King', 'Fit Master',
            'Strong Athlete', 'Power Lifter', 'Cardio Queen', 'Muscle Builder', 'Training Expert',
            'Fitness Guru', 'Strength Star', 'Active Champion', 'Wellness Pro', 'Fit Legend'
          ];
          
          // Use user_id to generate consistent anonymous name
          const nameIndex = item.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % anonymousNames.length;
          const displayName = anonymousNames[nameIndex];
          const avatar = displayName.split(' ').map(word => word[0]).join('');
          
          return {
            rank: index + 1,
            name: displayName,
            email: 'hidden',
            streak: item.current_streak,
            workouts: item.total_workouts,
            longestStreak: item.longest_streak,
            lastWorkout: item.last_workout_date,
            user_id: item.user_id,
            isCurrentUser: false,
            avatar: avatar
          };
        }
      });

      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const info = await biometricService.getBiometricInfo();
      setBiometricInfo(info);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricToggle = async (enabled) => {
    try {
      if (enabled) {
        // Check if we have current credentials to enable biometrics
        if (!profileForm.email) {
          Alert.alert('Error', 'Email is required to enable biometric login');
          return;
        }

        // For enabling, we need the password - prompt user
        Alert.prompt(
          'Enable Biometric Login',
          'Please enter your current password to enable biometric authentication:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async (password) => {
                if (!password) {
                  Alert.alert('Error', 'Password is required');
                  return;
                }

                const result = await biometricService.enableBiometricLogin(profileForm.email, password);
                if (result.success) {
                  await checkBiometricStatus(); // Refresh status
                  Alert.alert('Success!', `${result.biometricType} login has been enabled.`);
                } else {
                  Alert.alert('Error', result.error);
                }
              }
            }
          ],
          'secure-text'
        );
      } else {
        // Disable biometrics
        Alert.alert(
          'Disable Biometric Login',
          'Are you sure you want to disable biometric login? You will need to enter your password manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                const result = await biometricService.disableBiometricLogin();
                if (result.success) {
                  await checkBiometricStatus(); // Refresh status
                  Alert.alert('Disabled', 'Biometric login has been disabled.');
                } else {
                  Alert.alert('Error', result.error);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const getUpcomingDays = () => {
    const days = [];
    const today = new Date();
    
    // Only show today
    for (let i = 0; i < 1; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      const dayNumber = date.getDate();
      
      days.push({
        day: dayName,
        date: dayNumber,
        isToday: i === 0
      });
    }
    
    return days;
  };

  // Remove DailyIntakeCard import since it's no longer used
  // Health tracking and activity components removed - simplified dashboard

  // Initialize profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.user_metadata?.first_name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setProfileLoading(true);
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Update user metadata (name)
      if (profileForm.firstName !== user.user_metadata?.first_name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { first_name: profileForm.firstName }
        });
        
        if (updateError) {
          throw updateError;
        }
      }

      // Update email if changed
      if (profileForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileForm.email
        });
        
        if (emailError) {
          throw emailError;
        }
      }

      // Update password if provided
      if (profileForm.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileForm.newPassword
        });
        
        if (passwordError) {
          throw passwordError;
        }
      }

      Alert.alert('Success', 'Profile updated successfully!');
      setShowProfileModal(false);
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Refresh biometric status in case email changed
      await checkBiometricStatus();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Workout Plan Functions
  const handleGenerateWorkoutPlan = async () => {
    if (workoutPlanLoading) return;
    
    setWorkoutPlanLoading(true);
    try {
      console.log('🏋️ Generating personalized workout plan...');
      
      // Get user's fitness profile
      const profileResult = await workoutPlanService.getUserFitnessProfile(user.id);
      
      if (!profileResult.success) {
        Alert.alert('Profile Required', 'Please complete your fitness profile to generate a workout plan.');
        return;
      }

      const userProfile = profileResult.profile;
      
      // Generate AI-powered workout plan
      const planResult = await workoutPlanService.generateAdaptivePlan(user.id, userProfile);
      
      if (planResult.success) {
        setUserWorkoutPlan(planResult.plan);
        Alert.alert(
          'Workout Plan Generated! 🎉', 
          'Your personalized workout plan has been created using AI. It rotates muscle groups to prevent strain and adapts to your fitness goals.',
          [
            { text: 'View Plan', onPress: () => setShowWorkoutPlan(true) }
          ]
        );
      } else {
        Alert.alert('Error', planResult.error || 'Failed to generate workout plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating workout plan:', error);
      Alert.alert('Error', 'Failed to generate workout plan. Please check your internet connection and try again.');
    } finally {
      setWorkoutPlanLoading(false);
    }
  };

  const loadUserWorkoutPlan = async () => {
    try {
      const planResult = await workoutPlanService.getUserActivePlan(user.id);
      if (planResult.success && planResult.plan) {
        setUserWorkoutPlan(planResult.plan);
      }
    } catch (error) {
      console.error('Error loading user workout plan:', error);
    }
  };

  const renderWorkoutPlanModal = () => (
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
              Your Workout Plan
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
  );

  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
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
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0'
          }}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Text style={{ fontSize: fonts.medium, color: '#4A9EFF' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: fonts.large, fontWeight: '600' }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdateProfile} disabled={profileLoading}>
              <Text style={{ 
                fontSize: fonts.medium, 
                color: profileLoading ? '#999' : '#4A9EFF',
                fontWeight: '600'
              }}>
                {profileLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: spacing.md }}>
            {/* Profile Picture Section */}
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={[styles.userAvatar, { width: scaleWidth(100), height: scaleWidth(100), borderRadius: scaleWidth(50) }]}>
                <Text style={[styles.avatarText, { fontSize: fonts.title }]}>
                  {profileForm.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <TouchableOpacity 
                style={{
                  marginTop: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  backgroundColor: '#F0F0F0',
                  borderRadius: scaleWidth(20)
                }}
                onPress={() => Alert.alert('Coming Soon', 'Photo upload feature will be available soon!')}
              >
                <Text style={{ color: '#4A9EFF', fontSize: fonts.small, fontWeight: '500' }}>
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ fontSize: fonts.medium, fontWeight: '600', marginBottom: spacing.xs, color: '#1A1A1A' }}>
                First Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: scaleWidth(8),
                  padding: spacing.sm,
                  fontSize: fonts.medium,
                  backgroundColor: '#FAFAFA'
                }}
                value={profileForm.firstName}
                onChangeText={(text) => setProfileForm(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter your first name"
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ fontSize: fonts.medium, fontWeight: '600', marginBottom: spacing.xs, color: '#1A1A1A' }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: scaleWidth(8),
                  padding: spacing.sm,
                  fontSize: fonts.medium,
                  backgroundColor: '#FAFAFA'
                }}
                value={profileForm.email}
                onChangeText={(text) => setProfileForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Section */}
            <View style={{
              marginTop: spacing.lg,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0'
            }}>
              <Text style={{ fontSize: fonts.large, fontWeight: '600', marginBottom: spacing.md, color: '#1A1A1A' }}>
                Change Password
              </Text>
              
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: fonts.medium, fontWeight: '600', marginBottom: spacing.xs, color: '#1A1A1A' }}>
                  New Password
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: scaleWidth(8),
                    padding: spacing.sm,
                    fontSize: fonts.medium,
                    backgroundColor: '#FAFAFA'
                  }}
                  value={profileForm.newPassword}
                  onChangeText={(text) => setProfileForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter new password (optional)"
                  secureTextEntry
                />
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: fonts.medium, fontWeight: '600', marginBottom: spacing.xs, color: '#1A1A1A' }}>
                  Confirm New Password
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: scaleWidth(8),
                    padding: spacing.sm,
                    fontSize: fonts.medium,
                    backgroundColor: '#FAFAFA'
                  }}
                  value={profileForm.confirmPassword}
                  onChangeText={(text) => setProfileForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Biometric Settings Section */}
            {biometricInfo.isAvailable && (
              <View style={{
                marginTop: spacing.lg,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: '#E0E0E0'
              }}>
                <Text style={{ fontSize: fonts.large, fontWeight: '600', marginBottom: spacing.md, color: '#1A1A1A' }}>
                  Security Settings
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F8F9FA',
                  borderRadius: scaleWidth(8),
                  padding: spacing.md,
                  marginBottom: spacing.sm
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fonts.medium, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
                      {biometricInfo.biometricType} Login
                    </Text>
                    <Text style={{ fontSize: fonts.small, color: '#6C757D' }}>
                      Sign in quickly using {biometricInfo.biometricType.toLowerCase()}
                    </Text>
                  </View>
                  <Switch
                    value={biometricInfo.isEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: '#E0E0E0', true: '#4A9EFF' }}
                    thumbColor={biometricInfo.isEnabled ? '#FFFFFF' : '#FFFFFF'}
                    ios_backgroundColor="#E0E0E0"
                  />
                </View>

                {biometricInfo.isEnabled && (
                  <View style={{
                    backgroundColor: '#E8F5E8',
                    borderRadius: scaleWidth(8),
                    padding: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: fonts.small, color: '#2D7D32', marginRight: spacing.xs }}>
                      ✓
                    </Text>
                    <Text style={{ fontSize: fonts.small, color: '#2D7D32', flex: 1 }}>
                      {biometricInfo.biometricType} login is enabled for faster access
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderOverview = () => {
    return (
      <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: responsiveSpacing }}>
        {/* Health Overview section removed - simplified dashboard */}
      </ScrollView>
    );
  };

  const renderWorkouts = () => (
    <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' }}>
        Workout Plans
      </Text>
      
      <View style={{
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#1A1A1A' }}>
          Today's Workout
        </Text>
        <Text style={{ color: '#6C757D', marginBottom: 16 }}>
          {getGoalText(userProfile?.main_goal)} Focus
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: workoutPlanLoading ? '#B0C4DE' : (userWorkoutPlan ? '#4CAF50' : '#87CEEB'),
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}
          onPress={userWorkoutPlan ? () => setShowWorkoutPlan(true) : handleGenerateWorkoutPlan}
          disabled={workoutPlanLoading}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {workoutPlanLoading ? 'Generating Plan...' : 
             userWorkoutPlan ? 'View Your Plan' : 'Generate AI Workout Plan'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{
        backgroundColor: '#E8F5E8',
        borderRadius: 12,
        padding: 20
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1A1A1A' }}>
          Weekly Progress
        </Text>
        <Text style={{ color: '#34C759', fontSize: 14 }}>
          3 out of 5 workouts completed this week
        </Text>
      </View>
    </ScrollView>
  );

  const renderCalories = () => {
    const intakeProgress = (dailyCalories / calorieGoal) * 100;
    const progressWidth = Math.min(Math.max(intakeProgress, 0), 100);
    
    return (
      <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' }}>
          Daily Intake
        </Text>
        
        <View style={{
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
            Today's Progress
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#6C757D' }}>Consumed</Text>
            <Text style={{ fontWeight: '600', color: '#1A1A1A' }}>
              {dailyCalories} / {calorieGoal} cal
            </Text>
          </View>
          <View style={{
            backgroundColor: '#E9ECEF',
            height: 8,
            borderRadius: 4,
            marginBottom: 16
          }}>
            <View style={{
              backgroundColor: progressWidth >= 100 ? '#FF6B6B' : '#34C759',
              height: 8,
              borderRadius: 4,
              width: `${progressWidth}%`
            }} />
          </View>
          
          {/* Progress Status */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              color: progressWidth >= 100 ? '#FF6B6B' : '#34C759',
              fontWeight: '600'
            }}>
              {progressWidth >= 100 
                ? `Goal exceeded by ${dailyCalories - calorieGoal} calories`
                : `${calorieGoal - dailyCalories} calories remaining`
              }
            </Text>
            <Text style={{ fontSize: 12, color: '#6C757D', marginTop: 4 }}>
              {Math.round(intakeProgress)}% of daily goal
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: '#87CEEB',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center'
            }}
            onPress={() => setActiveTab('nutrition')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Log Food</Text>
          </TouchableOpacity>
        </View>
        
        {/* Additional Info Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1A1A1A' }}>
            Nutrition Tips
          </Text>
          <Text style={{ fontSize: 14, color: '#6C757D', lineHeight: 20 }}>
            {dailyCalories < calorieGoal * 0.5 
              ? "Start your day with a nutritious breakfast to fuel your body!"
              : dailyCalories >= calorieGoal 
              ? "Great job reaching your calorie goal! Focus on nutrient-dense foods."
              : "You're making good progress! Remember to stay hydrated and eat balanced meals."
            }
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderProgress = () => (
    <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' }}>
        Weight Progress
      </Text>
      
      <View style={{
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
          Current Stats
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#6C757D' }}>Current Weight</Text>
          <Text style={{ fontWeight: '600', color: '#1A1A1A' }}>
            {userProfile?.weight_pounds || 0} lbs
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#6C757D' }}>Goal Weight</Text>
          <Text style={{ fontWeight: '600', color: '#007AFF' }}>
            {userProfile?.goal_weight_pounds || 0} lbs
          </Text>
        </View>
        {/* BMI calculation removed - simplified profile */}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#FF9500',
          borderRadius: 12,
          padding: 16,
          alignItems: 'center'
        }}
        onPress={() => Alert.alert('Coming Soon!', 'Weight tracking feature will be available soon!')}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Update Weight</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'workouts':
        return renderWorkouts();
      case 'calories':
        return renderCalories();
      case 'progress':
        return renderProgress();
      default:
        return renderOverview();
    }
  };

  // Water intake functionality removed - simplified dashboard

  return (
    <SafeAreaView style={styles.landingContainer}>
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>        
        <View style={styles.overlay}>
          <ScrollView 
            style={{ flex: 1, backgroundColor: 'transparent' }}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Personalized Greeting Header */}
            <View style={{
              backgroundColor: 'transparent',
              marginHorizontal: responsivePadding.container,
              marginTop: spacing.md,
              marginBottom: spacing.xl,
              borderRadius: 0,
              padding: 0,
              paddingBottom: spacing.lg,
              borderWidth: 0,
              borderColor: 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0, 0, 0, 0.08)',
              shadowColor: 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
              elevation: 0,
              }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                {/* Greeting Text */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: fonts.medium,
                    color: 'rgba(0, 0, 0, 0.6)',
                    marginBottom: spacing.xs,
                    fontWeight: '400',
                  }}>
                    {getTimeBasedGreeting()}
                  </Text>
                  <Text style={{
                    fontSize: fonts.xlarge,
                    fontWeight: '700',
                    color: 'rgba(0, 0, 0, 0.9)',
                  }}>
                    {userProfile?.first_name || user?.user_metadata?.first_name || 'User'}
                  </Text>
                </View>
                
                {/* Test and Profile Buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Samsung Health Test Button */}
                  <TouchableOpacity 
                    onPress={() => setGlobalActiveTab('test')}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(80, 227, 194, 0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(80, 227, 194, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: 'rgba(80, 227, 194, 0.8)',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      HEALTH
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Profile Picture */}
                  <TouchableOpacity 
                    onPress={() => setShowProfileModal(true)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 0, 0, 0.08)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: 'rgba(0, 0, 0, 0.7)',
                      fontSize: fonts.medium,
                      fontWeight: '500',
                    }}>
                      {(userProfile?.first_name || user?.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>            {/* Daily Intake Card */}
            <DailyIntakeCard 
              dailyCalories={dailyCalories}
              calorieGoal={calorieGoal}
              dailyMacros={dailyMacros}
              carbsGoal={250}
              proteinGoal={125}
              fatGoal={56}
              fiberGoal={25}
              sugarGoal={50}
              sodiumGoal={2300}
              isLoading={mealsLoading}
              compact={false}
              showExpandButton={true}
              onToggleExpanded={() => setDailyIntakeExpanded(!dailyIntakeExpanded)}
              isExpanded={dailyIntakeExpanded}
            />
            
          {/* Content */}
          <View style={{ flex: 1 }}>
            {renderContent()}
          </View>
          
          </ScrollView>
        </View>
      </View>
      
      {/* Profile Modal */}
      {renderProfileModal()}
      
      {/* Workout Plan Modal */}
      {renderWorkoutPlanModal()}
      
      {/* Leaderboard Screen */}
      {showLeaderboard && (
        <Modal
          visible={showLeaderboard}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <LeaderboardScreen 
            user={user}
            onBack={() => setShowLeaderboard(false)}
            styles={styles}
          />
        </Modal>
      )}
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default memo(DashboardScreen);
