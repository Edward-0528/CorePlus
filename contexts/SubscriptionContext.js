import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import subscriptionService, { SUBSCRIPTION_TIERS, FEATURE_LIMITS } from '../services/subscriptionService';
import { revenueCatService } from '../services/revenueCatService';
import { useAppContext } from './AppContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAppContext();
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    tier: SUBSCRIPTION_TIERS.FREE,
    isActive: false,
    expiresAt: null,
    productId: null,
    limits: FEATURE_LIMITS[SUBSCRIPTION_TIERS.FREE],
    isLoading: true
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize subscription service when user changes
  useEffect(() => {
    if (user?.id && !isInitialized) {
      initializeSubscriptions();
    } else if (!user?.id) {
      // User logged out - reset to free tier
      resetToFreeTier();
    }
  }, [user?.id, isInitialized]);

  // Set up RevenueCat listener for purchase events (production only)
  useEffect(() => {
    if (!__DEV__ && isInitialized && user?.id) {
      const setupPurchaseListener = async () => {
        try {
          
          // Add listener for customer info updates (purchases, renewals, etc.)
          console.log('🔄 [SubscriptionContext] Setting up RevenueCat purchase listener');
          
          // We'll poll for changes every 30 seconds in production
          const pollInterval = setInterval(async () => {
            try {
              const hadActiveSubscription = subscriptionInfo.isActive;
              await refreshSubscriptionInfo();
              const hasActiveSubscription = subscriptionService.getSubscriptionInfo().isActive;
              
              // If subscription status changed, log it
              if (hadActiveSubscription !== hasActiveSubscription) {
                console.log('🔄 [SubscriptionContext] Subscription status changed:', {
                  from: hadActiveSubscription ? 'Active' : 'Inactive',
                  to: hasActiveSubscription ? 'Active' : 'Inactive'
                });
              }
            } catch (error) {
              console.warn('Subscription polling error:', error);
            }
          }, 30000); // Poll every 30 seconds
          
          return () => clearInterval(pollInterval);
        } catch (error) {
          console.warn('Failed to setup purchase listener:', error);
        }
      };
      
      setupPurchaseListener();
    }
  }, [isInitialized, subscriptionInfo.isActive]);

  const initializeSubscriptions = async () => {
    try {
      console.log('🔄 Initializing subscription service for user:', user.id);
      await subscriptionService.initialize(user.id);
      
      // Force a fresh check from RevenueCat on user login
      console.log('🔄 Force refreshing subscription status from RevenueCat...');
      await revenueCatService.forceRefreshSubscriptionStatus();
      
      await refreshSubscriptionInfo();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing subscriptions:', error);
      setSubscriptionInfo(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetToFreeTier = () => {
    setSubscriptionInfo({
      tier: SUBSCRIPTION_TIERS.FREE,
      isActive: false,
      expiresAt: null,
      productId: null,
      limits: FEATURE_LIMITS[SUBSCRIPTION_TIERS.FREE],
      isLoading: false
    });
    setIsInitialized(false);
  };

  const refreshSubscriptionInfo = async () => {
    try {
      if (!user?.id) {
        console.log('⚠️ SubscriptionContext: No user ID available, skipping refresh');
        return;
      }
      
      console.log('🔄 SubscriptionContext: Refreshing subscription info...');
      await subscriptionService.refreshSubscriptionStatus(user.id);
      const info = subscriptionService.getSubscriptionInfo();
      
      console.log('📊 SubscriptionContext: Updated subscription info:', {
        tier: info.tier,
        isActive: info.isActive,
        limits: Object.keys(info.limits)
      });
      
      setSubscriptionInfo({
        ...info,
        isLoading: false
      });
    } catch (error) {
      console.error('❌ SubscriptionContext: Error refreshing subscription info:', error);
      setSubscriptionInfo(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Check if user can access a feature
  const canAccessFeature = (featureName) => {
    return subscriptionService.canAccessFeature(featureName);
  };

  // Check daily usage limits with user feedback
  const checkDailyUsage = async (featureName, showAlert = true) => {
    try {
      const usage = await subscriptionService.checkDailyUsage(featureName, user.id);
      
      if (!usage.canUse && showAlert) {
        const limit = usage.limit;
        Alert.alert(
          'Daily Limit Reached',
          `You've used ${usage.used}/${limit} ${featureName} today. Upgrade to Core+ Pro for unlimited access!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => showUpgradeModal() }
          ]
        );
      }
      
      return usage;
    } catch (error) {
      console.error('Error checking daily usage:', error);
      return { canUse: false, remaining: 0 };
    }
  };

  // Increment usage and check limits
  const useFeature = async (featureName, showAlert = true) => {
    const usage = await checkDailyUsage(featureName, false);
    
    if (!usage.canUse) {
      if (showAlert) {
        Alert.alert(
          'Daily Limit Reached',
          `You've reached your daily limit for ${featureName}. Upgrade to Core+ Pro for unlimited access!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => showUpgradeModal() }
          ]
        );
      }
      return { success: false, usage };
    }
    
    // Increment usage
    await subscriptionService.incrementDailyUsage(featureName, user.id);
    
    return { 
      success: true, 
      usage: {
        ...usage,
        used: usage.used + 1,
        remaining: usage.remaining - 1
      }
    };
  };

  // Show upgrade modal
  const showUpgradeModal = () => {
    // This will be implemented in the UpgradeModal component
    Alert.alert(
      'Upgrade to Core+ Pro',
      'Unlock unlimited AI scans, meal planning, and more premium features!',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View Plans', onPress: () => {
          // Navigate to subscription screen
          console.log('Navigate to subscription plans');
        }}
      ]
    );
  };

  // Purchase subscription
  const purchaseSubscription = async (packageToPurchase) => {
    try {
      console.log('🛒 Purchasing subscription:', packageToPurchase?.identifier);
      
      // Extract product ID from package
      const productId = packageToPurchase?.identifier || packageToPurchase?.product?.identifier;
      if (!productId) {
        throw new Error('Invalid package - no product identifier found');
      }
      
      const result = await revenueCatService.purchaseProduct(productId);
      
      if (result.success) {
        await refreshSubscriptionInfo();
        Alert.alert(
          'Welcome to Core+ Pro! 🎉',
          'Your subscription is now active. Enjoy unlimited access to all premium features!'
        );
      } else if (!result.cancelled) {
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.'
        );
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error purchasing subscription:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return { success: false, error: error.message };
    }
  };

  // Restore purchases
  const restorePurchases = async () => {
    try {
      console.log('🔄 Restoring purchases...');
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        await refreshSubscriptionInfo();
        
        if (result.hasActiveSubscription) {
          Alert.alert(
            'Purchases Restored! ✅',
            'Your subscription has been restored successfully.'
          );
        } else {
          Alert.alert(
            'No Purchases Found',
            'No active subscriptions were found to restore.'
          );
        }
      } else {
        Alert.alert(
          'Restore Failed',
          result.error || 'Unable to restore purchases. Please try again.'
        );
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return { success: false, error: error.message };
    }
  };

  // Get available subscription packages
  const getAvailablePackages = async () => {
    try {
      console.log('🔄 [SubscriptionContext] Loading RevenueCat products...');
      const products = await revenueCatService.loadProducts();
      console.log('📦 [SubscriptionContext] Raw products from RevenueCat:', products);
      console.log('📦 [SubscriptionContext] Product count:', products?.length || 0);
      
      if (!products || products.length === 0) {
        console.warn('⚠️ [SubscriptionContext] No products returned from RevenueCat');
        return [];
      }
      
      // Convert products to package format expected by UpgradeModal
      const packages = products.map(product => {
        console.log('📦 [SubscriptionContext] Converting product:', product);
        return {
          identifier: product.identifier,
          packageType: product.identifier.includes('yearly') ? 'ANNUAL' : 'MONTHLY',
          product: {
            identifier: product.identifier,
            description: product.description || 'Core+ Premium Subscription',
            title: product.title || 'Core+ Premium',
            price: product.price,
            priceString: product.priceString,
            currencyCode: product.currencyCode
          }
        };
      });
      
      console.log('✅ [SubscriptionContext] Packages converted:', packages);
      console.log('✅ [SubscriptionContext] Package identifiers:', packages.map(p => p.identifier));
      return packages;
    } catch (error) {
      console.error('❌ [SubscriptionContext] Error getting available packages:', error);
      return [];
    }
  };

  // Check if user is premium
  const isPremium = () => {
    const premiumStatus = subscriptionService.isPremium();
    console.log('🔍 Checking premium status:', {
      premiumStatus,
      tier: subscriptionInfo.tier,
      isActive: subscriptionInfo.isActive,
      userId: user?.id
    });
    return premiumStatus;
  };

  // Get current tier
  const getCurrentTier = () => {
    return subscriptionInfo.tier;
  };

  // Feature access helpers
  const requiresPremium = (featureName, showAlert = true) => {
    const hasAccess = canAccessFeature(featureName);
    
    if (!hasAccess && showAlert) {
      Alert.alert(
        'Premium Feature',
        'This feature requires a Core+ Pro subscription. Upgrade now to unlock all premium features!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => showUpgradeModal() }
        ]
      );
    }
    
    return hasAccess;
  };

  const value = {
    // Subscription info
    subscriptionInfo,
    isLoading: subscriptionInfo.isLoading,
    
    // Tier checks
    getCurrentTier,
    isPremium,
    
    // Feature access
    canAccessFeature,
    requiresPremium,
    
    // Usage management
    checkDailyUsage,
    useFeature,
    
    // Purchase management
    purchaseSubscription,
    restorePurchases,
    getAvailablePackages,
    
    // Actions
    refreshSubscriptionInfo,
    showUpgradeModal,
    
    // Constants
    SUBSCRIPTION_TIERS,
    FEATURE_LIMITS
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
