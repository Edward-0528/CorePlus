import React, { memo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, useWindowDimensions, SafeAreaView, Modal, TextInput, Animated, PanResponder, Switch, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '../contexts/AppContext';
import OptimizedButton from './common/OptimizedButton';
import AnimatedBackground from './common/AnimatedBackground';
import LeaderboardScreen from './LeaderboardScreen';
import { biometricService } from '../biometricService';
import { styles as appStyles } from '../styles/AppStyles';
import { responsivePadding, fonts, spacing, scaleWidth, scaleHeight } from '../utils/responsive';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';

const DashboardScreen = ({ user, onLogout, loading, styles = appStyles }) => {
  const { count, setCount } = useAppContext();
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
  const [slideValue] = useState(new Animated.Value(0));
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(false);
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

  // Water intake state: track ounces and last reset date
  const [waterOunces, setWaterOunces] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(new Date().toDateString());
  const WATER_GOAL_OZ = 124;
  const WATER_INCREMENT_OZ = 8;

  // Reset water intake if the day has changed
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      setWaterOunces(0);
      setLastResetDate(today);
    }
  }, [lastResetDate]);

  // Fetch user fitness profile
  useEffect(() => {
    fetchUserProfile();
    fetchUserStreak();
    fetchUserRanking();
    fetchLeaderboard();
    checkBiometricStatus();
    
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

  const calculateBMI = () => {
    if (!userProfile) return 0;
    return userProfile.bmi || 0;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3182ce' };
    if (bmi < 25) return { category: 'Normal', color: '#38a169' };
    if (bmi < 30) return { category: 'Overweight', color: '#d69e2e' };
    return { category: 'Obese', color: '#e53e3e' };
  };

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

  const createSlideGesture = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate the available slide distance more accurately
        // Account for: streak section (45) + its right margin (spacing.sm) + slider margins (spacing.xs * 2)
        const usedWidth = scaleWidth(45) + spacing.sm + (spacing.xs * 2);
        const availableContainerWidth = screenWidth - (spacing.md * 2) - usedWidth; // Total screen minus module margins minus used sections
        const sliderWidth = scaleWidth(30); // Width of the sliding button
        const maxSlide = availableContainerWidth - sliderWidth;
        
        if (gestureState.dx >= 0 && gestureState.dx <= maxSlide) {
          slideValue.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Calculate the available slide distance more accurately
        const usedWidth = scaleWidth(45) + spacing.sm + (spacing.xs * 2);
        const availableContainerWidth = screenWidth - (spacing.md * 2) - usedWidth;
        const sliderWidth = scaleWidth(30);
        const maxSlide = availableContainerWidth - sliderWidth;
        const threshold = maxSlide * 0.75; // 75% threshold for better UX
        
        if (gestureState.dx > threshold) {
          // Successfully swiped - immediate satisfaction with quick completion
          Animated.spring(slideValue, {
            toValue: maxSlide,
            useNativeDriver: false,
            tension: 120,
            friction: 7
          }).start(() => {
            // Immediate haptic feedback
            import('expo-haptics').then(({ Haptics }) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }).catch(() => {
              // Haptics not available, continue silently
            });
            
            // Quick reset after a brief moment
            setTimeout(() => {
              Animated.timing(slideValue, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
              }).start();
            }, 600);
          });
          
          // Increment streak in background - don't wait for it
          incrementUserStreak();
        } else {
          // Reset to original position with encouraging bounce
          Animated.spring(slideValue, {
            toValue: 0,
            useNativeDriver: false,
            tension: 200,
            friction: 8
          }).start();
        }
      },
    });
  };

  const panResponder = createSlideGesture();

  // Streak Management Functions
  const fetchUserStreak = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user streak:', error);
        return;
      }
      
      if (data) {
        // Check if streak should be reset based on last workout date
        const lastWorkoutDate = new Date(data.last_workout_date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // Reset time to start of day for accurate comparison
        const resetTime = (date) => {
          const newDate = new Date(date);
          newDate.setHours(0, 0, 0, 0);
          return newDate;
        };
        
        const lastWorkoutReset = resetTime(lastWorkoutDate);
        const todayReset = resetTime(today);
        const yesterdayReset = resetTime(yesterday);
        
        // If last workout was today, keep current streak
        if (lastWorkoutReset.getTime() === todayReset.getTime()) {
          setCurrentStreak(data.current_streak);
        }
        // If last workout was yesterday, keep streak but allow for today's workout
        else if (lastWorkoutReset.getTime() === yesterdayReset.getTime()) {
          setCurrentStreak(data.current_streak);
        }
        // If last workout was before yesterday, reset streak
        else if (lastWorkoutReset.getTime() < yesterdayReset.getTime()) {
          await resetUserStreak();
        }
      } else {
        // No streak record exists, create one
        await createUserStreak();
      }
    } catch (error) {
      console.error('Error in fetchUserStreak:', error);
    }
  };

  const createUserStreak = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { data, error } = await supabase
        .from('user_streaks')
        .insert([
          {
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0,
            last_workout_date: null,
            total_workouts: 0
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user streak:', error);
        return;
      }
      
      setCurrentStreak(0);
    } catch (error) {
      console.error('Error in createUserStreak:', error);
    }
  };

  const resetUserStreak = async () => {
    try {
      const { supabase } = await import('../supabaseConfig');
      const { error } = await supabase
        .from('user_streaks')
        .update({
          current_streak: 0,
          last_workout_date: null
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error resetting user streak:', error);
        return;
      }
      
      setCurrentStreak(0);
    } catch (error) {
      console.error('Error in resetUserStreak:', error);
    }
  };

  const incrementUserStreak = async () => {
    if (streakLoading) return;
    
    setStreakLoading(true);
    try {
      const { supabase } = await import('../supabaseConfig');
      
      // Get current streak data
      const { data: currentData, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current streak data:', fetchError);
        return;
      }
      
      const today = new Date();
      const lastWorkoutDate = currentData.last_workout_date ? new Date(currentData.last_workout_date) : null;
      
      // Check if user already worked out today
      if (lastWorkoutDate) {
        const todayReset = new Date(today);
        todayReset.setHours(0, 0, 0, 0);
        const lastWorkoutReset = new Date(lastWorkoutDate);
        lastWorkoutReset.setHours(0, 0, 0, 0);
        
        if (lastWorkoutReset.getTime() === todayReset.getTime()) {
          Alert.alert('Already Logged!', 'You\'ve already completed a workout today. Keep up the great work!');
          return;
        }
      }
      
      const newStreak = currentData.current_streak + 1;
      const newLongestStreak = Math.max(currentData.longest_streak, newStreak);
      const newTotalWorkouts = currentData.total_workouts + 1;
      
      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_workout_date: today.toISOString().split('T')[0], // Store as YYYY-MM-DD
          total_workouts: newTotalWorkouts
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating user streak:', updateError);
        return;
      }
      
      setCurrentStreak(newStreak);
      
      // Update ranking after streak change
      await fetchUserRanking();
      
      // Update leaderboard data
      await fetchLeaderboard();
      
      // Show celebration message
      if (newStreak === 1) {
        Alert.alert('Workout Complete!', 'Great job! You\'ve started your fitness streak!');
      } else if (newStreak % 7 === 0) {
        Alert.alert('Weekly Streak!', `Amazing! You\'ve hit a ${newStreak}-day streak!`);
      } else {
        Alert.alert('Workout Complete!', `Fantastic! Your streak is now ${newStreak} days!`);
      }
      
    } catch (error) {
      console.error('Error in incrementUserStreak:', error);
      Alert.alert('Error', 'Failed to update streak. Please try again.');
    } finally {
      setStreakLoading(false);
    }
  };

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
    const bmi = calculateBMI();
    const bmiInfo = getBMICategory(bmi);
    
    return (
      <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: responsiveSpacing }}>
        
        

        {/* Stats Grid - 2x2 Layout */}
        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          {/* Calories Card */}
          <View style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: scaleWidth(16),
            padding: spacing.md,
            marginRight: spacing.xs,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fonts.small, color: '#8E8E93', fontWeight: '500' }}>Total Calories Burned</Text>
            </View>
            <Text style={{ 
              fontSize: fonts.title, 
              fontWeight: 'bold', 
              color: '#1A1A1A',
              marginBottom: 2
            }}>
              1,150
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>cal</Text>
          </View>

          {/* Steps Card */}
          <View style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: scaleWidth(16),
            padding: spacing.md,
            marginLeft: spacing.xs,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fonts.small, color: '#8E8E93', fontWeight: '500' }}>Meal Tracker</Text>
            </View>
            <Text style={{ 
              fontSize: fonts.title, 
              fontWeight: 'bold', 
              color: '#1A1A1A',
              marginBottom: 2
            }}>
              6,650
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>steps</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          {/* Water Intake Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWaterIntake}
            accessibilityRole="button"
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: scaleWidth(16),
              padding: spacing.md,
              marginRight: spacing.xs,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
              position: 'relative',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Confetti animation when goal is reached */}
            {showConfetti && (
              <ConfettiCannon
                count={80}
                origin={{ x: 0, y: 0 }}
                fadeOut
                fallSpeed={2500}
                explosionSpeed={400}
                autoStart
                colors={['#4A90E2', '#42A5F5', '#34C759', '#FFD700', '#FF69B4']}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 10 }}
              />
            )}
            {/* Content overlay */}
            <View style={{ zIndex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ fontSize: fonts.small, color: '#8E8E93', fontWeight: '500' }}>Water Intake</Text>
              </View>
              <Text style={{ 
                fontSize: fonts.title, 
                fontWeight: 'bold', 
                color: '#4A90E2',
                marginBottom: 2
              }}>
                {waterOunces} oz
              </Text>
              <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>of {WATER_GOAL_OZ} oz</Text>
              {/* Simple progress bar */}
              <View style={{
                backgroundColor: '#F0F0F0',
                height: 6,
                borderRadius: 3,
                marginTop: spacing.sm,
                overflow: 'hidden'
              }}>
                <View style={{
                  backgroundColor: '#4A90E2',
                  height: 6,
                  borderRadius: 3,
                  width: `${(waterOunces / WATER_GOAL_OZ) * 100}%`
                }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Workouts Card */}
          <View style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: scaleWidth(16),
            padding: spacing.md,
            marginLeft: spacing.xs,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fonts.small, color: '#8E8E93', fontWeight: '500' }}>Workouts</Text>
            </View>
            <Text style={{ 
              fontSize: fonts.title, 
              fontWeight: 'bold', 
              color: '#1A1A1A',
              marginBottom: 2
            }}>
              6,650
            </Text>
            <Text style={{ fontSize: fonts.small, color: '#8E8E93' }}>steps</Text>
          </View>
        </View>

       

        
          

          
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
            backgroundColor: '#007AFF',
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}
          onPress={() => Alert.alert('Coming Soon!', 'Workout plans feature will be available soon!')}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Start Workout</Text>
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

  const renderCalories = () => (
    <ScrollView style={{ flex: 1, paddingHorizontal: responsivePadding.container, paddingVertical: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' }}>
        Calorie Tracker
      </Text>
      
      <View style={{
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
          Today's Intake
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#6C757D' }}>Consumed</Text>
          <Text style={{ fontWeight: '600', color: '#1A1A1A' }}>1,250 / 2,000 cal</Text>
        </View>
        <View style={{
          backgroundColor: '#E9ECEF',
          height: 8,
          borderRadius: 4,
          marginBottom: 16
        }}>
          <View style={{
            backgroundColor: '#34C759',
            height: 8,
            borderRadius: 4,
            width: '62%'
          }} />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            borderRadius: 8,
            padding: 12,
            alignItems: 'center'
          }}
          onPress={() => Alert.alert('Coming Soon!', 'Calorie tracking feature will be available soon!')}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Log Food</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#6C757D' }}>BMI</Text>
          <Text style={{ fontWeight: '600', color: getBMICategory(calculateBMI()).color }}>
            {calculateBMI()} ({getBMICategory(calculateBMI()).category})
          </Text>
        </View>
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

  // Add water intake handler for incrementing by 8oz, max 124oz
  const handleWaterIntake = () => {
    setWaterOunces(prev => {
      const next = Math.min(prev + WATER_INCREMENT_OZ, WATER_GOAL_OZ);
      if (prev < WATER_GOAL_OZ && next === WATER_GOAL_OZ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
        Alert.alert('Congratulations!', 'You reached your daily water goal! 🥳💧');
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <AnimatedBackground />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Personal Header */}
        <View style={styles.personalHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.userAvatar}
              onPress={() => setShowProfileModal(true)}
            >
              <Text style={styles.avatarText}>
                {user?.user_metadata?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>
                {getTimeBasedGreeting()}
              </Text>
              <Text style={styles.userNameLarge}>
                {user?.user_metadata?.first_name || 'User'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={{ alignItems: 'center' }}
              onPress={() => setShowLeaderboard(true)}
            >
              <Text style={[styles.rankingDisplay, { fontSize: fonts.small, marginBottom: 2 }]}>
                RANK
              </Text>
              <Text style={[styles.rankingDisplay, { fontSize: fonts.medium, fontWeight: 'bold' }]}>
                #{getUserRanking()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Workout Module - Updated to match card design */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: responsivePadding.container,
          marginVertical: spacing.xs,
          borderRadius: scaleWidth(16),
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          height: scaleHeight(60),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2
        }}>
          {/* Streak Section */}
          <View style={{
            alignItems: 'center',
            marginRight: spacing.sm,
            minWidth: scaleWidth(45)
          }}>
            
            <Text style={{
              color: '#8E8E93',
              fontSize: fonts.small
            }}>
              Day{currentStreak !== 1 ? 's' : ''}
            </Text>
            <Text style={{
              color: '#1A1A1A',
              fontSize: fonts.medium,
              fontWeight: 'bold'
            }}>
              {streakLoading ? '...' : currentStreak}
            </Text>
          </View>

          {/* Slide to Start Workout - Light Mode Design */}
          <View style={{
            flex: 1,
            marginLeft: spacing.xs
          }}>
            <View style={{
              backgroundColor: '#E9ECEF',
              borderRadius: scaleWidth(20),
              height: scaleWidth(36),
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              shadowColor: '#4A9EFF',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3
            }}>
              {/* Dynamic progress background that fills as user slides */}
              <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                backgroundColor: slideValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['rgba(74, 158, 255, 0.2)', 'rgba(52, 199, 89, 0.8)'],
                  extrapolate: 'clamp'
                }),
                width: slideValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp'
                }),
                borderRadius: scaleWidth(20)
              }} />
              
              {/* Motivational text that changes as user slides */}
              <Animated.Text style={{
                color: slideValue.interpolate({
                  inputRange: [0, 50, 100],
                  outputRange: ['#6C757D', '#495057', '#FFFFFF'],
                  extrapolate: 'clamp'
                }),
                textAlign: 'center',
                fontSize: fonts.small,
                fontWeight: '600',
                opacity: slideValue.interpolate({
                  inputRange: [0, 50, 100],
                  outputRange: [0.8, 0.9, 1],
                  extrapolate: 'clamp'
                }),
                transform: [{
                  scale: slideValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 1.05],
                    extrapolate: 'clamp'
                  })
                }],
                letterSpacing: 0.5
              }}>
                {slideValue._value > 75 ? "Start workout!" : slideValue._value > 25 ? "Keep Going!" : "Start workout!"}
              </Animated.Text>
              
              {/* The sliding button with dynamic colors and effects */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: slideValue,
                  top: scaleHeight(3),
                  width: scaleWidth(30),
                  height: scaleWidth(30),
                  backgroundColor: slideValue.interpolate({
                    inputRange: [0, 75, 100],
                    outputRange: ['#4A9EFF', '#FF9500', '#34C759'],
                    extrapolate: 'clamp'
                  }),
                  borderRadius: scaleWidth(15),
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: slideValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['#4A9EFF', '#34C759'],
                    extrapolate: 'clamp'
                  }),
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 8,
                  transform: [{
                    scale: slideValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: [1, 1.1],
                      extrapolate: 'clamp'
                    })
                  }],
                  overflow: 'hidden'
                }}
                {...panResponder.panHandlers}
              >
                {/* Animated dumbbells background */}
                <Animated.View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: slideValue.interpolate({
                    inputRange: [0, 50, 100],
                    outputRange: [0.3, 0.6, 0.9],
                    extrapolate: 'clamp'
                  }),
                  transform: [{
                    scale: slideValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0.8, 1.2],
                      extrapolate: 'clamp'
                    })
                  }, {
                    rotate: slideValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                      extrapolate: 'clamp'
                    })
                  }]
                }}>
                  <Text style={{
                    fontSize: scaleWidth(12),
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    🏋️
                  </Text>
                </Animated.View>
                
                {/* Dynamic icon that changes based on progress */}
                <Animated.View style={{
                  transform: [{
                    rotate: slideValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                      extrapolate: 'clamp'
                    })
                  }],
                  zIndex: 2
                }}>
                  <Text style={{
                    fontSize: scaleWidth(16),
                    color: '#FFFFFF',
                    fontWeight: 'bold'
                  }}>
                    {slideValue._value > 90 ? '✓' : slideValue._value > 50 ? '💪' : '>'}
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </View>
        
      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
      
      </View>
      
      {/* Profile Modal */}
      {renderProfileModal()}
      
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
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default memo(DashboardScreen);
