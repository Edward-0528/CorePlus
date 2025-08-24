// Affiliate Code Service for Core+
import { supabase } from '../supabaseConfig';

export const affiliateService = {
  // Validate if an affiliate code exists and is active
  async validateAffiliateCode(code) {
    try {
      if (!code || code.trim() === '') {
        return { isValid: false, error: 'Code is required' };
      }

      const { data, error } = await supabase
        .rpc('validate_affiliate_code', { code: code.toUpperCase() });

      if (error) {
        console.error('Error validating affiliate code:', error);
        return { isValid: false, error: 'Failed to validate code' };
      }

      return { isValid: data, error: null };
    } catch (error) {
      console.error('Affiliate code validation error:', error);
      return { isValid: false, error: 'Validation failed' };
    }
  },

  // Get influencer information by affiliate code
  async getInfluencerByCode(code) {
    try {
      const { data, error } = await supabase
        .rpc('get_influencer_by_code', { code: code.toUpperCase() });

      if (error) {
        console.error('Error getting influencer by code:', error);
        return { influencer: null, error: 'Failed to get influencer info' };
      }

      return { influencer: data, error: null };
    } catch (error) {
      console.error('Get influencer error:', error);
      return { influencer: null, error: 'Failed to get influencer' };
    }
  },

  // Record affiliate code usage when user signs up
  async recordAffiliateUsage(userId, affiliateCode) {
    try {
      if (!affiliateCode || affiliateCode.trim() === '') {
        return { success: true, message: 'No affiliate code to record' };
      }

      // First validate the code
      const validation = await this.validateAffiliateCode(affiliateCode);
      if (!validation.isValid) {
        console.warn('Invalid affiliate code provided:', affiliateCode);
        return { success: false, error: 'Invalid affiliate code' };
      }

      // Get the influencer ID
      const influencerResult = await this.getInfluencerByCode(affiliateCode);
      if (!influencerResult.influencer) {
        return { success: false, error: 'Influencer not found' };
      }

      // Record the usage
      const usageData = {
        user_id: userId,
        influencer_id: influencerResult.influencer,
        affiliate_code: affiliateCode.toUpperCase(),
        used_at: new Date().toISOString(),
        signup_completed: true,
        commission_eligible: false, // Will be updated when subscription starts
        referral_source: 'signup'
      };

      const { data, error } = await supabase
        .from('affiliate_usage')
        .insert(usageData)
        .select();

      if (error) {
        console.error('Error recording affiliate usage:', error);
        return { success: false, error: 'Failed to record affiliate usage' };
      }

      console.log('✅ Affiliate usage recorded successfully:', data);
      return { success: true, data: data[0] };

    } catch (error) {
      console.error('Record affiliate usage error:', error);
      return { success: false, error: 'Failed to record affiliate usage' };
    }
  },

  // Update affiliate usage when subscription starts (for commission calculation)
  async updateSubscriptionStatus(userId, subscriptionPlan, subscriptionAmount) {
    try {
      const { data, error } = await supabase
        .from('affiliate_usage')
        .update({
          subscription_started: true,
          subscription_start_date: new Date().toISOString(),
          subscription_plan: subscriptionPlan,
          subscription_amount: subscriptionAmount,
          commission_eligible: true,
          commission_amount: subscriptionAmount * 0.10 // Default 10% commission, should be calculated based on influencer's rate
        })
        .eq('user_id', userId)
        .eq('signup_completed', true)
        .select();

      if (error) {
        console.error('Error updating subscription status:', error);
        return { success: false, error: 'Failed to update subscription status' };
      }

      console.log('✅ Subscription status updated for affiliate tracking:', data);
      return { success: true, data };

    } catch (error) {
      console.error('Update subscription status error:', error);
      return { success: false, error: 'Failed to update subscription status' };
    }
  },

  // Get affiliate usage stats for a user (for debugging/admin)
  async getUserAffiliateUsage(userId) {
    try {
      const { data, error } = await supabase
        .from('affiliate_usage')
        .select(`
          *,
          influencers (
            name,
            affiliate_code,
            commission_rate
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting user affiliate usage:', error);
        return { usage: [], error: 'Failed to get affiliate usage' };
      }

      return { usage: data || [], error: null };

    } catch (error) {
      console.error('Get user affiliate usage error:', error);
      return { usage: [], error: 'Failed to get affiliate usage' };
    }
  },

  // Get all influencers (for admin dashboard)
  async getAllInfluencers() {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting influencers:', error);
        return { influencers: [], error: 'Failed to get influencers' };
      }

      return { influencers: data || [], error: null };

    } catch (error) {
      console.error('Get influencers error:', error);
      return { influencers: [], error: 'Failed to get influencers' };
    }
  }
};

export default affiliateService;
