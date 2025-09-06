import 'react-native-reanimated';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Linking, View, StyleSheet } from 'react-native';
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

// Design System
import { configureDesignSystem } from './components/design/Theme';

// Import components
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import WorkingMinimalDashboard from './components/WorkingMinimalDashboard';
import WorkingMinimalWorkouts from './components/WorkingMinimalWorkouts';
import WorkingMinimalNutrition from './components/WorkingMinimalNutrition';
import WorkingMinimalAccount from './components/WorkingMinimalAccount';
import MinimalNavigation from './components/MinimalNavigation';
import LoadingScreen from './components/LoadingScreen';
import HealthServiceTest from './components/HealthServiceTest';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize design system
configureDesignSystem();

// Constants moved outside component to prevent recreation
const GENDER_OPTIONS = [
  'Male', 'Female', 'Trans', 'Fluid', 'Non-binary', 'Other', 'Prefer not to say'
];

function AppContent() {
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

  // Check authentication state on app load
  useEffect(() => {
    checkAuthState();
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        // User signed in
        setUser(session.user);
        setIsAuthenticated(true);
        setShowLanding(false);
        setShowLogin(false);
        setShowSignUp(false);
        
        // Set RevenueCat user ID for tracking
        await revenueCatService.setUserID(session.user.id);
        
        // Check if user needs onboarding
        const needsOnboarding = await checkIfUserNeedsOnboarding(session.user.id);
        setShowOnboarding(needsOnboarding);
        
        // Clear both loading states after onboarding check
        setLoading(false);
        setAuthLoading(false);
      } else {
        // User signed out - clear all user data
        console.log('🧹 User signed out - clearing user data');
        
        // Clear RevenueCat user data
        await revenueCatService.logout();
        
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

  const checkAuthState = async () => {
    setAuthLoading(true);
    try {
      // Initialize RevenueCat first with error handling
      try {
        await revenueCatService.initialize();
      } catch (rcError) {
        console.warn('RevenueCat initialization failed:', rcError);
        // Continue app initialization even if RevenueCat fails
      }
      
      const { data: { user } } = await authService.getCurrentUser();
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        setShowLanding(false);
        
        // Set RevenueCat user ID for tracking with error handling
        try {
          await revenueCatService.setUserID(user.id);
        } catch (rcError) {
          console.warn('RevenueCat user ID setting failed:', rcError);
          // Continue without blocking the app
        }
        
        // For existing users, check if they have completed onboarding
        const needsOnboarding = await checkIfUserNeedsOnboarding(user.id);
        setShowOnboarding(needsOnboarding);
      } else {
        // No user found, show landing
        setShowLanding(true);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't crash the app, show landing screen instead
      setShowLanding(true);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const checkIfUserNeedsOnboarding = async (userId) => {
    try {
      const { supabase } = await import('./supabaseConfig');
      
      // Fast query - only check if record exists
      const { data, error } = await supabase
        .from('user_fitness_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // 42P01 = Table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('user_fitness_profiles table does not exist. Please run the SQL script to create it.');
          return true; // Show onboarding since table doesn't exist
        }
        console.error('Error checking user profile:', error);
        return true; // Default to showing onboarding if error
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
      console.error('Error checking onboarding status:', error);
      return true; // Default to onboarding on error
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
        // Auth state listener will handle the rest
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
    const result = await authService.signIn(formData.email, formData.password);
    
    if (result.success) {
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
      // Auth state listener will handle the rest
    } else {
      setLoading(false);
      Alert.alert('Error', result.error);
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
        // Auth state listener will handle the rest
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
    if (showLanding) return 'Landing';
    if (showLogin) return 'Login';
    if (showSignUp) return 'SignUp';
    if (showOnboarding) return 'Onboarding';
    if (isAuthenticated && user && !showOnboarding && !authLoading && !loading) return 'Authenticated';
    return 'None';
  }, [showLanding, showLogin, showSignUp, showOnboarding, isAuthenticated, user, authLoading, loading]);

  const renderAuthenticatedScreen = () => {
    const commonProps = {
      user,
      onLogout: handleLogout,
      loading,
      styles,
    };

    switch (activeTab) {
      case 'home':
        return <WorkingMinimalDashboard {...commonProps} />;
      case 'workouts':
        return <WorkingMinimalWorkouts {...commonProps} />;
      case 'nutrition':
        return <WorkingMinimalNutrition {...commonProps} />;
      case 'account':
        return <WorkingMinimalAccount {...commonProps} />;
      case 'test':
        return <HealthServiceTest {...commonProps} />;
      default:
        return <WorkingMinimalDashboard {...commonProps} />;
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

  // Single loading screen for all loading states
  if (authLoading || loading) {
    const message = authLoading 
      ? 'Welcome to Core+...' 
      : isAuthenticated 
        ? 'Setting up your personalized experience...' 
        : 'Logging you in...';
    return <LoadingScreen styles={styles} message={message} />;
  }

  // Simple page transitions without animation
  return (
    <View style={{ flex: 1 }}>
      {route !== 'None' && renderRoute()}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProvider>
            <SubscriptionProvider>
              <DailyCaloriesProvider>
                <WorkoutSessionProvider>
                  <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
                    <AppContent />
                    <StatusBar style="auto" />
                  </SafeAreaView>
                </WorkoutSessionProvider>
              </DailyCaloriesProvider>
            </SubscriptionProvider>
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}