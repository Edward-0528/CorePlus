import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from '../supabaseConfig';

// RevenueCat Configuration
const REVENUECAT_API_KEY = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
};

// Subscription Tiers - matching your pricing strategy
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ELITE: 'elite'
};

// RevenueCat Product IDs (configure these in RevenueCat dashboard)
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'core_plus_pro_monthly',
  PRO_YEARLY: 'core_plus_pro_yearly',
  ELITE_MONTHLY: 'core_plus_elite_monthly',
  ELITE_YEARLY: 'core_plus_elite_yearly',
};

// Feature Limits by Tier
export const FEATURE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    aiScansPerDay: 5,
    mealHistoryDays: 7,
    workoutPlans: 1,
    canExportData: false,
    canAccessMealPlanning: false,
    canAccessDetailedMicros: false,
    canAccessRecipeBrowser: false,
    canCreateCustomMacros: false,
    supportLevel: 'community'
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    aiScansPerDay: -1, // unlimited
    mealHistoryDays: 90,
    workoutPlans: 5,
    canExportData: true,
    canAccessMealPlanning: true,
    canAccessDetailedMicros: true,
    canAccessRecipeBrowser: true,
    canCreateCustomMacros: true,
    supportLevel: 'priority'
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    aiScansPerDay: -1, // unlimited
    mealHistoryDays: 365,
    workoutPlans: -1, // unlimited
    canExportData: true,
    canAccessMealPlanning: true,
    canAccessDetailedMicros: true,
    canAccessRecipeBrowser: true,
    canCreateCustomMacros: true,
    supportLevel: 'premium',
    hasNutritionistConsultation: true,
    canAccessAdvancedAnalytics: true,
    canAccessBulkMealPrep: true
  }
};

class SubscriptionService {
  constructor() {
    this.isInitialized = false;
    this.currentSubscription = null;
    this.userTier = SUBSCRIPTION_TIERS.FREE;
  }

  // Initialize RevenueCat
  async initialize(userId) {
    try {
      if (this.isInitialized) return;

      // Check if RevenueCat is available (it may not be in development)
      if (typeof Purchases === 'undefined') {
        console.warn('RevenueCat SDK not available - running in development mode');
        this.isInitialized = true;
        return;
      }

      // Configure RevenueCat
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      
      // Platform-specific initialization
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
      
      if (!apiKey) {
        console.warn('RevenueCat API key not found for platform:', Platform.OS, '- running in development mode');
        this.isInitialized = true;
        return;
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId, // Use your Supabase user ID
      });

      // Set up listener for subscription changes
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        this.handleSubscriptionUpdate(customerInfo);
      });

      this.isInitialized = true;
      console.log('🔄 RevenueCat initialized for user:', userId);

      // Load current subscription status
      await this.refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    }
  }

  // Get current subscription status
  async refreshSubscriptionStatus() {
    try {
      if (!this.isInitialized || typeof Purchases === 'undefined') {
        console.log('RevenueCat not initialized - using free tier');
        return this.currentSubscription;
      }
      
      const customerInfo = await Purchases.getCustomerInfo();
      await this.handleSubscriptionUpdate(customerInfo);
      return this.currentSubscription;
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      return null;
    }
  }

  // Handle subscription updates
  async handleSubscriptionUpdate(customerInfo) {
    try {
      console.log('📊 Processing subscription update:', customerInfo);

      let newTier = SUBSCRIPTION_TIERS.FREE;
      let subscriptionDetails = null;

      // Check active entitlements
      if (customerInfo.entitlements.active['elite']) {
        newTier = SUBSCRIPTION_TIERS.ELITE;
        subscriptionDetails = customerInfo.entitlements.active['elite'];
      } else if (customerInfo.entitlements.active['pro']) {
        newTier = SUBSCRIPTION_TIERS.PRO;
        subscriptionDetails = customerInfo.entitlements.active['pro'];
      }

      this.userTier = newTier;
      this.currentSubscription = subscriptionDetails;

      // Update user tier in Supabase
      await this.updateUserTierInDatabase(newTier, subscriptionDetails);

      console.log(`✅ User tier updated to: ${newTier}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  // Update user tier in Supabase
  async updateUserTierInDatabase(tier, subscriptionDetails) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscriptionData = {
        user_id: user.id,
        subscription_tier: tier,
        subscription_status: subscriptionDetails ? 'active' : 'free',
        subscription_product_id: subscriptionDetails?.productIdentifier || null,
        subscription_expires_at: subscriptionDetails?.expirationDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData);

      if (error) {
        console.error('Error updating subscription in database:', error);
      }
    } catch (error) {
      console.error('Error updating user tier in database:', error);
    }
  }

  // Get available products/packages
  async getAvailableProducts() {
    try {
      if (!this.isInitialized || typeof Purchases === 'undefined') {
        console.log('RevenueCat not available - returning mock packages');
        return {
          packages: [],
          monthly: null,
          annual: null
        };
      }
      
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null) {
        return {
          packages: offerings.current.availablePackages,
          monthly: offerings.current.monthly,
          annual: offerings.current.annual
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting available products:', error);
      return null;
    }
  }

  // Purchase a subscription
  async purchaseSubscription(packageToPurchase) {
    try {
      if (!this.isInitialized || typeof Purchases === 'undefined') {
        return {
          success: false,
          error: 'RevenueCat not configured. Please set up your RevenueCat API keys.'
        };
      }
      
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      // Handle successful purchase
      await this.handleSubscriptionUpdate(customerInfo);
      
      return {
        success: true,
        customerInfo,
        productIdentifier
      };
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      
      if (error.userCancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'Purchase cancelled by user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Purchase failed'
      };
    }
  }

  // Restore purchases
  async restorePurchases() {
    try {
      if (!this.isInitialized || typeof Purchases === 'undefined') {
        return {
          success: false,
          error: 'RevenueCat not configured. Please set up your RevenueCat API keys.'
        };
      }
      
      const customerInfo = await Purchases.restorePurchases();
      await this.handleSubscriptionUpdate(customerInfo);
      
      return {
        success: true,
        customerInfo
      };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore purchases'
      };
    }
  }

  // Check if user can access a feature
  canAccessFeature(featureName) {
    const limits = FEATURE_LIMITS[this.userTier];
    return limits[featureName] || false;
  }

  // Get feature limit for current tier
  getFeatureLimit(featureName) {
    const limits = FEATURE_LIMITS[this.userTier];
    return limits[featureName];
  }

  // Check daily usage limits
  async checkDailyUsage(featureName, userId) {
    try {
      const limit = this.getFeatureLimit(featureName);
      
      if (limit === -1) return { canUse: true, remaining: -1 }; // unlimited
      
      // Get today's usage from database
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_feature_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature_name', featureName)
        .eq('usage_date', today)
        .single();

      const currentUsage = data?.usage_count || 0;
      const remaining = Math.max(0, limit - currentUsage);
      
      return {
        canUse: currentUsage < limit,
        used: currentUsage,
        remaining,
        limit
      };
    } catch (error) {
      console.error('Error checking daily usage:', error);
      return { canUse: false, remaining: 0 };
    }
  }

  // Increment daily usage
  async incrementDailyUsage(featureName, userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.rpc('increment_daily_usage', {
        p_user_id: userId,
        p_feature_name: featureName,
        p_usage_date: today
      });

      if (error) {
        console.error('Error incrementing daily usage:', error);
      }
    } catch (error) {
      console.error('Error incrementing daily usage:', error);
    }
  }

  // Get current user tier
  getCurrentTier() {
    return this.userTier;
  }

  // Check if user is premium (Pro or Elite)
  isPremium() {
    return this.userTier !== SUBSCRIPTION_TIERS.FREE;
  }

  // Get subscription details for display
  getSubscriptionInfo() {
    return {
      tier: this.userTier,
      isActive: this.currentSubscription !== null,
      expiresAt: this.currentSubscription?.expirationDate,
      productId: this.currentSubscription?.productIdentifier,
      limits: FEATURE_LIMITS[this.userTier]
    };
  }
}

// Create singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
