import { revenueCatService } from './services/revenueCatService';
import { subscriptionService } from './services/subscriptionService';

/**
 * Debug utility to check subscription status in production builds
 * This helps identify issues with RevenueCat configuration
 */
export const debugSubscriptionInProduction = async () => {
  console.log('🔍 === SUBSCRIPTION DEBUG START ===');
  
  try {
    // Environment check
    const isProduction = !__DEV__ && process.env.NODE_ENV === 'production';
    
    console.log('📱 Environment Information:', {
      isDev: __DEV__,
      nodeEnv: process.env.NODE_ENV,
      isProduction: isProduction,
      platform: require('react-native').Platform.OS
    });

    // RevenueCat service status
    console.log('🔧 RevenueCat Service Status:', {
      isInitialized: revenueCatService.isInitialized,
      hasCustomerInfo: !!revenueCatService.customerInfo
    });

    // Force refresh customer info
    console.log('🔄 Force refreshing customer info...');
    await revenueCatService.forceRefreshSubscriptionStatus();

    // Check current subscription status
    const customerInfo = revenueCatService.customerInfo;
    if (customerInfo) {
      console.log('👤 Customer Info:', {
        originalAppUserId: customerInfo.originalAppUserId,
        firstSeen: customerInfo.firstSeen,
        originalPurchaseDate: customerInfo.originalPurchaseDate,
        entitlementsKeys: Object.keys(customerInfo.entitlements.all),
        activeEntitlementsKeys: Object.keys(customerInfo.entitlements.active)
      });

      // Check each entitlement in detail
      Object.entries(customerInfo.entitlements.all).forEach(([key, entitlement]) => {
        console.log(`🎫 Entitlement "${key}":`, {
          identifier: entitlement.identifier,
          isActive: entitlement.isActive,
          willRenew: entitlement.willRenew,
          periodType: entitlement.periodType,
          productIdentifier: entitlement.productIdentifier,
          purchaseDate: entitlement.purchaseDate,
          expirationDate: entitlement.expirationDate
        });
      });
    } else {
      console.log('❌ No customer info available');
    }

    // Check service methods
    const hasActiveSubscription = revenueCatService.hasActiveSubscription();
    const isPremiumUser = revenueCatService.isPremiumUser();
    
    console.log('🔍 Service Method Results:', {
      hasActiveSubscription,
      isPremiumUser
    });

    // Check subscription service
    const subscriptionInfo = subscriptionService.getSubscriptionInfo();
    console.log('📊 Subscription Service Info:', subscriptionInfo);

    // Force refresh subscription service
    await subscriptionService.refreshSubscriptionStatus();
    const refreshedInfo = subscriptionService.getSubscriptionInfo();
    console.log('📊 Refreshed Subscription Info:', refreshedInfo);

  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
  
  console.log('🔍 === SUBSCRIPTION DEBUG END ===');
};

// Auto-run debug if this file is imported directly
if (typeof window !== 'undefined' && window.debugSubscription) {
  debugSubscriptionInProduction();
}
