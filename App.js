// Production safety - must be first import
import './utils/productionSafe';

// Development testing imports
if (__DEV__) {
  import('./test_manual_meal_search');
} else {
  // Production debugging
  import('./debug_production_logs');
}

import 'react-native-reanimated';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Linking, View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { authService } from './authService';
import { socialAuthService } from './socialAuthService';
import { biometricService } from './biometricService';
import { revenueCatService } from './services/revenueCatService';
import { styles } from './styles/AppStyles';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { DailyCaloriesProvider } from './contexts/DailyCaloriesContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { WorkoutSessionProvider } from './contexts/WorkoutSessionContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Design System
import { configureDesignSystem } from './components/design/Theme';

// Import components - organized structure
import AuthScreen from './components/screens/auth/AuthScreen';
import OnboardingScreen from './components/screens/onboarding/OnboardingScreen';
import WorkingMinimalDashboard from './components/screens/main/WorkingMinimalDashboard';
import WorkingMinimalNutrition from './components/screens/main/WorkingMinimalNutrition';
import EnhancedNutrition from './components/EnhancedNutrition';
import WorkingMinimalAccount from './components/screens/main/WorkingMinimalAccount';
import MinimalNavigation from './components/screens/main/MinimalNavigation';
import LoadingScreen from './components/screens/main/LoadingScreen';
import ErrorBoundary from './components/screens/main/ErrorBoundary';

// Initialize design system
configureDesignSystem();

// Constants moved outside component to prevent recreation
const GENDER_OPTIONS = [
  'Male', 'Female', 'Trans', 'Fluid', 'Non-binary', 'Other', 'Prefer not to say'
];

function AppContent() {
  const { isDarkMode, colors } = useTheme();
  const {
    showLanding,
    showLogin,
    showSignUp,
    showOnboarding,
    onboardingStep,
    showDatePicker,
    showHeightPicker,
    showWeightPicker,
    isAuthenticated,
    user,
    loading,
    authLoading,
    count,
    activeTab,
    formData,
    onboardingData,
    mainGoals,
    activityOptions,
    // Actions from context
    handleGetStarted,
    handleSwitchToLogin,
    handleSwitchToSignUp,
    handleBackToLanding,
    setShowDatePicker,
    setShowHeightPicker,
    setShowWeightPicker,
    nextOnboardingStep,
    prevOnboardingStep,
    selectGoal,
    toggleActivity,
    selectDate,
    selectHeight,
    selectWeight,
    setUser,
    setIsAuthenticated,
    setAuthLoading,
    setLoading,
    setShowOnboarding,
    setShowLanding,
    setShowLogin,
    setShowSignUp,
    setFormData,
    setOnboardingData,
    setCount,
    updateFormData,
    setActiveTab
  } = useAppContext();

  // Loading state monitor - logs every 5 seconds during loading with emergency timeout
  useEffect(() => {
    let loadingMonitor;
    let emergencyTimeout;
    
    if (authLoading || loading) {
      console.log('⏱️ Loading state monitor started');
      const startTime = Date.now();
      
      loadingMonitor = setInterval(() => {
        const duration = Date.now() - startTime;
        console.log('⏱️ Still loading...', {
          authLoading,
          loading,
          isAuthenticated,
          user: user?.id || 'none',
          showOnboarding,
          showLanding,
          showLogin,
          showSignUp,
          duration
        });
        
        // Emergency timeout after 2 minutes of loading
        if (duration > 120000 && isAuthenticated && !authLoading) {
          console.warn('🚨 EMERGENCY: Loading stuck for >2min, forcing completion');
          setLoading(false);
          clearInterval(loadingMonitor);
        }
      }, 5000);
      
      // Additional emergency timeout after 3 minutes total
      emergencyTimeout = setTimeout(() => {
        console.error('🚨 CRITICAL: App stuck loading for >3min, forcing reset');
        setLoading(false);
        setAuthLoading(false);
      }, 180000);
      
    } else {
      if (loadingMonitor) {
        console.log('⏱️ Loading state monitor stopped - loading complete');
        clearInterval(loadingMonitor);
      }
    }

    return () => {
      if (loadingMonitor) {
        clearInterval(loadingMonitor);
      }
      if (emergencyTimeout) {
        clearTimeout(emergencyTimeout);
      }
    };
  }, [authLoading, loading, isAuthenticated, user, showOnboarding, showLanding]);

  // Check authentication state on app load
  useEffect(() => {
    window.loadingStartTime = Date.now(); // Track loading start time
    checkAuthState();
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('🔐 🔄 Auth state change detected:', event, session?.user?.id);
      console.log('🔐 🔄 Current loading state:', { authLoading, loading });
      
      if (session?.user) {
        console.log('🔐 ✅ User signed in via auth state change');
        // User signed in - save session data
        console.log('👤 User signed in, saving session');
        console.log('👤 Session user ID:', session.user.id);
        console.log('👤 Session user email:', session.user.email);
        
        setUser(session.user);
        setIsAuthenticated(true);
        setShowLanding(false);
        setShowLogin(false);
        setShowSignUp(false);
        
        // Initialize RevenueCat and user subscription service for this user
        try {
          await revenueCatService.setUserID(session.user.id);
          
          // Initialize user subscription service for proper syncing
          const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
          await userSubscriptionService.initializeForUser(session.user);
          
        } catch (rcError) {
          // Don't fail the login process if RevenueCat fails
        }
        
        // Check if user needs onboarding with error handling
        try {
          const needsOnboarding = await checkIfUserNeedsOnboarding(session.user.id);
          setShowOnboarding(needsOnboarding);
        } catch (onboardingError) {
          console.warn('⚠️ Onboarding check failed, defaulting to dashboard:', onboardingError);
          setShowOnboarding(false); // Default to dashboard on error
        }
        
        // Clear both loading states after onboarding check
        setLoading(false);
        setAuthLoading(false);
      } else {
        // User signed out - clear all user data
        console.log('🧹 User signed out - clearing user data');
        
        // Clear RevenueCat user data
        try {
          await revenueCatService.logout();
        } catch (error) {
          // Continue logout process even if RevenueCat fails
        }
        
        // Clear caches to prevent data bleeding between users
        try {
          const { cacheManager } = await import('./services/cacheManager');
          await cacheManager.clearSessionData();
        } catch (error) {
          console.error('Error clearing session data:', error);
        }
        
        setUser(null);
        setIsAuthenticated(false);
        setShowLanding(true);
        setShowOnboarding(false);
        // Clear loading states
        setAuthLoading(false);
        setLoading(false);
      }
    });

    // Handle OAuth callback from social logins
    const handleUrl = async (event) => {
      if (event.url.includes('auth/callback')) {
        const result = await socialAuthService.handleOAuthCallback(event.url);
        if (!result.success) {
          Alert.alert('Login Error', result.error);
        }
      }
    };

    const linkingSubscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription?.unsubscribe();
      linkingSubscription?.remove();
    };
  }, []);

  // Handle app state changes for better subscription flow
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App came back to foreground (potentially from purchase flow)
        // Refresh subscription status after a brief delay
        setTimeout(async () => {
          try {
            await revenueCatService.getCustomerInfo();
            // Force re-sync subscription status
            const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
            if (user?.id) {
              await userSubscriptionService.syncSubscriptionStatus();
            }
          } catch (error) {
            // Silent failure - don't log subscription refresh errors
          }
        }, 1000); // 1 second delay to allow app to stabilize
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user?.id]);

  const checkAuthState = async () => {
    const authStartTime = Date.now();
    console.log('🔄 Starting authentication check...');
    console.log('🔄 Current state:', {
      isAuthenticated,
      user: user?.id || 'none',
      showOnboarding,
      authLoading,
      loading
    });
    setAuthLoading(true);
    
    // Add overall timeout to prevent infinite loading
    let authTimeoutCleared = false;
    const authTimeout = setTimeout(() => {
      if (authTimeoutCleared) return; // Don't execute if already cleared
      
      console.error('⏰ AUTHENTICATION TIMEOUT - Force completing auth after 60 seconds');
      console.log('⏰ Current auth state at timeout:', { isAuthenticated, user: user?.id || 'none' });
      
      setAuthLoading(false);
      setLoading(false);
      // Only show landing if we're still not authenticated
      if (!isAuthenticated) {
        console.log('⏰ No authentication found, showing landing screen');
        setShowLanding(true);
        setIsAuthenticated(false);
      } else {
        console.log('⏰ User is authenticated, keeping current state');
      }
    }, 60000); // Increased to 60 seconds
    
    try {
      // Use enhanced session initialization FIRST
      console.log('🔐 [STEP 1/3] Checking authentication session...');
      const sessionStartTime = Date.now();
      
      // Add timeout for session check (increased for better reliability)
      const sessionPromise = authService.initializeSession();
      const sessionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session initialization timeout')), 30000)
      );
      
      const sessionResult = await Promise.race([sessionPromise, sessionTimeoutPromise]);
      console.log(`🔐 ✅ Session check completed in ${Date.now() - sessionStartTime}ms`);
      
      if (sessionResult.success && sessionResult.user) {
        console.log('✅ User session restored:', sessionResult.restored ? 'from storage' : 'from server');
        console.log('✅ User ID:', sessionResult.user.id);
        
        console.log('🔐 [STEP 2/3] Setting user state...');
        setUser(sessionResult.user);
        setIsAuthenticated(true);
        setShowLanding(false);
        
        // For existing users, check if they have completed onboarding
        console.log('🎯 [STEP 3/3] Checking onboarding status...');
        const onboardingStartTime = Date.now();
        
        // Add timeout for onboarding check (increased to 20s)
        const onboardingPromise = checkIfUserNeedsOnboarding(sessionResult.user.id);
        const onboardingTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Onboarding check timeout')), 20000)
        );
        
        try {
          const needsOnboarding = await Promise.race([onboardingPromise, onboardingTimeoutPromise]);
          console.log(`🎯 ✅ Onboarding check completed in ${Date.now() - onboardingStartTime}ms`);
          console.log(`🎯 Needs onboarding:`, needsOnboarding);
          setShowOnboarding(needsOnboarding);
        } catch (onboardingError) {
          console.error('❌ Onboarding check failed:', onboardingError.message);
          console.log('🎯 Defaulting to no onboarding needed');
          setShowOnboarding(false); // Default to false if check fails
        }
        
        // Initialize RevenueCat AFTER auth is complete and in background
        setTimeout(async () => {
          try {
            console.log('🔄 Initializing RevenueCat in background...');
            await revenueCatService.initialize();
            await revenueCatService.setUserID(sessionResult.user.id);
            console.log('✅ RevenueCat initialized successfully in background');
          } catch (rcError) {
            console.warn('⚠️ RevenueCat initialization failed (non-blocking):', rcError.message);
            // Continue app functionality even if RevenueCat fails
          }
        }, 1000); // 1 second delay to not block auth
        
      } else {
        // No user found, show landing
        console.log('🚫 No user session found, showing landing screen');
        setShowLanding(true);
        setShowOnboarding(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Authentication check error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      // Don't crash the app, show landing screen instead
      setShowLanding(true);
      setIsAuthenticated(false);
    } finally {
      authTimeoutCleared = true; // Mark as cleared
      clearTimeout(authTimeout); // Clear the timeout if we complete normally
      setAuthLoading(false);
      setLoading(false); // ✅ Clear main loading state after authentication completes
      console.log(`✅ AUTHENTICATION COMPLETE - Total time: ${Date.now() - authStartTime}ms`);
      console.log('✅ Final state:', {
        isAuthenticated,
        user: user?.id || 'none',
        showOnboarding,
        showLanding,
        loading: false
      });
    }
  };

  const checkIfUserNeedsOnboarding = async (userId) => {
    try {
      // Try to import supabase configuration
      const { supabase } = await import('./supabaseConfig');
      
      // Check if supabase is properly configured before making queries
      if (!supabase || !process.env.EXPO_PUBLIC_SUPABASE_URL) {
        console.warn('⚠️ Supabase not configured, skipping onboarding check - user can access app');
        return false; // Allow user to access app without onboarding check
      }
      
      // Fast query - only check if record exists
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // Handle specific database errors
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('user_fitness_profiles table does not exist. User can access app.');
          return false; // Allow access without onboarding check if table doesn't exist
        }
        
        // Handle connection errors
        if (error.message?.includes('supabaseUrl is required') || error.message?.includes('fetch')) {
          console.warn('⚠️ Database connection issue, allowing user access');
          return false; // Allow access on connection issues
        }
        
        console.error('Database error during onboarding check:', error);
        return false; // Default to allowing access on database errors
      }
      
      // If data exists, user has completed onboarding
      const hasProfile = !!data;
      
      if (hasProfile) {
        console.log('✅ User has fitness profile, going to dashboard');
        return false; // No onboarding needed
      } else {
        console.log('📝 User needs onboarding');
        return true; // Show onboarding
      }
    } catch (error) {
      // Handle any other errors (like import failures, network issues)
      console.warn('⚠️ Error checking onboarding status, allowing user access:', error.message);
      return false; // Default to allowing access on any error
    }
  };

  const calculateBMI = (heightInches, weightPounds) => {
    // BMI = (weight in pounds / (height in inches)²) × 703
    const bmi = (weightPounds / (heightInches * heightInches)) * 703;
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  };

  const getBMICategory = (bmi, age) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3182ce', advice: 'Consider gaining weight through healthy eating and exercise.' };
    if (bmi < 25) return { category: 'Normal weight', color: '#38a169', advice: 'Great! Maintain your current healthy weight.' };
    if (bmi < 30) return { category: 'Overweight', color: '#d69e2e', advice: 'Consider losing weight through diet and exercise.' };
    return { category: 'Obese', color: '#e53e3e', advice: 'Consult with a healthcare provider about weight management.' };
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid date format:', dateOfBirth);
      return 0;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format for display:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const convertHeightToInches = (feet, inches) => {
    return (parseInt(feet) || 0) * 12 + (parseInt(inches) || 0);
  };

  const formatHeightDisplay = (feet, inches) => {
    if (!feet && !inches) return 'Select height';
    return `${feet || 0}' ${inches || 0}"`;
  };

  const handleGenderSelect = (selectedGender) => {
    updateFormData({ gender: selectedGender });
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    
    try {
      // Calculate BMI and age
      const heightInches = convertHeightToInches(onboardingData.heightFeet, onboardingData.heightInches);
      const weightPounds = parseFloat(onboardingData.weight);
      const age = calculateAge(onboardingData.dateOfBirth);
      const bmi = calculateBMI(heightInches, weightPounds);
      const bmiInfo = getBMICategory(bmi, age);
      
      // Prepare the data for insertion
      const profileData = {
        id: user.id,
        main_goal: onboardingData.mainGoal,
        activities: onboardingData.activities || [], // Ensure it's an array
        date_of_birth: onboardingData.dateOfBirth,
        age: age, // Include calculated age
        height_inches: heightInches,
        weight_pounds: weightPounds,
        goal_weight_pounds: parseFloat(onboardingData.goalWeight) || weightPounds, // Default to current weight if not set
        bmi: bmi, // Include calculated BMI
        created_at: new Date().toISOString()
      };
      
      console.log('Saving fitness profile:', profileData);
      
      // Save to Supabase
      const { supabase } = await import('./supabaseConfig');
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .insert(profileData)
        .select(); // Return the inserted data
      
      if (error) {
        console.error('Error saving fitness profile:', error);
        Alert.alert('Error', `Failed to save your fitness profile: ${error.message}`);
        setLoading(false);
        return;
      }
      
      console.log('Fitness profile saved successfully:', data);

      // Record affiliate code usage if provided
      if (onboardingData.affiliateCode && onboardingData.affiliateCode.trim() !== '') {
        try {
          console.log('🎯 Recording affiliate code usage:', onboardingData.affiliateCode);
          const { affiliateService } = await import('./services/affiliateService');
          const affiliateResult = await affiliateService.recordAffiliateUsage(
            user.id, 
            onboardingData.affiliateCode
          );
          
          if (affiliateResult.success) {
            console.log('✅ Affiliate code recorded successfully');
          } else {
            console.warn('⚠️ Failed to record affiliate code:', affiliateResult.error);
            // Don't stop onboarding for affiliate code issues
          }
        } catch (affiliateError) {
          console.error('Error recording affiliate code:', affiliateError);
          // Don't stop onboarding for affiliate code issues
        }
      }

      // Generate an initial adaptive workout plan for the user
      try {
        const { planService } = await import('./services/planService');
        const profileForPlan = {
          goal: onboardingData.mainGoal,
          experience: onboardingData.experience || 'beginner',
          daysAvailablePerWeek: onboardingData.daysPerWeek || 3,
          sessionLengthMinutes: onboardingData.sessionLength || 30,
          preferredSplit: onboardingData.preferredSplit || 'auto',
          equipment: onboardingData.equipment || []
        };

        const planResult = await planService.generatePlanForUser(user.id, profileForPlan);
        if (planResult.success) {
          console.log('Generated workout plan for user:', planResult.planId);
        } else {
          console.warn('Plan generation failed:', planResult.error);
        }
      } catch (planError) {
        console.error('Error generating plan:', planError);
      }

      // Smooth transition to dashboard - use context setters
      setShowOnboarding(false);
      setShowLanding(false); // Ensure landing screen is hidden
      setLoading(false);
      
      // Force a re-check of onboarding status to ensure proper navigation
      setTimeout(async () => {
        const stillNeedsOnboarding = await checkIfUserNeedsOnboarding(user.id);
        if (stillNeedsOnboarding) {
          console.warn('User still needs onboarding after completion - there may be a database issue');
        } else {
          console.log('✅ Onboarding completed successfully - user should see dashboard');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', `Something went wrong: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const missingFields = [];
    if (!formData.email) missingFields.push('Email');
    if (!formData.password) missingFields.push('Password');
    if (!formData.firstName) missingFields.push('Name');
    
    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('Starting sign-up with:', {
      email: formData.email,
      firstName: formData.firstName,
      gender: formData.gender
    });

    // Store email and password before clearing form data
    const signupEmail = formData.email;
    const signupPassword = formData.password;

    setLoading(true);
    const result = await authService.signUp(
      formData.email, 
      formData.password, 
      formData.firstName, 
      formData.gender
    );

    console.log('Sign-up result:', result);

    if (result.success) {
      // Clear form data
      setFormData({
        phone: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: ''
      });
      
      // Auto-login the user after successful signup using stored credentials
      console.log('Auto-logging in user after signup...');
      const loginResult = await authService.signIn(signupEmail, signupPassword);
      
      if (loginResult.success) {
        console.log('Auto-login successful, user will be redirected to onboarding');
        
        // Auth state listener will handle RevenueCat user ID setting
        console.log('🔗 Auth state listener will handle RevenueCat initialization for:', loginResult.data?.user?.id);
      } else {
        console.error('Auto-login failed:', loginResult.error);
        setLoading(false);
        Alert.alert(
          'Account Created', 
          'Your account was created successfully, but there was an issue logging you in automatically. Please log in manually.',
          [{ text: 'OK', onPress: () => setShowLogin(true) }]
        );
      }
    } else {
      Alert.alert('Sign Up Failed', result.error || 'Please try again');
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signIn(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login successful for:', result.data?.user?.id);
        
        // Ask user if they want to enable biometric login
        await promptBiometricSetup(formData.email, formData.password);
        
        // Clear form data
        setFormData({
          phone: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          gender: ''
        });
        
        // Auth state listener will handle the rest, but clear loading here too
        // in case there's a delay in the auth state listener
        setLoading(false);
        console.log('🔗 Auth state listener will handle RevenueCat initialization for:', result.data?.user?.id);
      } else {
        setLoading(false);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const promptBiometricSetup = async (email, password) => {
    try {
      const biometricInfo = await biometricService.getBiometricInfo();
      
      // Only prompt if biometrics are available but not yet enabled
      if (biometricInfo.isAvailable && !biometricInfo.isEnabled) {
        Alert.alert(
          `Enable ${biometricInfo.biometricType} Login?`,
          `Would you like to use ${biometricInfo.biometricType} for faster login next time?`,
          [
            {
              text: 'Not Now',
              style: 'cancel'
            },
            {
              text: 'Enable',
              onPress: async () => {
                const result = await biometricService.enableBiometricLogin(email, password);
                if (result.success) {
                  Alert.alert(
                    'Success!', 
                    `${result.biometricType} login has been enabled. You can now sign in quickly using biometrics.`
                  );
                } else {
                  console.error('Failed to enable biometric login:', result.error);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in biometric setup prompt:', error);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    
    try {
      const credentialsResult = await biometricService.getBiometricCredentials();
      
      if (!credentialsResult.success) {
        setLoading(false);
        Alert.alert('Error', credentialsResult.error);
        return;
      }

      // Sign in with retrieved credentials
      const loginResult = await authService.signIn(
        credentialsResult.credentials.email, 
        credentialsResult.credentials.password
      );
      
      if (loginResult.success) {
        // Auth state listener will handle RevenueCat user ID setting
        console.log('🔗 Auth state listener will handle RevenueCat initialization for:', loginResult.data?.user?.id);
      } else {
        setLoading(false);
        Alert.alert('Login Failed', loginResult.error);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Biometric login failed. Please try again.');
      console.error('Biometric login error:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const result = await authService.signOut();
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  const handleSocialLogin = async (provider) => {
    console.log(`Starting ${provider} login...`);
    setLoading(true);
    let result;
    
    try {
      switch (provider) {
        case 'google':
          console.log('Calling Google OAuth...');
          result = await socialAuthService.signInWithGoogle();
          break;
        case 'apple':
          console.log('Calling Apple OAuth...');
          result = await socialAuthService.signInWithApple();
          break;
        case 'github':
          console.log('Calling GitHub OAuth...');
          result = await socialAuthService.signInWithGitHub();
          break;
      }
      
      console.log(`${provider} login result:`, result);
      
      if (!result.success) {
        console.error(`${provider} login error:`, result.error);
        Alert.alert('Social Login Error', result.error);
        setLoading(false);
      } else {
        console.log(`${provider} login successful!`);
        // Auth state listener will handle the rest
      }
    } catch (error) {
      console.error(`${provider} login exception:`, error);
      Alert.alert('Social Login Error', error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Determine current route key for transitions
  const route = useMemo(() => {
    console.log('🔍 Route determination:', {
      showLanding,
      showLogin,
      showSignUp,
      showOnboarding,
      isAuthenticated,
      hasUser: !!user,
      authLoading,
      loading
    });
    
    if (showLanding) return 'Landing';
    if (showLogin) return 'Login';
    if (showSignUp) return 'SignUp';
    if (showOnboarding) return 'Onboarding';
    if (isAuthenticated && user && !showOnboarding && !authLoading && !loading) {
      console.log('✅ Route: Authenticated');
      return 'Authenticated';
    }
    console.log('⏳ Route: None (showing loading)');
    return 'None';
  }, [showLanding, showLogin, showSignUp, showOnboarding, isAuthenticated, user, authLoading, loading]);

  // Determine safe area edges based on route
  function getSafeAreaEdges() {
    // For landing screen, exclude top edge to allow full-screen video
    if (route === 'Landing') {
      return ['bottom', 'left', 'right'];
    }
    // For all other screens, include all edges
    return ['top', 'bottom', 'left', 'right'];
  }

  // Determine status bar style based on route and theme
  function getStatusBarStyle() {
    // For landing screen with video background, use light style
    if (route === 'Landing') {
      return 'light';
    }
    // Use theme-appropriate status bar style
    return isDarkMode ? 'light' : 'dark';
  }

  const renderAuthenticatedScreen = () => {
    switch (activeTab) {
      case 'home':
        return <WorkingMinimalDashboard user={user} onLogout={handleLogout} loading={loading} styles={styles} />;
      case 'nutrition':
        return <EnhancedNutrition user={user} loading={loading} styles={styles} />;
      case 'account':
        return <WorkingMinimalAccount user={user} onLogout={handleLogout} loading={loading} styles={styles} />;
      default:
        return null;
    }
  };

  const renderRoute = () => {
    switch (route) {
      case 'Landing':
      case 'SignUp':
      case 'Login':
        return (
          <AuthScreen
            loading={loading}
            styles={styles}
            // Landing props
            onGetStarted={handleGetStarted}
            // Login props
            onLogin={handleLogin}
            onBiometricLogin={handleBiometricLogin}
            // SignUp props
            onSignUp={handleSignUp}
            genderOptions={GENDER_OPTIONS}
            onGenderSelect={handleGenderSelect}
            // Social auth
            onSocialLogin={handleSocialLogin}
          />
        );
      case 'Onboarding':
        return (
          <OnboardingScreen
            onboardingStep={onboardingStep}
            showDatePicker={showDatePicker}
            showHeightPicker={showHeightPicker}
            showWeightPicker={showWeightPicker}
            loading={loading}
            onCompleteOnboarding={handleCompleteOnboarding}
            formatDateForDisplay={formatDateForDisplay}
            formatHeightDisplay={formatHeightDisplay}
            mainGoals={mainGoals}
            activityOptions={activityOptions}
            styles={styles}
          />
        );
      case 'Dashboard':
        return (
          <WorkingMinimalDashboard
            user={user}
            onLogout={handleLogout}
            loading={loading}
            styles={styles}
          />
        );
      case 'Authenticated':
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {renderAuthenticatedScreen()}
            </View>
            <MinimalNavigation
              activeTab={activeTab}
              onTabPress={setActiveTab}
            />
          </View>
        );
      default:
        return null;
    }
  };

  // Force exit handler for stuck loading
  const handleForceExit = () => {
    console.log('🚨 FORCE EXIT - User manually exited loading screen');
    console.log('🚨 Current state:', {
      authLoading,
      loading,
      isAuthenticated,
      user: user?.id || 'none',
      showOnboarding,
      showLanding
    });
    
    // Force reset to landing screen
    setAuthLoading(false);
    setLoading(false);
    setShowLanding(true);
    setIsAuthenticated(false);
    setUser(null);
    setShowOnboarding(false);
  };

  // Single loading screen for all loading states
  if (authLoading || loading) {
    const message = authLoading 
      ? 'Welcome to Core+...' 
      : isAuthenticated 
        ? 'Setting up your personalized experience...' 
        : 'Logging you in...';
    return <LoadingScreen styles={styles} message={message} onForceExit={handleForceExit} />;
  }

  // Simple page transitions without animation
  return (
    <SafeAreaView style={{ flex: 1 }} edges={getSafeAreaEdges()}>
      <View style={{ flex: 1 }}>
        {route !== 'None' && renderRoute()}
      </View>
      <StatusBar style={getStatusBarStyle()} backgroundColor="transparent" translucent />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppProvider>
              <SubscriptionProvider>
                <DailyCaloriesProvider>
                  <WorkoutSessionProvider>
                    <AppContent />
                  </WorkoutSessionProvider>
                </DailyCaloriesProvider>
              </SubscriptionProvider>
            </AppProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}