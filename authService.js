import { supabase } from './supabaseConfig';

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
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
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
  }
};
