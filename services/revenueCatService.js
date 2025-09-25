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
      if (this.isInitialized) return { success: true };

      // Get API keys from environment with fallback and debugging
      const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

      // Debug key availability (never log full keys)
      console.log('[RC] Key presence check:', {
        android: androidKey ? `${androidKey.slice(0, 8)}...${androidKey.slice(-4)}` : 'MISSING',
        ios: iosKey ? `${iosKey.slice(0, 8)}...${iosKey.slice(-4)}` : 'MISSING',
        platform: Platform.OS
      });

      if (!androidKey && !iosKey) {
        console.error('⚠️ RevenueCat API keys not found in environment - check EAS secrets');
        return { success: false, error: 'API keys missing' };
      }

      // Configure RevenueCat with the correct API key for platform
      const apiKey = Platform.OS === 'android' ? androidKey : iosKey;
      if (!apiKey) {
        console.error(`⚠️ RevenueCat API key not found for ${Platform.OS} - check EAS secrets`);
        return { success: false, error: `No ${Platform.OS} API key` };
      }

      console.log(`🔧 Configuring RevenueCat for ${Platform.OS}...`);

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

      // Log the app user ID for debugging dashboard sync
      try {
        const initialInfo = await Purchases.getCustomerInfo();
        console.log('[RC] Initial App User ID:', initialInfo.originalAppUserId);
      } catch (infoError) {
        console.warn('Could not get initial customer info:', infoError.message);
      }

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
      return { success: false, error: error.message };
    }
  }

  async refreshCustomerInfo() {
    try {
      if (!this.isInitialized) {
        console.log('🚧 RevenueCat not available - returning free user status');
        return null;
      }
      
      this.customerInfo = await Purchases.getCustomerInfo();
      console.log('📊 Customer info refreshed:', {
        hasActiveSubscription: this.hasActiveSubscription(),
        activeEntitlements: Object.keys(this.customerInfo.entitlements.active)
      });
      return this.customerInfo;
    } catch (error) {
      console.error('🚧 RevenueCat customer info failed:', error.message);
      return null;
    }
  }

  async loadProducts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Define your subscription product IDs (must match RevenueCat dashboard)
      const productIds = [
        'coreplus_premium_monthly:corepluselite',
        'coreplus_premium_yearly:corepluselite'
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
        console.log('🔧 Initializing RevenueCat before purchase...');
        await this.initialize();
        if (!this.isInitialized) {
          throw new Error('RevenueCat failed to initialize');
        }
      }

      console.log(`🛒 Attempting to purchase: ${productId}`);
      
      // Add timeout for purchase to prevent hanging
      const purchasePromise = Purchases.purchaseProduct(productId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Purchase timeout - please try again')), 30000)
      );

      const { customerInfo, productIdentifier } = await Promise.race([
        purchasePromise,
        timeoutPromise
      ]);
      
      this.customerInfo = customerInfo;
      
      console.log('✅ Purchase successful:', {
        productId: productIdentifier,
        hasActiveSubscription: this.hasActiveSubscription()
      });

      // Force sync subscription status after successful purchase
      try {
        const { default: userSubscriptionService } = await import('./userSubscriptionService');
        const user = await this.getCurrentUser();
        if (user?.id) {
          setTimeout(() => userSubscriptionService.syncSubscriptionStatus(), 2000);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to sync subscription after purchase:', syncError);
      }

      return {
        success: true,
        customerInfo,
        productIdentifier
      };
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      // Handle specific error cases
      if (error.code === 'PURCHASE_CANCELLED' || error.message?.includes('cancelled')) {
        return { success: false, error: 'Purchase was cancelled', cancelled: true };
      }
      
      if (error.code === 'USER_CANCELLED' || error.message?.includes('User cancelled')) {
        return { success: false, error: 'Purchase was cancelled', cancelled: true };
      }

      if (error.message?.includes('timeout')) {
        return { success: false, error: 'Purchase timed out - please try again', timeout: true };
      }
      
      return { 
        success: false, 
        error: error.message || 'Purchase failed - please try again',
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
    try {
      if (!this.customerInfo) {
        console.log('📊 No customer info available, returning false');
        return false;
      }
      
      if (!this.customerInfo.entitlements) {
        console.log('📊 No entitlements object, returning false');
        return false;
      }
      
      if (!this.customerInfo.entitlements.active) {
        console.log('📊 No active entitlements, returning false');
        return false;
      }
      
      // Check for active Pro entitlement (matches RevenueCat dashboard identifier)
      const proEntitlement = this.customerInfo.entitlements.active['Pro'];
      const isActive = proEntitlement && proEntitlement.isActive;
      
      console.log('📊 Entitlement check result:', {
        hasProEntitlement: !!proEntitlement,
        isActive: isActive,
        availableEntitlements: Object.keys(this.customerInfo.entitlements.active)
      });
      
      return isActive;
    } catch (error) {
      console.error('❌ Error checking active subscription:', error);
      return false;
    }
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
      console.log(`🔍 [DEBUG] setUserID called with: ${userID}`);
      console.log(`🔍 [DEBUG] RevenueCat initialized: ${this.isInitialized}`);
      
      if (!this.isInitialized) {
        console.log('🚧 RevenueCat not initialized - attempting to initialize first');
        const initResult = await this.initialize();
        if (!initResult.success) {
          console.error('❌ Cannot set user ID - RevenueCat initialization failed:', initResult.error);
          return;
        }
      }

      if (!userID) {
        console.warn('No user ID provided');
        return;
      }

      console.log(`👤 Setting RevenueCat user ID: ${userID}`);
      
      // Get current customer info before login to see if we have anonymous user
      try {
        const beforeInfo = await Purchases.getCustomerInfo();
        console.log('[RC] Before login - Current user ID:', beforeInfo.originalAppUserId);
      } catch (beforeError) {
        console.warn('Could not get customer info before login:', beforeError.message);
      }
      
      await Purchases.logIn(userID);
      await this.refreshCustomerInfo();
      
      console.log(`✅ User logged in to RevenueCat: ${userID}`);
      
      // Log the customer info to verify user appears in dashboard
      if (this.customerInfo) {
        console.log('[RC] Customer created/linked:', {
          originalAppUserId: this.customerInfo.originalAppUserId,
          allPurchaseDates: Object.keys(this.customerInfo.allPurchaseDates || {}),
          hasActiveEntitlements: Object.keys(this.customerInfo.entitlements?.active || {}).length > 0
        });
      }
      
    } catch (error) {
      console.error('❌ RevenueCat user ID setting failed:', error.message);
      console.error('❌ Full error:', error);
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

  async setAttributes(attributes) {
    try {
      if (!this.isInitialized) {
        console.warn('RevenueCat not initialized, skipping attributes setting');
        return;
      }

      await Purchases.setAttributes(attributes);
      console.log('✅ RevenueCat attributes set:', attributes);
    } catch (error) {
      console.error('❌ Failed to set attributes:', error);
    }
  }

  // Get comprehensive subscription status
  async getSubscriptionStatus() {
    try {
      if (!this.isInitialized) {
        console.log('🚧 RevenueCat not available, returning free status');
        return {
          isActive: false,
          isPremium: false,
          expirationDate: null,
          productId: null,
          willRenew: false,
          status: 'free'
        };
      }

      await this.refreshCustomerInfo();
      
      if (!this.customerInfo) {
        return {
          isActive: false,
          isPremium: false,
          expirationDate: null,
          productId: null,
          willRenew: false,
          status: 'free'
        };
      }

      const proEntitlement = this.customerInfo.entitlements.active['Pro'];
      
      if (proEntitlement && proEntitlement.isActive) {
        return {
          isActive: true,
          isPremium: true,
          expirationDate: proEntitlement.expirationDate,
          productId: proEntitlement.productIdentifier,
          willRenew: proEntitlement.willRenew,
          status: 'premium'
        };
      }
      
      return {
        isActive: false,
        isPremium: false,
        expirationDate: null,
        productId: null,
        willRenew: false,
        status: 'free'
      };
      
    } catch (error) {
      console.error('❌ RevenueCat subscription status failed:', error.message);
      return {
        isActive: false,
        isPremium: false,
        expirationDate: null,
        productId: null,
        willRenew: false,
        status: 'free',
        error: error.message
      };
    }
  }

  // Helper to get current authenticated user
  async getCurrentUser() {
    try {
      const { authService } = await import('../authService');
      const session = await authService.getCurrentSession();
      return session?.user || null;
    } catch (error) {
      console.warn('⚠️ Failed to get current user:', error);
      return null;
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
