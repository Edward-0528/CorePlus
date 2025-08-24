import { supabase } from './supabaseConfig';

export const authService = {
  // Sign up with email and password
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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

  // Sign out
  signOut: async () => {
    try {
      // Clear all user-specific cached data before signing out
      const { cacheManager } = await import('./services/cacheManager');
      await cacheManager.clearAllUserData();
      
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
