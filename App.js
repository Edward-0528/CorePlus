// Production safety - must be first import
import './utils/productionSafe';

// Development testing imports - use require to avoid Metro bundler issues
if (__DEV__) {
  try {
    require('./test_manual_meal_search');
  } catch (e) {
    console.warn('Dev import failed:', e);
  }
} else {
  try {
    require('./debug_production_logs');
  } catch (e) {
    console.warn('Production debug import failed:', e);
  }
}

import 'react-native-reanimated';
import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Linking, View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
import { socialAuthService } from './socialAuthService';
import { biometricService } from './biometricService';
import { revenueCatService } from './services/revenueCatService';
import quickLoginService from './services/quickLoginService';
import { styles } from './styles/AppStyles';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { DailyCaloriesProvider } from './contexts/DailyCaloriesContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { WorkoutSessionProvider } from './contexts/WorkoutSessionContext';

// Design System
import { configureDesignSystem } from './components/design/Theme';

// Import components - organized structure
import AuthScreen from './components/screens/auth/AuthScreen';
import WorkingMinimalDashboard from './components/screens/main/WorkingMinimalDashboard';
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
  const {
    showLanding,
    showLogin,
    showSignUp,
    isAuthenticated,
    user,
    loading,
    authLoading,
    count,
    activeTab,
    formData,
    // Actions from context
    handleGetStarted,
    handleSwitchToLogin,
    handleSwitchToSignUp,
    handleSwitchToQuickLogin,
    handleBackToLanding,
    setUser,
    setIsAuthenticated,
    setAuthLoading,
    setLoading,
    setShowLanding,
    setShowLogin,
    setShowSignUp,
    setFormData,
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
  }, [authLoading, loading, isAuthenticated, user, showLanding]);

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
        
        // Initialize RevenueCat once per user session (non-blocking)
        try {
          console.log('🔄 Setting up subscription service for user:', session.user.id);
          
          // Initialize RevenueCat only once per app launch
          const initResult = await revenueCatService.initialize();
          if (initResult.success) {
            // Set user ID only once per user session
            await revenueCatService.setUserID(session.user.id);
            console.log('✅ RevenueCat user ID set for session');
            
            // Initialize user subscription service (no duplicate RevenueCat calls)
            const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
            await userSubscriptionService.initializeForUser(session.user);
          } else {
            console.log('ℹ️ RevenueCat running in fallback mode (Expo Go)');
          }
          
        } catch (rcError) {
          console.warn('⚠️ RevenueCat setup failed, but continuing login:', rcError.message);
          // Don't fail the login process if RevenueCat fails
        }
        
        // Clear both loading states
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
        
        // CRITICAL FIX: Don't automatically set showLanding(true) for signed out users
        // Let checkAuthState handle the returning user detection instead
        console.log('🔄 User signed out - checking if this is a returning user before setting landing');
        
        // Check if this is a returning user before defaulting to landing page
        try {
          const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
          if (hasLoggedInBefore) {
            console.log('🔄 Signed out returning user - setting login screen');
            setShowLanding(false);
            setShowLogin(true);
          } else {
            setShowLanding(true);
          }
        } catch (error) {
          console.warn('⚠️ Could not check returning user status on signout, defaulting to landing');
          setShowLanding(true);
        }
        
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
      // Only handle app state for auth service, not RevenueCat
      // RevenueCat should only refresh after actual purchases
    };    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user?.id]);

  const checkAuthState = async () => {
    const authStartTime = Date.now();
    console.log('🔄 Starting authentication check...');
    console.log('🔄 Current state:', {
      isAuthenticated,
      user: user?.id || 'none',
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
      // Enhanced session initialization with automatic retry for expired tokens
      console.log('🔐 [STEP 1/3] Checking authentication session...');
      const sessionStartTime = Date.now();
      
      let sessionResult = null;
      let retryCount = 0;
      const maxRetries = 2; // Allow up to 2 retries
      
      while (retryCount <= maxRetries && !sessionResult?.success) {
        if (retryCount > 0) {
          console.log(`🔄 Authentication retry attempt ${retryCount}/${maxRetries} (expired token handling)...`);
          // Wait 3 seconds before retry as requested
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        try {
          // Use the improved session restoration method
          sessionResult = await authService.restoreSession();
          
          if (sessionResult.success && sessionResult.user) {
            console.log(`✅ Session restored successfully on attempt ${retryCount + 1}`);
            break;
          } else if (sessionResult.error && (
            sessionResult.error.includes('expired') || 
            sessionResult.error.includes('invalid') ||
            sessionResult.error.includes('token')
          )) {
            console.log('🔄 Token expired/invalid, attempting automatic retry...');
            retryCount++;
            sessionResult = null; // Reset to trigger retry
          } else {
            // Non-expiry error, don't retry
            break;
          }
        } catch (sessionError) {
          console.log(`❌ Session attempt ${retryCount + 1} failed:`, sessionError.message);
          if (sessionError.message.includes('timeout') || 
              sessionError.message.includes('expired') ||
              sessionError.message.includes('network') ||
              sessionError.message.includes('failed to fetch')) {
            retryCount++;
            sessionResult = null; // Reset to trigger retry
          } else {
            // Non-retryable error, don't retry
            sessionResult = { success: false, error: sessionError.message };
            break;
          }
        }
      }
      
      console.log(`🔐 ✅ Session check completed in ${Date.now() - sessionStartTime}ms after ${retryCount + 1} attempts`);
      
      if (sessionResult?.success && sessionResult.user) {
        console.log('✅ User session restored:', sessionResult.restored ? 'from storage' : 'from server');
        console.log('✅ User ID:', sessionResult.user.id);
        
        console.log('🔐 [STEP 2/3] Setting user state...');
        setUser(sessionResult.user);
        setIsAuthenticated(true);
        setShowLanding(false);
        
        // RevenueCat is already initialized during user sign-in above
        // No need for duplicate background initialization
        
      } else {
        // No user session found, prioritize biometric auto-login for fastest UX
        console.log('📱 No user session found, checking biometric and returning user status...');
        
        try {
          // First check if biometric login is available and enabled for automatic login
          const { biometricService } = await import('./biometricService');
          const isBiometricEnabled = await biometricService.isBiometricLoginEnabled();
          const biometricAvailability = await biometricService.isAvailable();
          
          console.log('🔐 Biometric login check:', {
            isBiometricEnabled,
            isAvailable: biometricAvailability.isAvailable,
            biometricType: biometricAvailability.biometricType
          });
          
          if (isBiometricEnabled && biometricAvailability.isAvailable) {
            // Automatically trigger biometric login for faster authentication
            console.log('🚀 Auto-triggering biometric login for faster access...');
            
            // Set loading state temporarily during auto-biometric
            setLoading(true);
            
            // Delay slightly to ensure UI is ready, then trigger biometric
            setTimeout(async () => {
              try {
                await handleBiometricLogin();
              } catch (biometricError) {
                console.warn('⚠️ Auto-biometric login failed, falling back to login screen:', biometricError.message);
                // Fall back to login screen if auto-biometric fails
                setLoading(false);
                setShowLanding(false);
                setShowLogin(true);
                setIsAuthenticated(false);
              }
            }, 500);
            
            return; // Exit early since biometric login is handling authentication
          }
          
          // Check if user has logged in before (fallback for non-biometric users)
          const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
          const savedEmail = await AsyncStorage.getItem('lastLoginEmail');
          
          console.log('🔍 ENHANCED Returning user check:', {
            hasLoggedInBefore_raw: hasLoggedInBefore,
            hasLoggedInBefore_type: typeof hasLoggedInBefore,
            hasLoggedInBefore_boolean: !!hasLoggedInBefore,
            savedEmail_raw: savedEmail,
            savedEmail_type: typeof savedEmail,
            hasSavedEmail: !!savedEmail,
            shouldSkipLanding: !!hasLoggedInBefore
          });
          
          if (hasLoggedInBefore) {
            // Skip landing page for returning users - go straight to quick login
            console.log('� Returning user detected, showing quick login screen');
            setShowLanding(false);
            setShowLogin(true); // This will trigger the QuickLoginScreen logic
            setIsAuthenticated(false);
          } else {
            // New user, show landing screen
            console.log('👋 New user detected, showing landing screen');
            setShowLanding(true);
            setIsAuthenticated(false);
          }
        } catch (storageError) {
          console.warn('⚠️ Could not check returning user status:', storageError.message);
          // Fallback to landing screen
          console.log('📱 Falling back to landing screen');
          setShowLanding(true);
          setIsAuthenticated(false);
        }
        
        // Additional check: Log final state after returning user logic
        setTimeout(() => {
          console.log('✅ Authentication complete - final state:', {
            showLogin,
            showLanding,
            isAuthenticated
          });
        }, 200);
        
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
        showLanding,
        loading: false
      });
    }
  };

  // Function removed - onboarding eliminated to reduce user friction

  // Helper functions removed - only used for onboarding which has been eliminated

  const handleGenderSelect = (selectedGender) => {
    updateFormData({ gender: selectedGender });
  };

  // Function removed - onboarding eliminated to reduce user friction

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
        
        // Mark user as returning user for future app launches
        try {
          await AsyncStorage.setItem('hasLoggedInBefore', 'true');
          await AsyncStorage.setItem('lastLoginEmail', signupEmail);
          console.log('💾 New user marked as returning user after signup');
        } catch (storageError) {
          console.warn('⚠️ Failed to mark returning user after signup:', storageError.message);
        }
        
        // Save email for next time and offer biometric setup
        try {
          await quickLoginService.saveLoginPreferences(signupEmail, signupPassword, false, true);
          await promptBiometricSetup(signupEmail, signupPassword);
        } catch (prefError) {
          console.warn('⚠️ Failed to save login preferences:', prefError.message);
        }
        
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
        
        // Mark user as returning user for future app launches
        try {
          await AsyncStorage.setItem('hasLoggedInBefore', 'true');
          await AsyncStorage.setItem('lastLoginEmail', formData.email);
          console.log('💾 User marked as returning user');
        } catch (storageError) {
          console.warn('⚠️ Failed to mark returning user:', storageError.message);
        }
        
        // Save email for next time and offer biometric setup
        try {
          await quickLoginService.saveLoginPreferences(formData.email, formData.password, false, true);
          // Only prompt biometric on first successful login
          const loginPrefs = await quickLoginService.getLoginPreferences();
          if (!loginPrefs.biometricEnabled) {
            await promptBiometricSetup(formData.email, formData.password);
          }
        } catch (prefError) {
          console.warn('⚠️ Failed to save login preferences:', prefError.message);
        }
        
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
                  // Update quick login preferences to enable biometric
                  try {
                    await quickLoginService.saveLoginPreferences(email, password, true, true);
                    console.log('💾 Updated quick login preferences with biometric enabled and stay logged in');
                  } catch (prefError) {
                    console.warn('⚠️ Failed to update biometric preference:', prefError.message);
                  }
                  
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
        
        // Mark user as returning user for future app launches (biometric login)
        try {
          await AsyncStorage.setItem('hasLoggedInBefore', 'true');
          await AsyncStorage.setItem('lastLoginEmail', credentialsResult.credentials.email);
          console.log('💾 User marked as returning user (biometric login)');
        } catch (storageError) {
          console.warn('⚠️ Failed to mark returning user after biometric login:', storageError.message);
        }
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
    
    try {
      // Simple logout - no dialog, just sign out
      console.log('👋 Signing out user...');
      const result = await authService.signOut();
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to sign out');
      } else {
        console.log('✅ User signed out successfully');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Error', 'Something went wrong during sign out');
    } finally {
      setLoading(false);
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
        
        // Save social login email for next time
        if (result.data?.user?.email) {
          try {
            await quickLoginService.saveLoginPreferences(result.data.user.email, null, false, true);
            
            // Mark user as returning user for future app launches (social login)
            await AsyncStorage.setItem('hasLoggedInBefore', 'true');
            await AsyncStorage.setItem('lastLoginEmail', result.data.user.email);
            console.log('💾 User marked as returning user (social login)');
          } catch (prefError) {
            console.warn('⚠️ Failed to save social login preferences:', prefError.message);
          }
        }
        
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
      isAuthenticated,
      hasUser: !!user,
      authLoading,
      loading
    });
    
    if (showLanding) return 'Landing';
    if (showLogin) return 'Login';
    if (showSignUp) return 'SignUp';
    if (isAuthenticated && user && !authLoading && !loading) {
      console.log('✅ Route: Authenticated');
      return 'Authenticated';
    }
    console.log('⏳ Route: None (showing loading)');
    return 'None';
  }, [showLanding, showLogin, showSignUp, isAuthenticated, user, authLoading, loading]);

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
    // Always use dark style for light theme
    return 'dark';
  }

  const renderAuthenticatedScreen = () => {
    switch (activeTab) {
      case 'home':
        return <WorkingMinimalDashboard user={user} onLogout={handleLogout} loading={loading} />;
      case 'nutrition':
        return <EnhancedNutrition user={user} loading={loading} />;
      case 'account':
        return <WorkingMinimalAccount user={user} onLogout={handleLogout} loading={loading} />;
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
            currentRoute={route} // Pass the current route so AuthScreen knows what to show
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

      case 'Dashboard':
        return (
          <WorkingMinimalDashboard
            user={user}
            onLogout={handleLogout}
            loading={loading}
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
      showLanding
    });
    
    // Force reset to landing screen
    setAuthLoading(false);
    setLoading(false);
    setShowLanding(true);
    setIsAuthenticated(false);
    setUser(null);
  };

  // Single loading screen for all loading states
  if (authLoading || loading) {
    const message = authLoading 
      ? 'Welcome to Core+...' 
      : isAuthenticated 
        ? 'Setting up your personalized experience...' 
        : 'Logging you in...';
    return <LoadingScreen message={message} onForceExit={handleForceExit} />;
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
          <AppProvider>
            <SubscriptionProvider>
              <DailyCaloriesProvider>
                <WorkoutSessionProvider>
                  <AppContent />
                </WorkoutSessionProvider>
              </DailyCaloriesProvider>
            </SubscriptionProvider>
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}