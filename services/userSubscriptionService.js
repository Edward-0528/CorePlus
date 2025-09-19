import { supabase } from '../supabaseConfig';
import { revenueCatService } from './revenueCatService';
import subscriptionService, { SUBSCRIPTION_TIERS } from './subscriptionService';

/**
 * User Subscription Service
 * Syncs Supabase user data with RevenueCat subscription status
 * Ensures subscription status is always accurate
 */
class UserSubscriptionService {
  constructor() {
    this.currentUser = null;
    this.subscriptionStatus = null;
    this.listeners = [];
  }

  /**
   * Initialize service when user signs in
   */
  async initializeForUser(supabaseUser) {
    try {
      this.currentUser = supabaseUser;
      
      // Link Supabase user to RevenueCat
      await this.linkUserToRevenueCat(supabaseUser);
      
      // Get current subscription status
      await this.syncSubscriptionStatus();
      
      // Set up webhooks listener for real-time updates
      this.setupSubscriptionListener();
      
      console.log('✅ User subscription service initialized for:', supabaseUser.email);
      
    } catch (error) {
      console.error('❌ Failed to initialize user subscription service:', error);
      throw error;
    }
  }

  /**
   * Link Supabase user to RevenueCat with proper user ID
   */
  async linkUserToRevenueCat(supabaseUser) {
    try {
      console.log('🔗 Linking user to RevenueCat:', supabaseUser.id, supabaseUser.email);
      
      // Ensure RevenueCat is initialized before setting user ID
      const initResult = await revenueCatService.initialize();
      if (!initResult.success) {
        console.warn('⚠️ RevenueCat initialization failed, skipping user linking:', initResult.error);
        return;
      }
      
      // Use Supabase user ID as RevenueCat user ID for consistency
      await revenueCatService.setUserID(supabaseUser.id);
      
      // Store user metadata in RevenueCat
      try {
        await revenueCatService.setAttributes({
          email: supabaseUser.email,
          supabase_user_id: supabaseUser.id,
          created_at: supabaseUser.created_at,
          user_type: 'free' // Mark as free user initially
        });
        console.log('📋 User attributes set in RevenueCat');
      } catch (attributeError) {
        console.warn('⚠️ Failed to set RevenueCat attributes:', attributeError.message);
      }
      
      console.log('✅ User linked to RevenueCat:', supabaseUser.id);
      
    } catch (error) {
      console.error('❌ Failed to link user to RevenueCat:', error.message);
      // Don't throw error to prevent app crashes
    }
  }

  /**
   * Sync subscription status between RevenueCat and Supabase
   */
  async syncSubscriptionStatus() {
    try {
      // Get subscription status from RevenueCat
      const revenueCatStatus = await revenueCatService.getSubscriptionStatus();
      
      // Update Supabase user profile with subscription status
      await this.updateSupabaseUserProfile(revenueCatStatus);
      
      // Update local state
      this.subscriptionStatus = revenueCatStatus;
      
      // Notify listeners
      this.notifyListeners(revenueCatStatus);
      
      console.log('🔄 Subscription status synced:', revenueCatStatus);
      
      return revenueCatStatus;
      
    } catch (error) {
      console.error('❌ Failed to sync subscription status:', error);
      throw error;
    }
  }

  /**
   * Update Supabase user profile with subscription data
   */
  async updateSupabaseUserProfile(subscriptionStatus) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: this.currentUser.id,
          subscription_tier: subscriptionStatus.tier,
          subscription_status: subscriptionStatus.status,
          subscription_expires_at: subscriptionStatus.expiresAt,
          subscription_product_id: subscriptionStatus.productId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      console.log('✅ Supabase user profile updated with subscription data');
      
    } catch (error) {
      console.error('❌ Failed to update Supabase user profile:', error);
      // Don't throw - this is not critical for app functionality
    }
  }

  /**
   * Set up real-time subscription listener
   */
  setupSubscriptionListener() {
    // Listen for RevenueCat webhook events
    revenueCatService.onSubscriptionChange((event) => {
      console.log('🔔 Subscription change detected:', event);
      this.syncSubscriptionStatus();
    });
  }

  /**
   * Check if user can access a premium feature
   */
  async canAccessFeature(featureName) {
    try {
      // First check if we have cached subscription status
      if (!this.subscriptionStatus) {
        await this.syncSubscriptionStatus();
      }
      
      const isPremium = this.subscriptionStatus?.tier !== SUBSCRIPTION_TIERS.FREE;
      
      // Check specific feature permissions
      switch (featureName) {
        case 'unlimited_ai_scans':
          return isPremium;
        case 'meal_planning':
          return isPremium;
        case 'detailed_micros':
          return isPremium;
        case 'recipe_browser':
          return isPremium;
        case 'data_export':
          return isPremium;
        case 'custom_macros':
          return isPremium;
        default:
          return true; // Free features
      }
      
    } catch (error) {
      console.error('❌ Error checking feature access:', error);
      return false; // Fail safely - deny access on error
    }
  }

  /**
   * Check daily usage limits for free users
   */
  async checkDailyUsageLimit(featureName, userId) {
    try {
      // Premium users have unlimited access
      if (this.subscriptionStatus?.tier !== SUBSCRIPTION_TIERS.FREE) {
        return { canUse: true, used: 0, limit: -1 };
      }
      
      // Check daily usage from Supabase
      const today = new Date().toISOString().split('T')[0];
      
      let tableName, limitCount;
      switch (featureName) {
        case 'ai_scans':
          tableName = 'ai_scan_usage';
          limitCount = 5;
          break;
        case 'meal_logs':
          tableName = 'meal_logs';
          limitCount = 3;
          break;
        default:
          return { canUse: true, used: 0, limit: -1 };
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);
      
      if (error) throw error;
      
      const used = data?.length || 0;
      const canUse = used < limitCount;
      
      return { canUse, used, limit: limitCount };
      
    } catch (error) {
      console.error('❌ Error checking daily usage:', error);
      return { canUse: false, used: 0, limit: 0 };
    }
  }

  /**
   * Handle subscription purchase success
   */
  async onSubscriptionPurchased(purchaseInfo) {
    try {
      console.log('🎉 Subscription purchased:', purchaseInfo);
      
      // Sync the new subscription status
      await this.syncSubscriptionStatus();
      
      // Log the purchase event
      await this.logSubscriptionEvent('purchased', purchaseInfo);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error handling subscription purchase:', error);
      return false;
    }
  }

  /**
   * Handle subscription cancellation/expiration
   */
  async onSubscriptionExpired() {
    try {
      console.log('⚠️ Subscription expired or cancelled');
      
      // Sync status to reflect expiration
      await this.syncSubscriptionStatus();
      
      // Log the event
      await this.logSubscriptionEvent('expired');
      
      // Show user a re-subscribe prompt (optional)
      this.showResubscribePrompt();
      
    } catch (error) {
      console.error('❌ Error handling subscription expiration:', error);
    }
  }

  /**
   * Log subscription events to Supabase for analytics
   */
  async logSubscriptionEvent(eventType, data = {}) {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          user_id: this.currentUser.id,
          event_type: eventType,
          event_data: data,
          created_at: new Date().toISOString(),
        });
        
    } catch (error) {
      console.error('❌ Failed to log subscription event:', error);
    }
  }

  /**
   * Show re-subscribe prompt when subscription expires
   */
  showResubscribePrompt() {
    // This would typically show a modal or notification
    console.log('🔄 User should be prompted to resubscribe');
  }

  /**
   * Subscribe to subscription status changes
   */
  onSubscriptionStatusChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of subscription changes
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ Error in subscription listener:', error);
      }
    });
  }

  /**
   * Clean up when user signs out
   */
  async cleanup() {
    try {
      await revenueCatService.logout();
      this.currentUser = null;
      this.subscriptionStatus = null;
      this.listeners = [];
      
      console.log('🧹 User subscription service cleaned up');
      
    } catch (error) {
      console.error('❌ Error cleaning up subscription service:', error);
    }
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus() {
    return this.subscriptionStatus;
  }

  /**
   * Force refresh subscription status
   */
  async refreshSubscriptionStatus() {
    return await this.syncSubscriptionStatus();
  }
}

export default new UserSubscriptionService();
