import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseConfig';

/**
 * Usage Tracking Service
 * Tracks monthly usage for AI scans and manual searches for free tier users
 */

class UsageTrackingService {
  constructor() {
    this.storageKeys = {
      AI_SCANS: 'monthly_ai_scans',
      MANUAL_SEARCHES: 'monthly_manual_searches',
      LAST_RESET: 'usage_last_reset'
    };
  }

  /**
   * Get current month key (YYYY-MM format)
   */
  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check if we need to reset monthly counters
   */
  async checkAndResetIfNeeded() {
    try {
      const currentMonth = this.getCurrentMonthKey();
      const lastReset = await AsyncStorage.getItem(this.storageKeys.LAST_RESET);
      
      if (lastReset !== currentMonth) {
        console.log('🔄 New month detected, resetting usage counters');
        await this.resetMonthlyCounters();
        await AsyncStorage.setItem(this.storageKeys.LAST_RESET, currentMonth);
      }
    } catch (error) {
      console.error('Error checking usage reset:', error);
    }
  }

  /**
   * Reset all monthly counters to zero
   */
  async resetMonthlyCounters() {
    try {
      await AsyncStorage.removeItem(this.storageKeys.AI_SCANS);
      await AsyncStorage.removeItem(this.storageKeys.MANUAL_SEARCHES);
      console.log('✅ Monthly usage counters reset');
    } catch (error) {
      console.error('Error resetting counters:', error);
    }
  }

  /**
   * Get current usage for a specific feature
   */
  async getCurrentUsage(featureType) {
    try {
      await this.checkAndResetIfNeeded();
      
      let storageKey;
      switch (featureType) {
        case 'ai_scans':
          storageKey = this.storageKeys.AI_SCANS;
          break;
        case 'manual_searches':
          storageKey = this.storageKeys.MANUAL_SEARCHES;
          break;
        default:
          return 0;
      }
      
      const usage = await AsyncStorage.getItem(storageKey);
      return usage ? parseInt(usage, 10) : 0;
    } catch (error) {
      console.error(`Error getting usage for ${featureType}:`, error);
      return 0;
    }
  }

  /**
   * Increment usage counter for a feature
   */
  async incrementUsage(featureType, userId) {
    try {
      await this.checkAndResetIfNeeded();
      
      const currentUsage = await this.getCurrentUsage(featureType);
      const newUsage = currentUsage + 1;
      
      let storageKey;
      switch (featureType) {
        case 'ai_scans':
          storageKey = this.storageKeys.AI_SCANS;
          break;
        case 'manual_searches':
          storageKey = this.storageKeys.MANUAL_SEARCHES;
          break;
        default:
          return false;
      }
      
      await AsyncStorage.setItem(storageKey, newUsage.toString());
      
      // Also log to database for analytics (optional)
      try {
        await this.logUsageToDatabase(userId, featureType, newUsage);
      } catch (dbError) {
        console.warn('Failed to log usage to database:', dbError);
        // Don't fail the operation if DB logging fails
      }
      
      console.log(`📊 ${featureType} usage incremented to: ${newUsage}`);
      return newUsage;
    } catch (error) {
      console.error(`Error incrementing usage for ${featureType}:`, error);
      return false;
    }
  }

  /**
   * Check if user can use a feature (within limits)
   */
  async canUseFeature(featureType, limit, userId) {
    try {
      // Unlimited usage (-1 limit) 
      if (limit === -1) {
        return { canUse: true, remaining: -1, used: 0 };
      }
      
      const currentUsage = await this.getCurrentUsage(featureType);
      const canUse = currentUsage < limit;
      const remaining = Math.max(0, limit - currentUsage);
      
      return {
        canUse,
        remaining,
        used: currentUsage,
        limit,
        featureType
      };
    } catch (error) {
      console.error(`Error checking feature usage for ${featureType}:`, error);
      return { canUse: false, remaining: 0, used: 0, limit };
    }
  }

  /**
   * Get usage stats for display in UI
   */
  async getUsageStats(limits) {
    try {
      console.log('📊 [UsageTrackingService] Getting usage stats with limits:', limits);
      
      const aiScansUsage = await this.getCurrentUsage('ai_scans');
      const manualSearchesUsage = await this.getCurrentUsage('manual_searches');
      
      const stats = {
        aiScans: {
          used: aiScansUsage,
          limit: limits.aiScansPerMonth || 5,
          remaining: limits.aiScansPerMonth === -1 ? -1 : Math.max(0, (limits.aiScansPerMonth || 5) - aiScansUsage)
        },
        manualSearches: {
          used: manualSearchesUsage,
          limit: limits.aiManualSearchesPerMonth || 5,
          remaining: limits.aiManualSearchesPerMonth === -1 ? -1 : Math.max(0, (limits.aiManualSearchesPerMonth || 5) - manualSearchesUsage)
        }
      };
      
      console.log('📊 [UsageTrackingService] Usage stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        aiScans: { used: 0, limit: 5, remaining: 5 },
        manualSearches: { used: 0, limit: 5, remaining: 5 }
      };
    }
  }

  /**
   * Log usage to database for analytics (optional)
   */
  async logUsageToDatabase(userId, featureType, usage) {
    try {
      const currentMonth = this.getCurrentMonthKey();
      
      const { error } = await supabase
        .from('user_usage_stats')
        .upsert({
          user_id: userId,
          month: currentMonth,
          feature_type: featureType,
          usage_count: usage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,month,feature_type'
        });
      
      if (error) {
        console.warn('Database usage logging failed:', error.message);
      }
    } catch (error) {
      console.warn('Database usage logging error:', error);
    }
  }

  /**
   * Test function to set usage for debugging
   */
  async setUsageForTesting(featureType, amount) {
    try {
      let storageKey;
      switch (featureType) {
        case 'ai_scans':
          storageKey = this.storageKeys.AI_SCANS;
          break;
        case 'manual_searches':
          storageKey = this.storageKeys.MANUAL_SEARCHES;
          break;
        default:
          return false;
      }
      
      await AsyncStorage.setItem(storageKey, amount.toString());
      console.log(`🧪 Test: Set ${featureType} usage to ${amount}`);
      return true;
    } catch (error) {
      console.error('Error setting test usage:', error);
      return false;
    }
  }
}

export default new UsageTrackingService();
