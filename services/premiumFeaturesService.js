import React from 'react';
import { revenueCatService } from '../services/revenueCatService';

/**
 * Premium Features Configuration
 * Define which features require premium access
 */
export const PREMIUM_FEATURES = {
  // Nutrition Features
  UNLIMITED_MEAL_LOGGING: 'unlimited_meal_logging',
  ADVANCED_NUTRITION_INSIGHTS: 'advanced_nutrition_insights',
  MEAL_PLANNING: 'meal_planning',
  RECIPE_IMPORT: 'recipe_import',
  BARCODE_SCANNING: 'barcode_scanning',
  
  // Workout Features
  UNLIMITED_WORKOUTS: 'unlimited_workouts',
  ADVANCED_WORKOUT_ANALYTICS: 'advanced_workout_analytics',
  CUSTOM_WORKOUT_PLANS: 'custom_workout_plans',
  WORKOUT_VIDEO_LIBRARY: 'workout_video_library',
  
  // Health Integration
  GOOGLE_FIT_SYNC: 'google_fit_sync',
  SAMSUNG_HEALTH_SYNC: 'samsung_health_sync',
  ADVANCED_HEALTH_METRICS: 'advanced_health_metrics',
  
  // General Features
  AD_FREE_EXPERIENCE: 'ad_free_experience',
  PREMIUM_SUPPORT: 'premium_support',
  DATA_EXPORT: 'data_export',
  ADVANCED_GOAL_TRACKING: 'advanced_goal_tracking',
};

/**
 * Free tier limits
 */
export const FREE_LIMITS = {
  DAILY_MEAL_LOGS: 3,
  WEEKLY_WORKOUTS: 5,
  SAVED_RECIPES: 10,
  GOAL_TRACKING_DAYS: 7,
};

/**
 * Premium Features Service
 * Handles feature gating and premium status checks
 */
class PremiumFeaturesService {
  constructor() {
    this.premiumStatus = null;
    this.lastCheck = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if user has premium access
   * @returns {Promise<boolean>}
   */
  async hasPremiumAccess() {
    try {
      // Use cached result if recent
      if (this.premiumStatus !== null && 
          this.lastCheck && 
          Date.now() - this.lastCheck < this.cacheTimeout) {
        return this.premiumStatus;
      }

      // Check with RevenueCat
      const hasAccess = await revenueCatService.hasActiveSubscription();
      
      // Update cache
      this.premiumStatus = hasAccess;
      this.lastCheck = Date.now();
      
      return hasAccess;
    } catch (error) {
      console.error('Error checking premium access:', error);
      // Return cached result if available, otherwise false
      return this.premiumStatus || false;
    }
  }

  /**
   * Check if a specific feature is available to the user
   * @param {string} feature - Feature key from PREMIUM_FEATURES
   * @returns {Promise<boolean>}
   */
  async canAccessFeature(feature) {
    if (!Object.values(PREMIUM_FEATURES).includes(feature)) {
      console.warn(`Unknown feature: ${feature}`);
      return false;
    }

    return await this.hasPremiumAccess();
  }

  /**
   * Check if user has reached a usage limit
   * @param {string} limitType - Key from FREE_LIMITS
   * @param {number} currentUsage - Current usage count
   * @returns {Promise<boolean>}
   */
  async hasReachedLimit(limitType, currentUsage) {
    const isPremium = await this.hasPremiumAccess();
    
    if (isPremium) {
      return false; // Premium users have no limits
    }

    const limit = FREE_LIMITS[limitType];
    if (limit === undefined) {
      console.warn(`Unknown limit type: ${limitType}`);
      return false;
    }

    return currentUsage >= limit;
  }

  /**
   * Get remaining usage for free tier
   * @param {string} limitType - Key from FREE_LIMITS
   * @param {number} currentUsage - Current usage count
   * @returns {Promise<number>}
   */
  async getRemainingUsage(limitType, currentUsage) {
    const isPremium = await this.hasPremiumAccess();
    
    if (isPremium) {
      return Infinity; // Unlimited for premium
    }

    const limit = FREE_LIMITS[limitType];
    if (limit === undefined) {
      return 0;
    }

    return Math.max(0, limit - currentUsage);
  }

  /**
   * Clear premium status cache (call after purchase/restore)
   */
  clearCache() {
    this.premiumStatus = null;
    this.lastCheck = null;
  }

  /**
   * Get feature description for premium upgrade prompts
   * @param {string} feature - Feature key
   * @returns {object}
   */
  getFeatureInfo(feature) {
    const featureInfo = {
      [PREMIUM_FEATURES.UNLIMITED_MEAL_LOGGING]: {
        title: 'Unlimited Meal Logging',
        description: 'Log unlimited meals per day without restrictions',
        icon: '🍽️'
      },
      [PREMIUM_FEATURES.ADVANCED_NUTRITION_INSIGHTS]: {
        title: 'Advanced Nutrition Insights',
        description: 'Detailed macro tracking, nutrient analysis, and trends',
        icon: '📊'
      },
      [PREMIUM_FEATURES.MEAL_PLANNING]: {
        title: 'AI Meal Planning',
        description: 'Personalized meal plans based on your goals',
        icon: '🗓️'
      },
      [PREMIUM_FEATURES.BARCODE_SCANNING]: {
        title: 'Barcode Scanning',
        description: 'Instantly log food by scanning barcodes',
        icon: '📱'
      },
      [PREMIUM_FEATURES.UNLIMITED_WORKOUTS]: {
        title: 'Unlimited Workouts',
        description: 'Access unlimited workout sessions per week',
        icon: '💪'
      },
      [PREMIUM_FEATURES.CUSTOM_WORKOUT_PLANS]: {
        title: 'Custom Workout Plans',
        description: 'AI-generated workouts tailored to your fitness level',
        icon: '🏋️'
      },
      [PREMIUM_FEATURES.GOOGLE_FIT_SYNC]: {
        title: 'Google Fit Integration',
        description: 'Sync health data with Google Fit automatically',
        icon: '🔄'
      },
      [PREMIUM_FEATURES.AD_FREE_EXPERIENCE]: {
        title: 'Ad-Free Experience',
        description: 'Enjoy Core+ without any advertisements',
        icon: '✨'
      },
      [PREMIUM_FEATURES.DATA_EXPORT]: {
        title: 'Data Export',
        description: 'Export your health and fitness data anytime',
        icon: '📤'
      },
    };

    return featureInfo[feature] || {
      title: 'Premium Feature',
      description: 'Unlock with Core+ Premium',
      icon: '⭐'
    };
  }
}

// Export singleton instance
export const premiumFeaturesService = new PremiumFeaturesService();

/**
 * Hook for React components to check premium features
 * @param {string} feature - Feature to check
 * @returns {object} { canAccess: boolean, loading: boolean, checkAccess: function }
 */
export const usePremiumFeature = (feature) => {
  const [canAccess, setCanAccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const checkAccess = React.useCallback(async () => {
    setLoading(true);
    try {
      const hasAccess = await premiumFeaturesService.canAccessFeature(feature);
      setCanAccess(hasAccess);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  React.useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { canAccess, loading, checkAccess };
};

/**
 * Hook to check usage limits
 * @param {string} limitType - Type of limit to check
 * @param {number} currentUsage - Current usage count
 * @returns {object} { hasReachedLimit: boolean, remaining: number, loading: boolean }
 */
export const useUsageLimit = (limitType, currentUsage) => {
  const [hasReachedLimit, setHasReachedLimit] = React.useState(false);
  const [remaining, setRemaining] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkLimit = async () => {
      setLoading(true);
      try {
        const [reachedLimit, remainingUsage] = await Promise.all([
          premiumFeaturesService.hasReachedLimit(limitType, currentUsage),
          premiumFeaturesService.getRemainingUsage(limitType, currentUsage)
        ]);
        
        setHasReachedLimit(reachedLimit);
        setRemaining(remainingUsage);
      } catch (error) {
        console.error('Error checking usage limit:', error);
        setHasReachedLimit(true); // Fail safe
        setRemaining(0);
      } finally {
        setLoading(false);
      }
    };

    checkLimit();
  }, [limitType, currentUsage]);

  return { hasReachedLimit, remaining, loading };
};

export default premiumFeaturesService;
