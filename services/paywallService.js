import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Alert, Platform } from 'react-native';

/**
 * RevenueCat Paywall Service
 * Handles subscription paywalls and purchase flow
 * Note: Does NOT initialize RevenueCat (already initialized by revenueCatService)
 */
class PaywallService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.customerInfo = null;
  }

  /**
   * Check if RevenueCat is ready
   * RevenueCat is initialized by revenueCatService in App.js
   */
  async ensureInitialized() {
    if (this.isInitialized) return true;

    try {
      console.log('🔄 PaywallService: Checking if RevenueCat is initialized...');
      
      // Check if RevenueCat is already configured by trying to get customer info
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('✅ PaywallService: RevenueCat is already initialized');
        this.customerInfo = customerInfo;
        this.isInitialized = true;
        
        // Load products
        await this.loadProducts();
        return true;
      } catch (error) {
        console.error('❌ PaywallService: RevenueCat not initialized yet:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ PaywallService: Error checking initialization:', error);
      return false;
    }
  }

  /**
   * Load available products/offerings
   */
  async loadProducts() {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        this.products = offerings.current.availablePackages;
        console.log('📦 Products loaded:', this.products.length);
      }
      
      return offerings;
    } catch (error) {
      console.error('Error loading products:', error);
      return null;
    }
  }

  /**
   * Load customer info
   */
  async loadCustomerInfo() {
    try {
      this.customerInfo = await Purchases.getCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Error loading customer info:', error);
      return null;
    }
  }

  /**
   * Present paywall for specific feature
   * Uses the correct RevenueCatUI API as per documentation
   */
  async presentPaywallForFeature(featureName, options = {}) {
    try {
      // Ensure RevenueCat is ready
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        console.error('❌ RevenueCat not ready, cannot show paywall');
        return { success: false, error: 'RevenueCat not initialized' };
      }

      console.log(`🎯 Presenting paywall for feature: ${featureName}`);
      console.log(`🎯 Checking for offerings...`);
      
      // Get current offerings to ensure paywall has data
      const offerings = await Purchases.getOfferings();
      console.log(`📦 Available offerings:`, {
        current: offerings.current?.identifier,
        all: Object.keys(offerings.all || {})
      });

      if (!offerings.current || !offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
        console.error('❌ No current offering or packages found in RevenueCat');
        return { success: false, error: 'No offerings available' };
      }

      console.log(`📦 Current offering has ${offerings.current.availablePackages.length} packages`);
      console.log(`📦 Package details:`, offerings.current.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        product: pkg.product?.identifier
      })));

      // Debug: Check what's available in RevenueCatUI
      console.log(`🔍 RevenueCatUI available methods:`, Object.keys(RevenueCatUI));
      console.log(`🔍 RevenueCatUI.presentPaywall type:`, typeof RevenueCatUI.presentPaywall);
      console.log(`🔍 PAYWALL_RESULT available:`, PAYWALL_RESULT);

      // Use RevenueCatUI.presentPaywall() to ALWAYS show the paywall
      // We're using presentPaywall (not presentPaywallIfNeeded) because we've already
      // determined the user needs to upgrade (they hit their scan limit)
      console.log(`🚀 Calling RevenueCatUI.presentPaywall() to display paywall`);
      console.log(`🚀 About to call presentPaywall - THIS SHOULD SHOW THE PAYWALL NOW!`);
      
      const paywallResult = await RevenueCatUI.presentPaywall();

      console.log(`📊 Paywall result received:`, paywallResult);
      console.log(`📊 Result type:`, typeof paywallResult);

      // Handle the result according to documentation
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          console.log('✅ Purchase/Restore successful!');
          // Refresh customer info
          this.customerInfo = await Purchases.getCustomerInfo();
          return { success: true, customerInfo: this.customerInfo };
        
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('ℹ️ Paywall not presented (user already has entitlement)');
          return { success: false, dismissed: true, reason: 'already_entitled' };
        
        case PAYWALL_RESULT.CANCELLED:
          console.log('ℹ️ User cancelled/dismissed paywall');
          return { success: false, dismissed: true };
        
        case PAYWALL_RESULT.ERROR:
          console.error('❌ Paywall error occurred');
          return { success: false, error: 'Paywall error' };
        
        default:
          console.log('⚠️ Unknown paywall result:', paywallResult);
          return { success: false, error: 'Unknown result' };
      }
    } catch (error) {
      console.error('❌ Paywall exception:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      return { success: false, error: error.message || 'Paywall failed to display' };
    }
  }

  /**
   * Get paywall configuration for specific features
   */
  getPaywallOptionsForFeature(featureName, customOptions = {}) {
    const defaultOptions = {
      displayCloseButton: true,
      shouldDisplayDismissButton: true,
    };

    const featureConfigs = {
      camera_scanning: {
        // You can add feature-specific paywall customizations here
        // For now, we'll use the default RevenueCat paywall template
      },
      meal_planning: {
        // Custom configuration for meal planning
      },
      export_data: {
        // Custom configuration for data export
      },
      advanced_analytics: {
        // Custom configuration for analytics
      },
    };

    const featureConfig = featureConfigs[featureName] || {};
    
    return {
      ...defaultOptions,
      ...featureConfig,
      ...customOptions
    };
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription() {
    try {
      if (!this.customerInfo) {
        await this.loadCustomerInfo();
      }
      
      return this.customerInfo?.entitlements?.active?.pro != null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo() {
    try {
      if (!this.customerInfo) {
        await this.loadCustomerInfo();
      }

      const isActive = this.customerInfo?.entitlements?.active?.pro != null;
      const entitlement = this.customerInfo?.entitlements?.active?.pro;
      
      return {
        isActive,
        productId: entitlement?.productIdentifier,
        expirationDate: entitlement?.expirationDate,
        willRenew: entitlement?.willRenew,
        isInIntroOfferPeriod: entitlement?.isInIntroOfferPeriod,
        periodType: entitlement?.periodType,
        store: entitlement?.store,
      };
    } catch (error) {
      console.error('Error getting subscription info:', error);
      return { isActive: false };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases() {
    try {
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      const hasActive = customerInfo?.entitlements?.active?.pro != null;
      
      if (hasActive) {
        Alert.alert(
          'Purchases Restored!',
          'Your Core+ Premium subscription has been restored.',
          [{ text: 'OK' }]
        );
        return { success: true, hasActiveSubscription: true };
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active subscriptions were found to restore.',
          [{ text: 'OK' }]
        );
        return { success: true, hasActiveSubscription: false };
      }
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      
      Alert.alert(
        'Restore Failed',
        'There was an error restoring your purchases. Please try again.',
        [{ text: 'OK' }]
      );
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer ID for user identification
   */
  async getCustomerId() {
    try {
      if (!this.customerInfo) {
        await this.loadCustomerInfo();
      }
      
      return this.customerInfo?.originalAppUserId;
    } catch (error) {
      console.error('Error getting customer ID:', error);
      return null;
    }
  }

  /**
   * Set user ID for RevenueCat
   */
  async setUserId(userId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await Purchases.logIn(userId);
      await this.loadCustomerInfo();
      
      console.log('✅ RevenueCat user ID set:', userId);
    } catch (error) {
      console.error('❌ Error setting user ID:', error);
    }
  }

  /**
   * Clear user data (for logout)
   */
  async clearUserData() {
    try {
      await Purchases.logOut();
      this.customerInfo = null;
      console.log('✅ RevenueCat user data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  /**
   * Show upgrade alert for specific features
   */
  showFeatureUpgradeAlert(featureName, customMessage) {
    const messages = {
      camera_scanning: {
        title: 'Upgrade to Premium',
        message: 'You\'ve reached your monthly AI scan limit. Upgrade to Core+ Premium for unlimited food scanning!',
      },
      meal_planning: {
        title: 'Premium Feature',
        message: 'Unlock advanced meal planning with Core+ Premium!',
      },
      export_data: {
        title: 'Premium Feature', 
        message: 'Export your nutrition data with Core+ Premium subscription!',
      },
      advanced_analytics: {
        title: 'Premium Feature',
        message: 'Get detailed analytics and insights with Core+ Premium!',
      },
    };

    const config = messages[featureName] || {
      title: 'Premium Feature',
      message: customMessage || 'This feature requires Core+ Premium. Upgrade now!'
    };

    Alert.alert(
      config.title,
      config.message,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Upgrade Now',
          onPress: () => this.presentPaywallForFeature(featureName)
        }
      ]
    );
  }
}

const paywallServiceInstance = new PaywallService();

/**
 * Helper function for feature access hooks
 * NO LONGER SHOWS REVENUECAT PAYWALL - Just returns true to indicate limit reached
 * The custom UpgradeModal should be shown by the calling component
 */
export const presentPaywallIfNeeded = async (featureName) => {
  console.log(`🚀 presentPaywallIfNeeded called for feature: ${featureName}`);
  console.log(`📱 NOT showing RevenueCat paywall - app should show custom UpgradeModal`);
  
  // Always return true (dismissed) - this signals that the paywall flow happened
  // but the user didn't purchase. The calling code should show the custom UpgradeModal.
  return true;
};

export default paywallServiceInstance;
