import { supabase } from '../supabaseConfig';
import userSubscriptionService from './userSubscriptionService';

/**
 * Testing utilities for RevenueCat integration
 */
export class SubscriptionTestingService {
  
  /**
   * Simulate a premium subscription for testing
   */
  async simulatePremiumSubscription(userId, tier = 'pro', durationDays = 30) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
          subscription_product_id: `test_${tier}_monthly`,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Log the test event
      await this.logTestEvent(userId, 'premium_simulated', { tier, durationDays });

      console.log(`✅ Simulated ${tier} subscription for user ${userId} for ${durationDays} days`);
      return true;

    } catch (error) {
      console.error('❌ Failed to simulate premium subscription:', error);
      return false;
    }
  }

  /**
   * Simulate subscription expiration
   */
  async simulateSubscriptionExpiration(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'expired',
          subscription_expires_at: new Date().toISOString(), // Expired now
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      await this.logTestEvent(userId, 'subscription_expired');

      console.log(`⚠️ Simulated subscription expiration for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to simulate subscription expiration:', error);
      return false;
    }
  }

  /**
   * Reset user to free tier
   */
  async resetToFreeTier(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          subscription_expires_at: null,
          subscription_product_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Clear daily usage
      await supabase
        .from('daily_usage')
        .delete()
        .eq('user_id', userId);

      await this.logTestEvent(userId, 'reset_to_free');

      console.log(`🔄 Reset user ${userId} to free tier`);
      return true;

    } catch (error) {
      console.error('❌ Failed to reset user to free tier:', error);
      return false;
    }
  }

  /**
   * Simulate daily usage for testing limits
   */
  async simulateDailyUsage(userId, featureName, count = 1) {
    try {
      for (let i = 0; i < count; i++) {
        await supabase.rpc('increment_daily_usage', { 
          feature_name: featureName 
        });
      }

      const { data, error } = await supabase
        .from('daily_usage')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('feature_name', featureName)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const usageCount = data?.usage_count || 0;
      console.log(`📊 User ${userId} has used ${featureName} ${usageCount} times today`);
      
      return usageCount;

    } catch (error) {
      console.error('❌ Failed to simulate daily usage:', error);
      return 0;
    }
  }

  /**
   * Check current subscription status
   */
  async checkSubscriptionStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        console.log(`❓ No subscription profile found for user ${userId}`);
        return null;
      }

      const status = {
        tier: data.subscription_tier,
        status: data.subscription_status,
        expiresAt: data.subscription_expires_at,
        productId: data.subscription_product_id,
        isActive: data.subscription_status === 'active' && 
                 (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date()),
      };

      console.log(`📋 Subscription status for user ${userId}:`, status);
      return status;

    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return null;
    }
  }

  /**
   * Get daily usage summary
   */
  async getDailyUsageSummary(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_usage')
        .select('feature_name, usage_count')
        .eq('user_id', userId)
        .eq('usage_date', today);

      if (error) throw error;

      const summary = data.reduce((acc, item) => {
        acc[item.feature_name] = item.usage_count;
        return acc;
      }, {});

      console.log(`📊 Daily usage summary for user ${userId}:`, summary);
      return summary;

    } catch (error) {
      console.error('❌ Failed to get daily usage summary:', error);
      return {};
    }
  }

  /**
   * Test feature access
   */
  async testFeatureAccess(userId, featureName) {
    try {
      console.log(`🧪 Testing feature access for ${featureName}...`);
      
      // Check subscription status
      const subscription = await this.checkSubscriptionStatus(userId);
      if (!subscription) {
        console.log('❌ No subscription found');
        return false;
      }

      // Check if premium user
      if (subscription.isActive && subscription.tier !== 'free') {
        console.log('✅ Premium user - access granted');
        return true;
      }

      // Check daily limits for free users
      const usage = await this.getDailyUsageSummary(userId);
      const currentUsage = usage[featureName] || 0;
      
      // Define limits (should match your app's limits)
      const limits = {
        'ai_scans': 5,
        'meal_logs': 3,
        'workouts': 2,
      };

      const limit = limits[featureName] || 999;
      const hasAccess = currentUsage < limit;

      console.log(`📊 Feature ${featureName}: ${currentUsage}/${limit} used - ${hasAccess ? 'Access granted' : 'Limit reached'}`);
      return hasAccess;

    } catch (error) {
      console.error('❌ Failed to test feature access:', error);
      return false;
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(userId) {
    console.log(`🧪 Running comprehensive test suite for user ${userId}`);
    
    try {
      // 1. Check initial state
      console.log('\n--- Initial State ---');
      await this.checkSubscriptionStatus(userId);
      await this.getDailyUsageSummary(userId);

      // 2. Test as free user
      console.log('\n--- Testing Free User Limits ---');
      await this.resetToFreeTier(userId);
      
      // Simulate usage until limit
      await this.simulateDailyUsage(userId, 'ai_scans', 5);
      await this.testFeatureAccess(userId, 'ai_scans'); // Should be false

      // 3. Test premium upgrade
      console.log('\n--- Testing Premium Upgrade ---');
      await this.simulatePremiumSubscription(userId, 'pro');
      await this.testFeatureAccess(userId, 'ai_scans'); // Should be true

      // 4. Test subscription expiration
      console.log('\n--- Testing Subscription Expiration ---');
      await this.simulateSubscriptionExpiration(userId);
      await this.testFeatureAccess(userId, 'ai_scans'); // Should be false

      console.log('\n✅ Test suite completed successfully!');
      return true;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }

  /**
   * Log test events for debugging
   */
  async logTestEvent(userId, eventType, data = {}) {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: `test_${eventType}`,
          event_data: { ...data, timestamp: new Date().toISOString() },
        });
    } catch (error) {
      console.error('Failed to log test event:', error);
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(userId) {
    try {
      // Remove test events
      await supabase
        .from('subscription_events')
        .delete()
        .eq('user_id', userId)
        .like('event_type', 'test_%');

      // Reset user to free tier
      await this.resetToFreeTier(userId);

      console.log(`🧹 Cleaned up test data for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      return false;
    }
  }
}

export default new SubscriptionTestingService();
