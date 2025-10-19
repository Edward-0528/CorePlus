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

class RobustAuthService {
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

  // Improved sign in with better error handling and session management
  async signIn(email, password) {
    if (this.isAuthenticating) {
      console.log('⏳ Authentication already in progress, waiting...');
      throw new Error('Authentication in progress');
    }

    this.isAuthenticating = true;
    
    try {
      console.log('🔐 Starting sign in for:', email);
      
      const result = await this.withRetry(async () => {
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

        return await this.withTimeout(authOperation());
      });
      
      if (result.user && result.session) {
        await this.cacheUserSession(result.user, result.session);
        console.log('✅ Sign in successful');
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Sign in failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isAuthenticating = false;
    }
  }

  // Improved sign up
  async signUp(email, password, firstName, additionalData = {}) {
    try {
      console.log('📝 Starting sign up for:', email);
      
      const result = await this.withRetry(async () => {
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

        return await this.withTimeout(authOperation());
      });
      
      console.log('✅ Sign up successful');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Sign up failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sign up with phone number and password
  async signUpWithPhone(phone, password, firstName, gender) {
    try {
      console.log('📱 Starting phone sign up for:', phone);
      
      const result = await this.withRetry(async () => {
        const authOperation = async () => {
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

          if (error) {
            throw error;
          }

          return data;
        };

        return await this.withTimeout(authOperation());
      });
      
      console.log('✅ Phone sign up successful');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Phone sign up failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Verify phone number with OTP
  async verifyPhone(phone, token) {
    try {
      console.log('🔢 Verifying phone with OTP');
      
      const result = await this.withRetry(async () => {
        const authOperation = async () => {
          const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms'
          });

          if (error) {
            throw error;
          }

          return data;
        };

        return await this.withTimeout(authOperation());
      });
      
      if (result.user && result.session) {
        await this.cacheUserSession(result.user, result.session);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Phone verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Resend OTP
  async resendOtp(phone) {
    try {
      console.log('🔄 Resending OTP to:', phone);
      
      const result = await this.withRetry(async () => {
        const authOperation = async () => {
          const { data, error } = await supabase.auth.resend({
            type: 'sms',
            phone
          });

          if (error) {
            throw error;
          }

          return data;
        };

        return await this.withTimeout(authOperation());
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Resend OTP failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sign in with phone and password
  async signInWithPhone(phone, password) {
    if (this.isAuthenticating) {
      console.log('⏳ Authentication already in progress, waiting...');
      throw new Error('Authentication in progress');
    }

    this.isAuthenticating = true;
    
    try {
      console.log('📱 Starting phone sign in for:', phone);
      
      const result = await this.withRetry(async () => {
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

        return await this.withTimeout(authOperation());
      });
      
      if (result.user && result.session) {
        await this.cacheUserSession(result.user, result.session);
        console.log('✅ Phone sign in successful');
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Phone sign in failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isAuthenticating = false;
    }
  }

  // Sign out with cleanup
  async signOut() {
    try {
      console.log('👋 Signing out...');
      
      // Clear cache first
      await this.clearLocalSession();
      
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
      await this.clearLocalSession();
      return { success: false, error: error.message };
    }
  }

  // Get current user with fallback to cached data
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
        const cachedData = await AsyncStorage.getItem(SESSION_KEYS.USER_DATA);
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
          this.clearLocalSession();
        }
        
        callback(event, session);
      } catch (error) {
        console.error('❌ Auth state change handler error:', error.message);
      }
    });
  }

  // Improved session restoration for app startup
  async restoreSession() {
    try {
      console.log('🔄 Attempting to restore session...');
      
      // First check cached session
      const cachedSession = await this.hasValidCachedSession();
      
      if (cachedSession === false) {
        console.log('ℹ️ No valid cached session found');
        return { success: false, error: 'No cached session' };
      }
      
      if (cachedSession === 'needs_validation') {
        console.log('🔍 Cached session needs validation...');
        const isValid = await this.validateAndRefreshSession();
        
        if (!isValid) {
          console.log('❌ Session validation failed');
          return { success: false, error: 'Session validation failed' };
        }
      }
      
      // Get current session from Supabase
      const sessionOperation = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        return session;
      };

      const session = await this.withTimeout(sessionOperation(), 8000);
      
      if (session && session.user) {
        console.log('✅ Session restored successfully');
        await this.cacheUserSession(session.user, session);
        return { success: true, data: { user: session.user, session } };
      } else {
        console.log('ℹ️ No active session found');
        await this.clearLocalSession();
        return { success: false, error: 'No active session' };
      }
    } catch (error) {
      console.error('❌ Session restoration failed:', error.message);
      await this.clearLocalSession();
      return { success: false, error: error.message };
    }
  }

  // Cleanup method
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }
}

// Create and export singleton instance
const authService = new RobustAuthService();

export default authService;
