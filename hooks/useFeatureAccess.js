import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import userSubscriptionService from '../services/userSubscriptionService';
import { useAppContext } from '../contexts/AppContext';

/**
 * Hook for checking feature access and showing paywalls
 */
export const useFeatureAccess = () => {
  const { user } = useAppContext();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Initialize and listen for subscription changes
      const initializeSubscription = async () => {
        try {
          await userSubscriptionService.initializeForUser(user);
          const status = userSubscriptionService.getSubscriptionStatus();
          setSubscriptionStatus(status);
        } catch (error) {
          console.error('Failed to initialize subscription:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeSubscription();

      // Listen for subscription changes
      const unsubscribe = userSubscriptionService.onSubscriptionStatusChange((status) => {
        setSubscriptionStatus(status);
      });

      return unsubscribe;
    } else {
      setSubscriptionStatus(null);
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Check if user can access a feature
   */
  const canAccessFeature = async (featureName) => {
    try {
      return await userSubscriptionService.canAccessFeature(featureName);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  /**
   * Check daily usage limit and show paywall if exceeded
   */
  const checkFeatureUsage = async (featureName, options = {}) => {
    const {
      showPaywall = true,
      onPaywallShow,
      onUpgrade,
      featureDescription = '',
    } = options;

    try {
      // Check if user has premium access
      const hasAccess = await canAccessFeature(featureName);
      if (hasAccess) {
        return { canUse: true, isPremium: true };
      }

      // Check daily usage for free users
      const usageInfo = await userSubscriptionService.checkDailyUsageLimit(featureName, user.id);
      
      if (!usageInfo.canUse && showPaywall) {
        if (onPaywallShow) {
          onPaywallShow({
            featureName,
            featureDescription,
            usageInfo,
            onUpgrade: onUpgrade || (() => navigateToSubscription())
          });
        } else {
          // Show default alert
          Alert.alert(
            'Daily Limit Reached',
            `You've used ${usageInfo.used}/${usageInfo.limit} ${featureName} today. Upgrade to Core+ Pro for unlimited access!`,
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade Now', onPress: () => navigateToSubscription() }
            ]
          );
        }
      }

      return {
        canUse: usageInfo.canUse,
        isPremium: false,
        usageInfo
      };

    } catch (error) {
      console.error('Error checking feature usage:', error);
      return { canUse: false, isPremium: false };
    }
  };

  /**
   * Navigate to subscription screen
   */
  const navigateToSubscription = () => {
    // You'll need to implement navigation to your subscription screen
    console.log('Navigate to subscription screen');
  };

  /**
   * Check if user has any active subscription
   */
  const isPremiumUser = () => {
    return subscriptionStatus?.tier === 'pro' && subscriptionStatus?.status === 'active';
  };

  /**
   * Get subscription tier
   */
  const getSubscriptionTier = () => {
    return subscriptionStatus?.tier || 'free';
  };

  /**
   * Get days until subscription expires
   */
  const getDaysUntilExpiration = () => {
    if (!subscriptionStatus?.expiresAt) return null;
    
    const expiryDate = new Date(subscriptionStatus.expiresAt);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return {
    // Status
    subscriptionStatus,
    isLoading,
    isPremiumUser: isPremiumUser(),
    subscriptionTier: getSubscriptionTier(),
    daysUntilExpiration: getDaysUntilExpiration(),
    
    // Functions
    canAccessFeature,
    checkFeatureUsage,
    navigateToSubscription,
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
