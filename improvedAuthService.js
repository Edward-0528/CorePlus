import { supabase } from './supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TIMEOUT = 15000; // 15 seconds timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ImprovedAuthService {
  constructor() {
    this.isAuthenticating = false;
    this.authPromise = null;
  }

  // Add timeout wrapper for all auth operations
  withTimeout(promise, timeoutMs = AUTH_TIMEOUT) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timeout')), timeoutMs)
    );
    
    return Promise.race([promise, timeoutPromise]);
  }

  // Retry mechanism for failed operations
  async withRetry(operation, maxRetries = MAX_RETRIES) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Auth attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Improved sign in with better error handling
  async signIn(email, password) {
    if (this.isAuthenticating) {
      console.log('Authentication already in progress, waiting...');
      return this.authPromise;
    }

    this.isAuthenticating = true;
    
    this.authPromise = this.withRetry(async () => {
      console.log('🔐 Starting sign in for:', email);
      
      const authOperation = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw error;
        }

        return data;
      };

      const data = await this.withTimeout(authOperation());
      
      if (data.user && data.session) {
        await this.cacheUserSession(data.user, data.session);
        console.log('✅ Sign in successful');
      }
      
      return { success: true, data };
    }).catch(error => {
      console.error('❌ Sign in failed:', error.message);
      return { success: false, error: error.message };
    }).finally(() => {
      this.isAuthenticating = false;
      this.authPromise = null;
    });

    return this.authPromise;
  }

  // Improved sign up
  async signUp(email, password, firstName, additionalData = {}) {
    return this.withRetry(async () => {
      console.log('📝 Starting sign up for:', email);
      
      const authOperation = async () => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              first_name: firstName,
              ...additionalData
            }
          }
        });

        if (error) {
          throw error;
        }

        return data;
      };

      const data = await this.withTimeout(authOperation());
      
      console.log('✅ Sign up successful');
      return { success: true, data };
    }).catch(error => {
      console.error('❌ Sign up failed:', error.message);
      return { success: false, error: error.message };
    });
  }

  // Improved phone authentication
  async signInWithPhone(phone, password) {
    return this.withRetry(async () => {
      console.log('📱 Starting phone sign in for:', phone);
      
      const authOperation = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          phone: phone.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        return data;
      };

      const data = await this.withTimeout(authOperation());
      
      if (data.user && data.session) {
        await this.cacheUserSession(data.user, data.session);
        console.log('✅ Phone sign in successful');
      }
      
      return { success: true, data };
    }).catch(error => {
      console.error('❌ Phone sign in failed:', error.message);
      return { success: false, error: error.message };
    });
  }

  // Improved session restoration
  async restoreSession() {
    try {
      console.log('🔄 Attempting to restore session...');
      
      const sessionOperation = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        return session;
      };

      const session = await this.withTimeout(sessionOperation(), 10000); // Shorter timeout for session check
      
      if (session && session.user) {
        console.log('✅ Session restored successfully');
        return { success: true, data: { user: session.user, session } };
      } else {
        console.log('ℹ️ No valid session found');
        return { success: false, error: 'No valid session' };
      }
    } catch (error) {
      console.error('❌ Session restoration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Cache user session
  async cacheUserSession(user, session) {
    try {
      await AsyncStorage.multiSet([
        ['user_data', JSON.stringify(user)],
        ['auth_state', 'authenticated'],
        ['session_expires', session.expires_at?.toString() || ''],
      ]);
      console.log('💾 Session cached successfully');
    } catch (error) {
      console.warn('⚠️ Failed to cache session:', error.message);
    }
  }

  // Clear cached session
  async clearCachedSession() {
    try {
      await AsyncStorage.multiRemove(['user_data', 'auth_state', 'session_expires']);
      console.log('🗑️ Session cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear session cache:', error.message);
    }
  }

  // Sign out with cleanup
  async signOut() {
    try {
      console.log('👋 Signing out...');
      
      // Clear cache first
      await this.clearCachedSession();
      
      // Sign out from Supabase with timeout
      const signOutOperation = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      };

      await this.withTimeout(signOutOperation(), 5000);
      
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error.message);
      // Even if sign out fails, clear local data
      await this.clearCachedSession();
      return { success: false, error: error.message };
    }
  }

  // Check connection health
  async checkConnectionHealth() {
    try {
      console.log('🔍 Checking Supabase connection health...');
      
      const healthCheck = async () => {
        // Simple query to test connection
        const { data, error } = await supabase.auth.getUser();
        return { data, error };
      };

      const result = await this.withTimeout(healthCheck(), 5000);
      
      console.log('✅ Connection health check passed');
      return true;
    } catch (error) {
      console.error('❌ Connection health check failed:', error.message);
      return false;
    }
  }

  // Get current user with fallback
  async getCurrentUser() {
    try {
      const userOperation = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      };

      return await this.withTimeout(userOperation(), 5000);
    } catch (error) {
      console.warn('⚠️ Failed to get current user, trying cache:', error.message);
      
      // Fallback to cached data
      try {
        const cachedData = await AsyncStorage.getItem('user_data');
        return cachedData ? JSON.parse(cachedData) : null;
      } catch (cacheError) {
        console.error('❌ Cache fallback also failed:', cacheError.message);
        return null;
      }
    }
  }

  // Auth state listener with error handling
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      try {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.cacheUserSession(session.user, session);
        } else if (event === 'SIGNED_OUT') {
          this.clearCachedSession();
        }
        
        callback(event, session);
      } catch (error) {
        console.error('❌ Auth state change handler error:', error.message);
      }
    });
  }
}

// Export singleton instance
export const improvedAuthService = new ImprovedAuthService();
export default improvedAuthService;
