import { supabase } from './supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Session persistence keys
const SESSION_KEYS = {
  USER_DATA: 'core_plus_user_data',
  AUTH_STATE: 'core_plus_auth_state',
};

export const authService = {
  // Sign up with phone number and password
  signUpWithPhone: async (phone, password, firstName, gender) => {
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
  },

  // Verify phone number with OTP
  verifyPhone: async (phone, token) => {
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
    console.log('🔄 Initializing session...');
    
    try {
      // Add timeout wrapper for session retrieval
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout after 10s')), 10000)
      );
      
      console.log('📡 Checking Supabase session...');
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
      console.log(`⏱️ Session check took ${Date.now() - startTime}ms`);
      
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

      // Check if we have stored session data
      console.log('📱 Checking for stored session...');
      const hasStoredSession = await this.hasValidStoredSession();
      if (hasStoredSession) {
        console.log('📱 Stored session found, checking validity...');
        const storedUser = await this.getStoredUserData();
        
        // Try to refresh the session
        const { data: { user } } = await this.getCurrentUser();
        if (user) {
          console.log('✅ Session refreshed successfully');
          return { success: true, user, restored: true };
        } else {
          console.log('❌ Stored session invalid, clearing...');
          await AsyncStorage.multiRemove([SESSION_KEYS.USER_DATA, SESSION_KEYS.AUTH_STATE]);
        }
      }

      console.log('🚫 No valid session found');
      return { success: false, error: 'No valid session' };
    } catch (error) {
      console.error('Session initialization error:', error);
      return { success: false, error: error.message };
    }
  },
};
