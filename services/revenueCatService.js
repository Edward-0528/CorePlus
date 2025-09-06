import Purchases, { PurchasesStoreProduct, PurchasesCustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

class RevenueCatService {
  constructor() {
    this.isInitialized = false;
    this.customerInfo = null;
    this.products = [];
  }

  async initialize() {
    try {
      if (this.isInitialized) return;

      // Get API keys from environment
      const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

      if (!androidKey && !iosKey) {
        console.warn('⚠️ RevenueCat API keys not found in environment');
        // Don't throw error, just mark as failed initialization
        return;
      }

      // Configure RevenueCat
      const apiKey = Platform.OS === 'android' ? androidKey : iosKey;
      if (!apiKey) {
        console.warn(`⚠️ RevenueCat API key not found for ${Platform.OS}`);
        // Don't throw error, just mark as failed initialization
        return;
      }

      // Add timeout for initialization
      const initPromise = Purchases.configure({ apiKey });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RevenueCat initialization timeout')), 10000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      
      // Set debug logs (disable in production)
      if (__DEV__) {
        await Purchases.setLogLevel('DEBUG');
      } else {
        await Purchases.setLogLevel('ERROR');
      }

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');

      // Load initial customer info with error handling
      try {
        await this.refreshCustomerInfo();
      } catch (customerInfoError) {
        console.warn('RevenueCat customer info refresh failed:', customerInfoError);
        // Don't fail initialization if customer info fails
      }
      
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      this.isInitialized = false;
      // Don't throw error to prevent app crash
    }
  }

  async refreshCustomerInfo() {
    try {
      if (!this.isInitialized) {
        console.warn('RevenueCat not initialized, skipping customer info refresh');
        return null;
      }
      
      this.customerInfo = await Purchases.getCustomerInfo();
      console.log('📊 Customer info refreshed:', {
        hasActiveSubscription: this.hasActiveSubscription(),
        activeEntitlements: Object.keys(this.customerInfo.entitlements.active)
      });
      return this.customerInfo;
    } catch (error) {
      console.error('❌ Failed to refresh customer info:', error);
      return null;
    }
  }

  async loadProducts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Define your subscription product IDs
      const productIds = [
        'coreplus_premium_monthly',
        'coreplus_premium_yearly'
      ];

      const products = await Purchases.getProducts(productIds);
      this.products = products;
      
      console.log('📦 Products loaded:', products.map(p => ({
        identifier: p.identifier,
        price: p.priceString,
        title: p.title
      })));

      return products;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      return [];
    }
  }

  async purchaseProduct(productId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🛒 Attempting to purchase: ${productId}`);
      
      const { customerInfo, productIdentifier } = await Purchases.purchaseProduct(productId);
      
      this.customerInfo = customerInfo;
      
      console.log('✅ Purchase successful:', {
        productId: productIdentifier,
        hasActiveSubscription: this.hasActiveSubscription()
      });

      return {
        success: true,
        customerInfo,
        productIdentifier
      };
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      // Handle specific error cases
      if (error.code === 'PURCHASE_CANCELLED') {
        return { success: false, error: 'Purchase was cancelled', cancelled: true };
      }
      
      return { 
        success: false, 
        error: error.message || 'Purchase failed',
        code: error.code 
      };
    }
  }

  async restorePurchases() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      console.log('✅ Purchases restored:', {
        hasActiveSubscription: this.hasActiveSubscription(),
        activeEntitlements: Object.keys(customerInfo.entitlements.active)
      });

      return {
        success: true,
        customerInfo,
        hasActiveSubscription: this.hasActiveSubscription()
      };
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      return { success: false, error: error.message };
    }
  }

  hasActiveSubscription() {
    if (!this.customerInfo) return false;
    
    // Check for active premium entitlement
    const premiumEntitlement = this.customerInfo.entitlements.active['premium'];
    return premiumEntitlement && premiumEntitlement.isActive;
  }

  isPremiumUser() {
    return this.hasActiveSubscription();
  }

  getActiveSubscriptions() {
    if (!this.customerInfo) return [];
    
    return Object.values(this.customerInfo.entitlements.active);
  }

  async setUserID(userID) {
    try {
      if (!this.isInitialized) {
        console.warn('RevenueCat not initialized, skipping user ID setting');
        return;
      }

      if (!userID) {
        console.warn('No user ID provided');
        return;
      }

      await Purchases.logIn(userID);
      await this.refreshCustomerInfo();
      
      console.log(`👤 User logged in to RevenueCat: ${userID}`);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
      // Don't throw error to prevent app crash
    }
  }

  async logout() {
    try {
      if (!this.isInitialized) return;

      await Purchases.logOut();
      this.customerInfo = null;
      
      console.log('👋 User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
    }
  }

  // Helper to get formatted product info
  getProductInfo(productId) {
    const product = this.products.find(p => p.identifier === productId);
    if (!product) return null;

    return {
      id: product.identifier,
      title: product.title,
      description: product.description,
      price: product.priceString,
      priceAmount: product.price,
      currency: product.currencyCode,
      period: this.getSubscriptionPeriod(product)
    };
  }

  getSubscriptionPeriod(product) {
    // Extract period from product identifier or subscription info
    if (product.identifier.includes('monthly')) return 'monthly';
    if (product.identifier.includes('yearly')) return 'yearly';
    if (product.identifier.includes('weekly')) return 'weekly';
    return 'unknown';
  }

  // Get customer support info
  getCustomerSupportInfo() {
    if (!this.customerInfo) return null;

    return {
      originalAppUserId: this.customerInfo.originalAppUserId,
      originalApplicationVersion: this.customerInfo.originalApplicationVersion,
      firstSeen: this.customerInfo.firstSeen,
      managementURL: this.customerInfo.managementURL
    };
  }
}

export const revenueCatService = new RevenueCatService();
