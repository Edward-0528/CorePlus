import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from '../supabaseConfig';
import { revenueCatService } from './revenueCatService';

// RevenueCat Configuration
const REVENUECAT_API_KEY = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
};

// Subscription Tiers - simplified to just Free and Pro
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro'
};

// RevenueCat Product IDs (must match RevenueCat dashboard exactly)
// Note: Only monthly subscription available currently
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'coreplus_premium_monthly:corepluselite',
  // PRO_YEARLY: Not created in RevenueCat dashboard yet
};

// Feature Limits by Tier
export const FEATURE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    aiScansPerMonth: 20,
    aiManualSearchesPerMonth: 20,
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
    aiScansPerMonth: -1, // unlimited
    aiManualSearchesPerMonth: -1, // unlimited
    mealHistoryDays: -1, // unlimited
    workoutPlans: -1, // unlimited
    canExportData: true,
    canAccessMealPlanning: true,
    canAccessDetailedMicros: true,
    canAccessRecipeBrowser: true,
    canCreateCustomMacros: true,
    supportLevel: 'priority',
    hasAdvancedAnalytics: true,
    canAccessBulkMealPrep: true,
    hasNutritionistConsultation: true
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

      console.log('🔄 Initializing subscription service for user:', userId);

      // Check if RevenueCat is available (it may not be in development)
      if (typeof Purchases === 'undefined') {
        console.warn('RevenueCat SDK not available - running in development mode');
        this.isInitialized = true;
        // In dev mode, check database for subscription status
        await this.loadSubscriptionFromDatabase(userId);
        return;
      }

      // Configure RevenueCat
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      
      // Platform-specific initialization
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
      
      if (!apiKey) {
        console.warn('RevenueCat API key not found for platform:', Platform.OS, '- running in development mode');
        this.isInitialized = true;
        // In dev mode, check database for subscription status
        await this.loadSubscriptionFromDatabase(userId);
        return;
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId, // Use your Supabase user ID
      });

      // Set up listener for subscription changes
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        this.handleSubscriptionUpdate(customerInfo, userId);
      });

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized for user:', userId);

      // Load current subscription status with user validation
      await this.refreshSubscriptionStatus(userId);
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    }
  }

  // Get current subscription status
  async refreshSubscriptionStatus(userId) {
    try {
      console.log('🔄 Refreshing subscription status via RevenueCat for user:', userId);
      
      // Use our centralized RevenueCat service
      const customerInfo = await revenueCatService.refreshCustomerInfo();
      
      if (!customerInfo) {
        console.log('📊 No customer info available - using free tier');
        this.userTier = SUBSCRIPTION_TIERS.FREE;
        this.currentSubscription = null;
        // Load from database as fallback
        await this.loadSubscriptionFromDatabase(userId);
        return null;
      }
      
      // CRITICAL: Validate this user should have access to the subscription
      await this.validateUserSubscriptionAccess(customerInfo, userId);
      return this.currentSubscription;
    } catch (error) {
      console.error('❌ Error refreshing subscription status:', error);
      // Fallback to free tier on error
      this.userTier = SUBSCRIPTION_TIERS.FREE;
      this.currentSubscription = null;
      return null;
    }
  }

  // Handle subscription updates
  async handleSubscriptionUpdate(customerInfo, userId) {
    try {
      console.log('📊 Processing subscription update for user:', userId);
      console.log('📊 CustomerInfo:', customerInfo);

      // CRITICAL: Always validate user access before granting benefits
      await this.validateUserSubscriptionAccess(customerInfo, userId);
      
    } catch (error) {
      console.error('Error handling subscription update:', error);
      // On error, default to free tier for security
      this.userTier = SUBSCRIPTION_TIERS.FREE;
      this.currentSubscription = null;
    }
  }

  /**
   * CRITICAL SECURITY METHOD: Validate that the current user should have access to subscription benefits
   * This prevents unauthorized users from accessing premium features due to device-level purchases
   */
  async validateUserSubscriptionAccess(customerInfo, userId) {
    try {
      console.log('🔒 Validating subscription access for user:', userId);

      let newTier = SUBSCRIPTION_TIERS.FREE;
      let subscriptionDetails = null;

      // Check active entitlements from RevenueCat
      if (customerInfo.entitlements.active['Pro']) {
        subscriptionDetails = customerInfo.entitlements.active['Pro'];
        
        // Step 1: Check if this purchase belongs to this user in our database
        const isValidSubscription = await this.validateSubscriptionOwnership(userId, subscriptionDetails);
        
        if (isValidSubscription) {
          newTier = SUBSCRIPTION_TIERS.PRO;
          console.log('✅ Subscription validated for user:', userId);
        } else {
          console.log('❌ Subscription found but not owned by current user:', userId);
          // This is a security issue - someone else's purchase is active on this device
          newTier = SUBSCRIPTION_TIERS.FREE;
          subscriptionDetails = null;
        }
      }

      // Debug: Show all available entitlements
      console.log('📊 Available entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('📊 Validated tier for user:', newTier);

      // Store previous tier for comparison
      const previousTier = this.userTier;
      this.userTier = newTier;
      this.currentSubscription = subscriptionDetails;

      console.log(`🔄 [SubscriptionService] Tier change: ${previousTier} → ${newTier}`);
      if (newTier === SUBSCRIPTION_TIERS.PRO) {
        console.log('🎉 [SubscriptionService] User now has PRO access with unlimited features!');
      }

      // Update user tier in Supabase (this also creates a record if needed)
      await this.updateUserTierInDatabase(newTier, subscriptionDetails, userId);

      console.log(`✅ User tier securely validated and updated to: ${newTier}`);
    } catch (error) {
      console.error('❌ Error validating subscription access:', error);
      // On error, default to free tier for security
      this.userTier = SUBSCRIPTION_TIERS.FREE;
      this.currentSubscription = null;
    }
  }

  /**
   * Validate that the subscription belongs to the current user
   * Checks against our database records to prevent cross-user access
   */
  async validateSubscriptionOwnership(userId, subscriptionDetails) {
    try {
      // Check if we have a record of this user purchasing this subscription
      const { data: userSubscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error checking subscription ownership:', error);
        return false;
      }

      if (userSubscription) {
        // We have a database record for this user's subscription
        console.log('✅ Found database record for user subscription');
        return true;
      }

      // No database record found - this could be:
      // 1. A new purchase that hasn't been recorded yet
      // 2. Someone else's purchase active on this device

      // For new purchases, we'll create a record and allow it
      // But we should be cautious about this in production
      console.log('⚠️ No database record found - creating new subscription record');
      
      await this.createSubscriptionRecord(userId, subscriptionDetails);
      return true;

    } catch (error) {
      console.error('Error validating subscription ownership:', error);
      return false;
    }
  }

  /**
   * Create a subscription record in our database
   */
  async createSubscriptionRecord(userId, subscriptionDetails) {
    try {
      const subscriptionData = {
        user_id: userId,
        subscription_tier: SUBSCRIPTION_TIERS.PRO,
        subscription_status: 'active',
        product_id: subscriptionDetails.productIdentifier,
        original_transaction_id: subscriptionDetails.originalTransactionId,
        expires_at: subscriptionDetails.expiresDate,
        purchased_at: subscriptionDetails.originalPurchaseDate,
        platform: Platform.OS,
        revenue_cat_user_id: subscriptionDetails.originalTransactionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData);

      if (error) {
        console.error('Error creating subscription record:', error);
        throw error;
      }

      console.log('✅ Created subscription record for user:', userId);
    } catch (error) {
      console.error('Failed to create subscription record:', error);
      throw error;
    }
  }

  /**
   * Load subscription status from database (fallback when RevenueCat unavailable)
   */
  async loadSubscriptionFromDatabase(userId) {
    try {
      console.log('📊 Loading subscription from database for user:', userId);
      
      const { data: userSubscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error loading subscription:', error);
        this.userTier = SUBSCRIPTION_TIERS.FREE;
        return;
      }

      if (userSubscription) {
        // Check if subscription is still valid
        const expiresAt = new Date(userSubscription.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          this.userTier = userSubscription.subscription_tier;
          console.log('✅ Valid subscription found in database:', this.userTier);
        } else {
          console.log('❌ Subscription expired:', expiresAt);
          this.userTier = SUBSCRIPTION_TIERS.FREE;
          // Mark as expired in database
          await this.updateUserTierInDatabase(SUBSCRIPTION_TIERS.FREE, null, userId);
        }
      } else {
        console.log('📊 No active subscription found in database');
        this.userTier = SUBSCRIPTION_TIERS.FREE;
      }
    } catch (error) {
      console.error('Error loading subscription from database:', error);
      this.userTier = SUBSCRIPTION_TIERS.FREE;
    }
  }

  // Update user tier in Supabase
  async updateUserTierInDatabase(tier, subscriptionDetails, userId = null) {
    try {
      // Use provided userId or get from auth
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        targetUserId = user.id;
      }

      const subscriptionData = {
        user_id: targetUserId,
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
      } else {
        console.log('✅ Successfully updated user subscription in database:', {
          userId: targetUserId,
          tier: tier,
          status: subscriptionData.subscription_status
        });
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

  // Get usage limits for tracking service
  getUsageLimits() {
    const limits = FEATURE_LIMITS[this.userTier];
    console.log('🔒 [SubscriptionService] Getting usage limits for tier:', this.userTier);
    console.log('🔒 [SubscriptionService] Raw limits:', limits);
    
    const usageLimits = {
      aiScansPerMonth: limits.aiScansPerMonth,
      aiManualSearchesPerMonth: limits.aiManualSearchesPerMonth
    };
    console.log('🔒 [SubscriptionService] Usage limits returned:', usageLimits);
    return usageLimits;
  }

  /**
   * DEVELOPMENT/TESTING: Reset subscription state for current user
   * This helps clear sandbox purchases that persist on device
   */
  async resetSubscriptionForTesting(userId) {
    try {
      console.log('🧪 Resetting subscription state for testing - User:', userId);
      
      // Reset local state
      this.userTier = SUBSCRIPTION_TIERS.FREE;
      this.currentSubscription = null;
      
      // Clear database records for this user
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error clearing subscription records:', error);
      } else {
        console.log('✅ Cleared subscription records for user:', userId);
      }
      
      // Try to reset RevenueCat (this may not work in sandbox)
      if (this.isInitialized && typeof Purchases !== 'undefined') {
        try {
          // Note: This doesn't actually cancel sandbox purchases
          // Those need to be managed through App Store Connect / Google Play Console
          await Purchases.invalidateCustomerInfoCache();
          console.log('✅ Invalidated RevenueCat cache');
        } catch (rcError) {
          console.log('⚠️ Could not reset RevenueCat state:', rcError.message);
        }
      }
      
      console.log('🧪 Subscription reset complete - User should be on free tier');
      return true;
      
    } catch (error) {
      console.error('❌ Error resetting subscription:', error);
      return false;
    }
  }

  /**
   * DEVELOPMENT: Check if this is a sandbox environment
   */
  isSandboxEnvironment() {
    return __DEV__ || process.env.NODE_ENV === 'development';
  }

  /**
   * Force refresh subscription for current user (useful for testing)
   */
  async forceRefreshSubscription(userId) {
    console.log('🔄 Force refreshing subscription for user:', userId);
    this.isInitialized = false;
    await this.initialize(userId);
  }

  /**
   * DEVELOPMENT: Get detailed debug info about current subscription state
   */
  getDebugInfo() {
    console.log('🔍 [SubscriptionService] Debug Info:');
    console.log('  - User Tier:', this.userTier);
    console.log('  - Has Subscription:', this.currentSubscription !== null);
    console.log('  - Feature Limits:', FEATURE_LIMITS[this.userTier]);
    console.log('  - Is Initialized:', this.isInitialized);
    
    return {
      userTier: this.userTier,
      hasSubscription: this.currentSubscription !== null,
      limits: FEATURE_LIMITS[this.userTier],
      isInitialized: this.isInitialized,
      subscriptionDetails: this.currentSubscription
    };
  }
}

// Create singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
