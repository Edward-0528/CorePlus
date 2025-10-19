import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseConfig';
import { biometricService } from '../biometricService';

// Storage keys for quick login
const QUICK_LOGIN_KEYS = {
  SAVED_EMAIL: 'savedEmail',
  BIOMETRIC_ENABLED: 'biometricEnabled', 
  STAY_LOGGED_IN: 'stayLoggedIn',
  LAST_LOGIN_METHOD: 'lastLoginMethod',
  USER_PREFERENCES: 'userPreferences'
};

class QuickLoginService {
  
  /**
   * Save user's login credentials/preferences for easier re-login
   */
  async saveLoginPreferences(email, password = null, enableBiometric = false, stayLoggedIn = false) {
    try {
      console.log('💾 Saving login preferences for easier re-login');
      
      // Save email for autocomplete
      await AsyncStorage.setItem(QUICK_LOGIN_KEYS.SAVED_EMAIL, email);
      
      // Save biometric preference
      await AsyncStorage.setItem(QUICK_LOGIN_KEYS.BIOMETRIC_ENABLED, enableBiometric.toString());
      
      // Save stay logged in preference  
      await AsyncStorage.setItem(QUICK_LOGIN_KEYS.STAY_LOGGED_IN, stayLoggedIn.toString());
      
      // If biometric is enabled and available, save encrypted password
      if (enableBiometric && password) {
        const biometricInfo = await biometricService.isAvailable();
        if (biometricInfo.isAvailable) {
          await biometricService.storeCredentials(email, password);
          console.log('🔐 Credentials saved for biometric login');
        }
      }
      
      console.log('✅ Login preferences saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving login preferences:', error);
    }
  }

  /**
   * Get saved login preferences
   */
  async getLoginPreferences() {
    try {
      const [savedEmail, biometricEnabled, stayLoggedIn] = await Promise.all([
        AsyncStorage.getItem(QUICK_LOGIN_KEYS.SAVED_EMAIL),
        AsyncStorage.getItem(QUICK_LOGIN_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.getItem(QUICK_LOGIN_KEYS.STAY_LOGGED_IN)
      ]);

      return {
        savedEmail: savedEmail || '',
        biometricEnabled: biometricEnabled === 'true',
        stayLoggedIn: stayLoggedIn === 'true',
        hasSavedCredentials: !!savedEmail
      };
    } catch (error) {
      console.error('❌ Error getting login preferences:', error);
      return {
        savedEmail: '',
        biometricEnabled: false,
        stayLoggedIn: false,
        hasSavedCredentials: false
      };
    }
  }

  /**
   * Attempt biometric login using saved credentials
   */
  async attemptBiometricLogin() {
    try {
      console.log('👆 Attempting biometric login...');
      
      const preferences = await this.getLoginPreferences();
      if (!preferences.biometricEnabled || !preferences.savedEmail) {
        return { success: false, error: 'Biometric login not configured' };
      }

      const biometricInfo = await biometricService.isAvailable();
      if (!biometricInfo.isAvailable) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      // Retrieve credentials using biometric
      const credentials = await biometricService.getStoredCredentials();
      if (!credentials) {
        return { success: false, error: 'No stored credentials found' };
      }

      // Attempt login with stored credentials
      console.log('🔑 Logging in with biometric credentials...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ Biometric login failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Biometric login successful');
      return { success: true, user: data.user };

    } catch (error) {
      console.error('❌ Biometric login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Quick login with saved email (user just needs to enter password)
   */
  async quickLogin(password) {
    try {
      const preferences = await this.getLoginPreferences();
      if (!preferences.savedEmail) {
        return { success: false, error: 'No saved email found' };
      }

      console.log('⚡ Attempting quick login for:', preferences.savedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: preferences.savedEmail,
        password: password
      });

      if (error) {
        console.error('❌ Quick login failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Quick login successful');
      
      // Update saved credentials if successful
      await this.saveLoginPreferences(
        preferences.savedEmail, 
        password, 
        preferences.biometricEnabled, 
        preferences.stayLoggedIn
      );

      return { success: true, user: data.user };

    } catch (error) {
      console.error('❌ Quick login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user should stay logged in (for trusted devices)
   */
  async shouldStayLoggedIn() {
    try {
      const preferences = await this.getLoginPreferences();
      return preferences.stayLoggedIn;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all saved login data (logout/reset)
   */
  async clearLoginPreferences() {
    try {
      console.log('🧹 Clearing login preferences');
      
      await Promise.all([
        AsyncStorage.removeItem(QUICK_LOGIN_KEYS.SAVED_EMAIL),
        AsyncStorage.removeItem(QUICK_LOGIN_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.removeItem(QUICK_LOGIN_KEYS.STAY_LOGGED_IN),
        AsyncStorage.removeItem(QUICK_LOGIN_KEYS.LAST_LOGIN_METHOD),
        biometricService.clearStoredCredentials()
      ]);

      console.log('✅ Login preferences cleared');
    } catch (error) {
      console.error('❌ Error clearing login preferences:', error);
    }
  }

  /**
   * Check if quick login options are available
   */
  async getAvailableLoginOptions() {
    try {
      const preferences = await this.getLoginPreferences();
      const biometricInfo = await biometricService.isAvailable();
      
      return {
        hasQuickLogin: preferences.hasSavedCredentials,
        hasBiometric: preferences.biometricEnabled && biometricInfo.isAvailable,
        savedEmail: preferences.savedEmail,
        canStayLoggedIn: true // Always available as option
      };
    } catch (error) {
      console.error('❌ Error checking login options:', error);
      return {
        hasQuickLogin: false,
        hasBiometric: false,
        savedEmail: '',
        canStayLoggedIn: false
      };
    }
  }

  /**
   * Update biometric preference
   */
  async setBiometricEnabled(enabled) {
    try {
      await AsyncStorage.setItem(QUICK_LOGIN_KEYS.BIOMETRIC_ENABLED, enabled.toString());
      
      if (!enabled) {
        // Clear biometric credentials if disabled
        await biometricService.clearStoredCredentials();
      }
      
      console.log(`🔐 Biometric login ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error setting biometric preference:', error);
    }
  }

  /**
   * Set stay logged in preference
   */
  async setStayLoggedIn(stayLoggedIn) {
    try {
      await AsyncStorage.setItem(QUICK_LOGIN_KEYS.STAY_LOGGED_IN, stayLoggedIn.toString());
      console.log(`📱 Stay logged in ${stayLoggedIn ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error setting stay logged in preference:', error);
    }
  }
}

// Export singleton
export const quickLoginService = new QuickLoginService();
export default quickLoginService;
