import { supabase } from './supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Session persistence keys
import { supabase } from './supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Session storage keys
const SESSION_KEYS = {
  USER_DATA: 'userData',
  AUTH_STATE: 'authState',
  SESSION_TOKEN: 'sessionToken',
  LAST_ACTIVITY: 'lastActivity',
  REFRESH_TOKEN: 'refreshToken'
};

// Timeout and retry configuration
const AUTH_CONFIG = {
  TIMEOUT: 15000,        // 15 seconds max for auth operations
  MAX_RETRIES: 3,        // Retry failed operations 3 times
  RETRY_DELAY: 1000,     // 1 second between retries
  SESSION_CHECK_INTERVAL: 60000, // Check session validity every minute
  TOKEN_REFRESH_BUFFER: 300000,  // Refresh token 5 minutes before expiry
};

export class AuthService {
  constructor() {
    this.isAuthenticating = false;
    this.sessionCheckInterval = null;
    this.appStateSubscription = null;
    this.authStateSubscription = null;
    this.initializeAppStateHandling();
  }

  // Initialize app state handling for background/foreground detection
  initializeAppStateHandling() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - checking session validity');
        this.handleAppForeground();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App going to background - saving last activity');
        this.handleAppBackground();
      }
    });
  }

  // Handle app coming to foreground
  async handleAppForeground() {
    try {
      const lastActivity = await AsyncStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
      const now = Date.now();
      
      if (lastActivity) {
        const timeSinceLastActivity = now - parseInt(lastActivity);
        const hoursInBackground = timeSinceLastActivity / (1000 * 60 * 60);
        
        console.log(`⏰ App was in background for ${hoursInBackground.toFixed(1)} hours`);
        
        // If app was in background for more than 1 hour, proactively check session
        if (hoursInBackground > 1) {
          await this.validateAndRefreshSession();
        }
      }
    } catch (error) {
      console.warn('⚠️ Error handling app foreground:', error.message);
    }
  }

  // Handle app going to background
  async handleAppBackground() {
    try {
      await AsyncStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.warn('⚠️ Error saving last activity:', error.message);
    }
  }

  // Validate and refresh session if needed
  async validateAndRefreshSession() {
    try {
      console.log('🔄 Validating current session...');
      
      const { data: { session }, error } = await this.withTimeout(
        supabase.auth.getSession(),
        5000
      );
      
      if (error) {
        console.error('❌ Session validation failed:', error.message);
        return false;
      }
      
      if (!session) {
        console.log('ℹ️ No active session found');
        await this.clearLocalSession();
        return false;
      }
      
      // Check if token is about to expire
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏱️ Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes`);
      
      // If token expires within 5 minutes, refresh it
      if (timeUntilExpiry < AUTH_CONFIG.TOKEN_REFRESH_BUFFER) {
        console.log('🔄 Token expiring soon, refreshing...');
        return await this.refreshToken();
      }
      
      console.log('✅ Session is valid');
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error.message);
      return false;
    }
  }

  // Refresh token with retry logic
  async refreshToken() {
    try {
      console.log('🔄 Refreshing authentication token...');
      
      const { data, error } = await this.withTimeout(
        supabase.auth.refreshSession(),
        10000
      );
      
      if (error) {
        console.error('❌ Token refresh failed:', error.message);
        // If refresh fails, clear local session to force re-login
        await this.clearLocalSession();
        return false;
      }
      
      if (data.session) {
        console.log('✅ Token refreshed successfully');
        await this.cacheUserSession(data.user, data.session);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      await this.clearLocalSession();
      return false;
    }
  }

  // Add timeout wrapper for all auth operations
  withTimeout(promise, timeoutMs = AUTH_CONFIG.TIMEOUT) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    );
    
    return Promise.race([promise, timeoutPromise]);
  }

  // Retry mechanism for failed operations
  async withRetry(operation, maxRetries = AUTH_CONFIG.MAX_RETRIES) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`🔄 Auth attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Cache user session with expiration info
  async cacheUserSession(user, session) {
    try {
      await AsyncStorage.multiSet([
        [SESSION_KEYS.USER_DATA, JSON.stringify(user)],
        [SESSION_KEYS.AUTH_STATE, 'authenticated'],
        [SESSION_KEYS.SESSION_TOKEN, session.access_token],
        [SESSION_KEYS.REFRESH_TOKEN, session.refresh_token],
        [SESSION_KEYS.LAST_ACTIVITY, Date.now().toString()],
      ]);
      console.log('💾 Session cached with expiration tracking');
    } catch (error) {
      console.warn('⚠️ Failed to cache session:', error.message);
    }
  }

  // Clear local session data
  async clearLocalSession() {
    try {
      await AsyncStorage.multiRemove([
        SESSION_KEYS.USER_DATA,
        SESSION_KEYS.AUTH_STATE,
        SESSION_KEYS.SESSION_TOKEN,
        SESSION_KEYS.REFRESH_TOKEN,
        SESSION_KEYS.LAST_ACTIVITY,
      ]);
      console.log('🗑️ Local session cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear local session:', error.message);
    }
  }

  // Check if we have a potentially valid cached session
  async hasValidCachedSession() {
    try {
      const [userData, authState, lastActivity] = await AsyncStorage.multiGet([
        SESSION_KEYS.USER_DATA,
        SESSION_KEYS.AUTH_STATE,
        SESSION_KEYS.LAST_ACTIVITY,
      ]);
      
      const hasData = userData[1] && authState[1] === 'authenticated';
      
      if (!hasData) return false;
      
      // Check if session isn't too old
      const lastActivityTime = lastActivity[1] ? parseInt(lastActivity[1]) : 0;
      const timeSinceActivity = Date.now() - lastActivityTime;
      const hoursSinceActivity = timeSinceActivity / (1000 * 60 * 60);
      
      // If more than 24 hours, consider session potentially invalid
      if (hoursSinceActivity > 24) {
        console.log(`⏰ Cached session is ${hoursSinceActivity.toFixed(1)} hours old - needs validation`);
        return 'needs_validation';
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error checking cached session:', error.message);
      return false;
    }
  }
  // Sign up with phone number and password
  async signUpWithPhone(phone, password, firstName, gender) {
    try {
      console.log('AuthService: Starting signUpWithPhone with:', { phone, firstName, gender });
      
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            first_name: firstName,
            gender: gender,
          }
        }
      });

      console.log('AuthService: Supabase signUpWithPhone response:', { data, error });

      if (error) {
        console.error('AuthService: Supabase signUpWithPhone error:', error);
        throw error;
      }

      console.log('AuthService: SignUpWithPhone successful:', data);
      
      // Note: Don't initialize RevenueCat here - user isn't logged in yet
      // RevenueCat initialization will happen in the auth state listener after login
      
      return { success: true, data };
    } catch (error) {
      console.error('AuthService: SignUpWithPhone catch block:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify phone number with OTP
  async verifyPhone(phone, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Resend OTP
  resendOtp: async (phone) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'sms',
        phone
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign in with phone and password
  signInWithPhone: async (phone, password) => {
    try {
      console.log('🔐 AuthService: Starting signInWithPhone for:', phone);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('🔐 AuthService: signInWithPhone successful');
      
      // Store user data for persistence
      if (data.user && data.session) {
        try {
          await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(data.user));
          await AsyncStorage.setItem(SESSION_KEYS.AUTH_STATE, 'authenticated');
          console.log('💾 User session saved to storage');
        } catch (storageError) {
          console.warn('Failed to save session to storage:', storageError);
        }
      }
      
      // Initialize subscription service for the user
      if (data.user) {
        try {
          const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
          await userSubscriptionService.initializeForUser(data.user);
          console.log('✅ Subscription service initialized for user');
        } catch (subscriptionError) {
          console.error('⚠️ Failed to initialize subscription service:', subscriptionError);
          // Don't fail the login if subscription service fails
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('🔐 AuthService: signInWithPhone catch:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Sign up with email and password (keeping for backward compatibility)
  signUp: async (email, password, firstName, gender) => {
    try {
      console.log('AuthService: Starting signUp with:', { email, firstName, gender });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            gender: gender,
          }
        }
      });

      console.log('AuthService: Supabase signUp response:', { data, error });

      if (error) {
        console.error('AuthService: Supabase signUp error:', error);
        throw error;
      }

      console.log('AuthService: SignUp successful:', data);
      
      // Note: Don't initialize RevenueCat here - user isn't logged in yet
      // RevenueCat initialization will happen in the auth state listener after auto-login
      
      return { success: true, data };
    } catch (error) {
      console.error('AuthService: SignUp catch block:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      console.log('🔐 AuthService: Starting signIn for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🔐 AuthService: signIn error:', error);
        throw error;
      }

      console.log('🔐 AuthService: signIn successful');
      
      // Store user data for persistence
      if (data.user && data.session) {
        try {
          await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(data.user));
          await AsyncStorage.setItem(SESSION_KEYS.AUTH_STATE, 'authenticated');
          console.log('💾 User session saved to storage');
        } catch (storageError) {
          console.warn('Failed to save session to storage:', storageError);
        }
      }
      
      // Initialize subscription service for the user
      if (data.user) {
        try {
          const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
          await userSubscriptionService.initializeForUser(data.user);
          console.log('✅ Subscription service initialized for user');
        } catch (subscriptionError) {
          console.error('⚠️ Failed to initialize subscription service:', subscriptionError);
          // Don't fail the login if subscription service fails
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('🔐 AuthService: signIn catch:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      // Clear stored session data
      try {
        await AsyncStorage.multiRemove([SESSION_KEYS.USER_DATA, SESSION_KEYS.AUTH_STATE]);
        console.log('🗑️ Session data cleared from storage');
      } catch (storageError) {
        console.warn('Failed to clear session from storage:', storageError);
      }
      
      // Clear all user-specific cached data before signing out
      const { cacheManager } = await import('./services/cacheManager');
      await cacheManager.clearAllUserData();
      
      // Clean up subscription service
      try {
        const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
        await userSubscriptionService.cleanup();
        console.log('✅ Subscription service cleaned up');
      } catch (subscriptionError) {
        console.error('⚠️ Failed to cleanup subscription service:', subscriptionError);
        // Don't fail the logout if subscription cleanup fails
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if user has a valid stored session
  hasValidStoredSession: async () => {
    try {
      const [userData, authState] = await AsyncStorage.multiGet([
        SESSION_KEYS.USER_DATA,
        SESSION_KEYS.AUTH_STATE,
      ]);
      
      return (
        userData[1] !== null && 
        authState[1] === 'authenticated'
      );
    } catch (error) {
      console.warn('Failed to check stored session:', error);
      return false;
    }
  },

  // Get stored user data
  getStoredUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(SESSION_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get stored user data:', error);
      return null;
    }
  },

  // Initialize session on app startup
  initializeSession: async () => {
    const startTime = Date.now();
    console.log('🔄 [AUTH] Starting session initialization...');
    console.log('🔄 [AUTH] Supabase client status:', supabase?.supabaseUrl ? 'initialized' : 'not initialized');
    
    try {
      // Add timeout wrapper for session retrieval (increased to 30s for better reliability)
      console.log('📡 [AUTH] Calling supabase.auth.getSession()...');
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout after 30s')), 30000)
      );
      
      const sessionStartTime = Date.now();
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
      console.log(`⏱️ [AUTH] getSession() took ${Date.now() - sessionStartTime}ms`);
      console.log('📡 [AUTH] Session result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        error: error?.message
      });
      
      if (error) {
        console.error('❌ Session retrieval error:', error);
        return { success: false, error: error.message };
      }

      if (session?.user) {
        console.log('✅ Active Supabase session found for user:', session.user.email || session.user.phone);
        // Update stored session data
        try {
          await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(session.user));
          await AsyncStorage.setItem(SESSION_KEYS.AUTH_STATE, 'authenticated');
          console.log('💾 Session data updated in storage');
        } catch (storageError) {
          console.warn('⚠️ Failed to update stored session:', storageError);
        }
        console.log(`✅ Session initialization completed in ${Date.now() - startTime}ms`);
        return { success: true, user: session.user, session };
      }

      // Check if we have stored session data and try to refresh
      console.log('📱 Checking for stored session...');
      const hasStoredSession = await this.hasValidStoredSession();
      if (hasStoredSession) {
        console.log('📱 Stored session found, attempting refresh...');
        const storedUser = await this.getStoredUserData();
        
        // Try multiple refresh attempts for token expiry issues
        let refreshAttempts = 0;
        const maxRefreshAttempts = 2;
        
        while (refreshAttempts < maxRefreshAttempts) {
          try {
            console.log(`🔄 Refresh attempt ${refreshAttempts + 1}/${maxRefreshAttempts}...`);
            
            // Try to refresh the session with timeout
            const refreshPromise = supabase.auth.refreshSession();
            const refreshTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Refresh timeout')), 15000)
            );
            
            const { data, error } = await Promise.race([refreshPromise, refreshTimeoutPromise]);
            
            if (data?.session?.user) {
              console.log('✅ Session refreshed successfully on attempt', refreshAttempts + 1);
              // Update stored session data with fresh tokens
              await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(data.session.user));
              return { success: true, user: data.session.user, restored: true, refreshed: true };
            } else if (error) {
              console.log(`❌ Refresh attempt ${refreshAttempts + 1} failed:`, error.message);
              if (error.message.includes('expired') || error.message.includes('invalid')) {
                refreshAttempts++;
                if (refreshAttempts < maxRefreshAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                }
              } else {
                break; // Non-retryable error
              }
            } else {
              refreshAttempts++;
            }
          } catch (refreshError) {
            console.log(`❌ Refresh attempt ${refreshAttempts + 1} failed with error:`, refreshError.message);
            refreshAttempts++;
            if (refreshAttempts < maxRefreshAttempts && (
              refreshError.message.includes('timeout') || 
              refreshError.message.includes('network') ||
              refreshError.message.includes('expired')
            )) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
            } else {
              break;
            }
          }
        }
        
        // If all refresh attempts failed, try getCurrentUser as fallback
        try {
          const { data: { user } } = await this.getCurrentUser();
          if (user) {
            console.log('✅ Fallback getCurrentUser() succeeded');
            return { success: true, user, restored: true };
          }
        } catch (fallbackError) {
          console.log('❌ Fallback getCurrentUser() also failed:', fallbackError.message);
        }
        
        console.log('❌ All refresh attempts failed, clearing stored session...');
        await AsyncStorage.multiRemove([SESSION_KEYS.USER_DATA, SESSION_KEYS.AUTH_STATE]);
      }

      console.log('🚫 No valid session found');
      return { success: false, error: 'No valid session' };
    } catch (error) {
      console.error('Session initialization error:', error);
      return { success: false, error: error.message };
    }
  },
};
