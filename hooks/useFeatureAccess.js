import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import usageTrackingService from '../services/usageTrackingService';
import { presentPaywallIfNeeded } from '../services/paywallService';

/**
 * Enhanced Feature Access Hook
 * Manages premium features, usage limits, and subscription prompts
 */
export const useFeatureAccess = () => {
  const { subscriptionInfo, refreshSubscription } = useSubscription();
  const [usageStats, setUsageStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load usage stats when component mounts or subscription changes
  useEffect(() => {
    loadUsageStats();
  }, [subscriptionInfo]);

  const loadUsageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stats = await usageTrackingService.getUsageStats(subscriptionInfo.limits);
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user can access camera scanning features
   */
  const canUseCameraScanning = () => {
    if (subscriptionInfo.isActive) return true;
    if (!usageStats) return false;
    
    return usageStats.aiScans.remaining > 0;
  };

  /**
   * Check if user can access manual search (always available)
   */
  const canUseManualSearch = () => {
    return true; // Always available for all users
  };

  /**
   * Check if user can access premium features
   */
  const canAccessPremiumFeature = (featureName) => {
    if (subscriptionInfo.isActive) return true;
    
    // Define which features require premium
    const premiumFeatures = [
      'advanced_analytics',
      'meal_planning',
      'export_data',
      'unlimited_history',
      'custom_macros',
      'ai_coach'
    ];
    
    return !premiumFeatures.includes(featureName);
  };

  /**
   * Attempt to use camera scanning with usage tracking
   */
  const useCameraScanning = async (userId) => {
    try {
      // If user is subscribed, allow unlimited access
      if (subscriptionInfo.isActive) {
        return { success: true, unlimited: true };
      }

      // Check if user has scans remaining
      if (!canUseCameraScanning()) {
        try {
          const wasDismissed = await presentPaywallIfNeeded('camera_scanning');
          
          if (wasDismissed) {
            // User cancelled paywall or there was an error
            console.log('🔄 User dismissed paywall, refreshing subscription status...');
            await refreshSubscription();
            return { success: false, reason: 'limit_reached', showedPaywall: true };
          } else {
            // User completed purchase, allow the scan
            console.log('🎉 Purchase completed! Force refreshing subscription status...');
            await refreshSubscription();
            
            // Wait a moment for RevenueCat to sync
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reload usage stats to get updated limits
            await loadUsageStats();
            
            // Double check if subscription is now active
            if (subscriptionInfo.isActive) {
              console.log('✅ Subscription confirmed active after purchase');
              return { success: true, purchased: true, unlimited: true };
            } else {
              console.log('⚠️ Subscription not yet active, allowing scan anyway');
              return { success: true, purchased: true };
            }
          }
        } catch (paywallError) {
          console.error('❌❌❌ PAYWALL ERROR - THIS IS WHY ALERT IS SHOWING:', paywallError);
          console.error('❌ Error message:', paywallError.message);
          console.error('❌ Error stack:', paywallError.stack);
          // Show fallback alert if paywall fails to display
          Alert.alert(
            'Scan Limit Reached',
            'You\'ve used all your free scans this month. Upgrade to Core+ Premium for unlimited AI food scanning!',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Learn More', onPress: () => console.log('Paywall unavailable') }
            ]
          );
          return { success: false, reason: 'limit_reached', showedPaywall: false };
        }
      }

      // Increment usage for free users
      await usageTrackingService.incrementUsage('ai_scans', userId);
      await loadUsageStats(); // Refresh stats
      
      return { success: true, remaining: usageStats.aiScans.remaining - 1 };
    } catch (error) {
      console.error('Error using camera scanning:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  };

  /**
   * Show upgrade prompt for premium features
   */
  const showUpgradePrompt = async (featureName, customMessage) => {
    const defaultMessages = {
      camera_scanning: 'You\'ve reached your monthly scan limit. Upgrade to Core+ Premium for unlimited AI food scanning!',
      meal_planning: 'Unlock meal planning with Core+ Premium and plan your nutrition goals!',
      export_data: 'Export your nutrition data with Core+ Premium subscription!',
      advanced_analytics: 'Get detailed analytics with Core+ Premium!',
      default: 'This feature requires Core+ Premium. Upgrade now to unlock all features!'
    };

    const message = customMessage || defaultMessages[featureName] || defaultMessages.default;

    Alert.alert(
      'Upgrade to Premium',
      message,
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Upgrade', 
          onPress: async () => {
            const purchased = await presentPaywallIfNeeded(featureName);
            if (purchased) {
              await refreshSubscription();
            }
          }
        }
      ]
    );
  };

  /**
   * Get usage information for display
   */
  const getUsageInfo = () => {
    if (!usageStats) return null;
    
    return {
      aiScans: {
        used: usageStats.aiScans.used,
        limit: usageStats.aiScans.limit,
        remaining: usageStats.aiScans.remaining,
        percentage: (usageStats.aiScans.used / usageStats.aiScans.limit) * 100
      },
      isUnlimited: subscriptionInfo.isActive
    };
  };

  return {
    // Subscription Info
    subscriptionInfo,
    usageStats,
    isLoading,
    error,
    
    // Core Functions
    refreshSubscription,
    presentPaywallIfNeeded,
    
    // Feature Access Checks
    canUseCameraScanning,
    canUseManualSearch,
    canAccessPremiumFeature,
    
    // Usage Management
    useCameraScanning,
    getUsageInfo,
    
    // UI Helpers
    showUpgradePrompt,
    loadUsageStats,
    
    // Legacy Support (if needed)
    isPremiumUser: () => subscriptionInfo.isActive,
    getSubscriptionTier: () => subscriptionInfo.isActive ? 'premium' : 'free'
  };
};

/**
 * Higher-order component for feature gating
 */
export const withFeatureGate = (WrappedComponent, featureName, options = {}) => {
  return (props) => {
    const { checkFeatureUsage } = useFeatureAccess();
    const [canAccess, setCanAccess] = useState(null);

    useEffect(() => {
      const checkAccess = async () => {
        const result = await checkFeatureUsage(featureName, { showPaywall: false });
        setCanAccess(result.canUse);
      };
      checkAccess();
    }, []);

    if (canAccess === null) {
      return options.LoadingComponent || null;
    }

    if (!canAccess) {
      return options.PaywallComponent || null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default useFeatureAccess;
