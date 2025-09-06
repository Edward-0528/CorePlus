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
        return;
      }

      // Configure RevenueCat
      const apiKey = Platform.OS === 'android' ? androidKey : iosKey;
      if (!apiKey) {
        console.warn(`⚠️ RevenueCat API key not found for ${Platform.OS}`);
        return;
      }

      await Purchases.configure({ apiKey });
      
      // Set debug logs (disable in production)
      if (__DEV__) {
        await Purchases.setLogLevel('DEBUG');
      }

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');

      // Load initial customer info
      await this.refreshCustomerInfo();
      
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
    }
  }

  async refreshCustomerInfo() {
    try {
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
        await this.initialize();
      }

      await Purchases.logIn(userID);
      await this.refreshCustomerInfo();
      
      console.log(`👤 User logged in to RevenueCat: ${userID}`);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
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
