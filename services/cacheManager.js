import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutCacheService } from './workoutCacheService';

class CacheManager {
  /**
   * Clear all user-specific cached data on logout
   * This ensures new users don't see previous user's data
   */
  async clearAllUserData() {
    console.log('🧹 Clearing all user data from cache...');
    
    try {
      // Get all stored keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Identify user-specific cache keys
      const userDataKeys = allKeys.filter(key => 
        key.startsWith('meals_') ||           // Meal data
        key.startsWith('workout_') ||         // Workout data  
        key.startsWith('daily_calories_') ||  // Daily calorie tracking
        key.startsWith('nutrition_') ||       // Nutrition data
        key.startsWith('user_stats_') ||      // User statistics
        key.startsWith('meal_history_') ||    // Meal history
        key.startsWith('last_cache_') ||      // Cache timestamps
        key === 'last_cache_update' ||        // Global cache update
        key === 'last_cache_cleanup'          // Cache cleanup timestamps
      );

      // Remove all user-specific data
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log(`🗑️ Removed ${userDataKeys.length} user data cache entries`);
      }

      // Clear workout cache service (memory + persistent)
      await workoutCacheService.clearAll();

      console.log('✅ All user data cleared successfully');
      
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  /**
   * Clear user-specific data for a particular user ID
   */
  async clearUserSpecificData(userId) {
    if (!userId) {
      console.warn('⚠️ No user ID provided for cache clearing');
      return;
    }
    
    console.log('🧹 Clearing user-specific data for user:', userId);
    
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find keys that end with the specific user ID
      const userSpecificKeys = allKeys.filter(key => 
        key.endsWith(`_${userId}`) ||         // New format: meals_date_userId
        (key.startsWith('meals_') && key.split('_').length === 2) || // Old format: meals_date (for cleanup)
        key.startsWith(`user_${userId}_`) ||  // Any other user-specific keys
        key.startsWith(`daily_calories_${userId}`) ||
        key.startsWith(`nutrition_${userId}`) ||
        key.startsWith(`lastCacheUpdate_${userId}`)
      );

      if (userSpecificKeys.length > 0) {
        await AsyncStorage.multiRemove(userSpecificKeys);
        console.log(`🗑️ Removed ${userSpecificKeys.length} user-specific cache entries for user ${userId}`);
      }
      
    } catch (error) {
      console.error('❌ Error clearing user-specific data:', error);
    }
  }

  /**
   * Clear session-specific data (for user switching)
   */
  async clearSessionData() {
    console.log('🔄 Clearing session data...');
    
    try {
      // Clear memory caches
      await workoutCacheService.clearAll();
      
      // Clear today's data specifically (will be refetched for new user)
      const today = new Date().toISOString().split('T')[0];
      
      // Get all keys and filter for today's data (both old and new formats)
      const allKeys = await AsyncStorage.getAllKeys();
      const todayKeys = allKeys.filter(key => 
        key.startsWith(`meals_${today}`) ||       // Both meals_date and meals_date_userId
        key.startsWith(`daily_calories_${today}`) ||
        key.startsWith(`nutrition_${today}`) ||
        key === 'last_cache_update' ||
        key.startsWith('lastCacheUpdate_')        // User-specific cache update times
      );
      
      if (todayKeys.length > 0) {
        await AsyncStorage.multiRemove(todayKeys);
      }
      console.log('✅ Session data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing session data:', error);
    }
  }

  /**
   * Clear specific user's data (when switching users)
   */
  async clearUserSpecificData(userId) {
    console.log(`🧹 Clearing data for user: ${userId}`);
    
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find keys that contain the user ID or are user-specific
      const userKeys = allKeys.filter(key => 
        key.includes(userId) ||
        key.startsWith('meals_') ||
        key.startsWith('workout_') ||
        key.startsWith('daily_calories_')
      );

      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
        console.log(`🗑️ Removed ${userKeys.length} entries for user ${userId}`);
      }
      
    } catch (error) {
      console.error(`❌ Error clearing data for user ${userId}:`, error);
    }
  }

  /**
   * Clear all caches (complete reset)
   */
  async clearAllCaches() {
    console.log('🧹 Performing complete cache reset...');
    
    try {
      // Clear all AsyncStorage
      await AsyncStorage.clear();
      
      // Clear memory caches
      await workoutCacheService.clearAll();
      
      console.log('✅ Complete cache reset successful');
      
    } catch (error) {
      console.error('❌ Error performing complete cache reset:', error);
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
