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

      // Check if running in Expo Go - if so, use browser mode
      const isExpoGo = __DEV__ && (
        typeof navigator !== 'undefined' || 
        process.env.EXPO_PUBLIC_EXPO_GO === 'true'
      );

      if (isExpoGo) {
        console.log('Expo Go app detected. Using RevenueCat in Browser Mode.');
        this.isInitialized = true;
        return { success: true, mode: 'browser' };
      }

      // Get API keys from environment with fallback and debugging
      const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

      // Enhanced production mode detection
      let isProduction = !__DEV__ && process.env.NODE_ENV === 'production';
      
      // Debug key availability (show more for debugging)
      console.log('[RC] Environment check:', {
        android: androidKey ? `${androidKey.slice(0, 12)}...${androidKey.slice(-6)}` : 'MISSING',
        ios: iosKey ? `${iosKey.slice(0, 12)}...${iosKey.slice(-6)}` : 'MISSING',
        platform: Platform.OS,
        usingKey: Platform.OS === 'android' ? 'Android key' : 'iOS key',
        isProduction: isProduction,
        nodeEnv: process.env.NODE_ENV,
        devMode: __DEV__
      });

      if (!androidKey && !iosKey) {
        console.warn('⚠️ RevenueCat API keys not found - running in fallback mode');
        this.isInitialized = true; // Mark as initialized to prevent blocking
        return { success: true, mode: 'fallback' };
      }

      // Configure RevenueCat with the correct API key for platform
      const apiKey = Platform.OS === 'android' ? androidKey : iosKey;
      if (!apiKey) {
        console.warn(`⚠️ RevenueCat API key not found for ${Platform.OS} - running in fallback mode`);
        this.isInitialized = true; // Mark as initialized to prevent blocking
        return { success: true, mode: 'fallback' };
      }

      console.log(`🔧 Configuring RevenueCat for ${Platform.OS}...`);

      // Add timeout for initialization (shorter to not block auth)
      const initPromise = Purchases.configure({ apiKey });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RevenueCat initialization timeout')), 5000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      
      // Enhanced production mode detection and logging
      isProduction = !__DEV__ && process.env.NODE_ENV === 'production';
      
      // Set debug logs (disable in production)
      if (__DEV__) {
        await Purchases.setLogLevel('DEBUG');
      } else {
        await Purchases.setLogLevel('ERROR');
      }

      // In production, explicitly check sandbox mode
      if (isProduction) {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          console.log('🏭 Production Mode Validation:', {
            isProduction: true,
            appUserId: customerInfo.originalAppUserId,
            managementURL: customerInfo.managementURL,
            // Check if we're accidentally in sandbox (management URL indicates this)
            isSandbox: customerInfo.managementURL?.includes('sandbox') || customerInfo.managementURL?.includes('test')
          });
        } catch (infoError) {
          console.warn('Could not validate production mode:', infoError.message);
        }
      }

      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully', { isProduction });

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
      
      console.log('🔄 Refreshing customer info from RevenueCat...');
      
      // Force refresh from server (not cache)
      this.customerInfo = await Purchases.getCustomerInfo();
      
      const isProduction = !__DEV__ && process.env.NODE_ENV === 'production';
      
      console.log('📊 Customer info refreshed:', {
        originalAppUserId: this.customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(this.customerInfo.entitlements.active),
        hasActiveSubscription: this.hasActiveSubscription(),
        isProduction: isProduction
      });

      return this.customerInfo;
    } catch (error) {
      console.error('🚧 RevenueCat customer info failed:', error.message);
      this.customerInfo = null;
      return null;
    }
  }

  // Force clear cache and refresh
  async forceRefreshSubscriptionStatus() {
    try {
      console.log('🔄 Force refreshing subscription status (clearing cache)...');
      
      if (!this.isInitialized) {
        console.log('🚧 RevenueCat not initialized - cannot refresh');
        return null;
      }

      // Clear cached customer info
      this.customerInfo = null;
      
      // Invalidate RevenueCat's internal cache
      try {
        await Purchases.invalidateCustomerInfoCache();
        console.log('✅ RevenueCat cache invalidated');
      } catch (cacheError) {
        console.warn('⚠️ Could not invalidate RevenueCat cache:', cacheError.message);
      }
      
      // Force fresh data from RevenueCat servers
      await this.refreshCustomerInfo();
      
      return this.customerInfo;
    } catch (error) {
      console.error('❌ Error force refreshing subscription status:', error);
      return null;
    }
  }

  async loadProducts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 [RevenueCat] Trying PRIMARY method - loading via offerings...');
      
      // PRIMARY METHOD: Use offerings (more reliable than direct product lookup)
      try {
        const offerings = await Purchases.getOfferings();
        console.log('📦 [RevenueCat] Got offerings:', offerings);
        
        if (offerings.current && offerings.current.availablePackages) {
          const products = offerings.current.availablePackages.map(pkg => pkg.product);
          console.log('✅ [RevenueCat] SUCCESS - Products from offerings:', products);
          this.products = products;
          return products;
        } else {
          console.warn('⚠️ [RevenueCat] No current offering or packages found');
        }
      } catch (offeringsError) {
        console.error('❌ [RevenueCat] Offerings method failed:', offeringsError);
      }

      // FALLBACK METHOD: Direct product lookup
      console.log('🔄 [RevenueCat] Trying FALLBACK method - direct product lookup...');
      
      // Define your subscription product IDs (handle all possible formats)
      // Based on RevenueCat dashboard: Subscription ID = coreplus_premium_monthly, Base Plan = corepluselite
      const productIds = [
        'coreplus_premium_monthly:corepluselite', // Full format from RevenueCat dashboard
        'coreplus_premium_monthly', // Google Play Billing might return just this
        'corepluselite' // Maybe just the base plan ID?
      ];

      const products = await Purchases.getProducts(productIds);
      this.products = products;
      
      console.log('📦 Products loaded:', products.map(p => ({
        identifier: p.identifier,
        price: p.priceString,
        title: p.title
      })));

      // DETAILED DEBUGGING - Log each product in detail
      console.log('🔍 [RevenueCat] DETAILED PRODUCT ANALYSIS:');
      console.log('🔍 [RevenueCat] Requested product IDs:', productIds);
      console.log('🔍 [RevenueCat] Returned product count:', products?.length || 0);
      
      if (products && products.length > 0) {
        products.forEach((product, index) => {
          console.log(`🔍 [RevenueCat] Product ${index + 1} FULL DETAILS:`, {
            identifier: product.identifier,
            title: product.title,
            description: product.description,
            price: product.price,
            priceString: product.priceString,
            currencyCode: product.currencyCode,
            fullProductObject: JSON.stringify(product, null, 2)
          });
        });
      } else {
        console.error('❌ [RevenueCat] NO PRODUCTS RETURNED - This is the core issue!');
        
        // Let's try getting ALL offerings to see what RevenueCat actually has
        try {
          console.log('🔍 [RevenueCat] Attempting to get ALL offerings...');
          const offerings = await Purchases.getOfferings();
          console.log('📦 [RevenueCat] ALL OFFERINGS:', offerings);
          console.log('📦 [RevenueCat] Current offering:', offerings.current);
          console.log('📦 [RevenueCat] All offerings keys:', Object.keys(offerings.all || {}));
          
          if (offerings.current) {
            console.log('📦 [RevenueCat] Current offering packages:', offerings.current.availablePackages);
            offerings.current.availablePackages?.forEach((pkg, index) => {
              console.log(`📦 [RevenueCat] Package ${index + 1}:`, {
                identifier: pkg.identifier,
                packageType: pkg.packageType,
                product: pkg.product
              });
            });
          }
        } catch (offeringError) {
          console.error('❌ [RevenueCat] Error getting offerings:', offeringError);
        }
      }

      return products;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      console.error('❌ Product loading error details:', error.message);
      console.error('❌ Error stack:', error.stack);
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
      
      // Debug: Log all available entitlements
      const activeEntitlements = Object.keys(this.customerInfo.entitlements.active);
      console.log('🔍 [DEBUG] Available active entitlements:', activeEntitlements);
      
      // Enhanced production validation
      const isProduction = !__DEV__ && process.env.NODE_ENV === 'production';
      
      // Check for active entitlement - try multiple possible names
      const possibleEntitlementNames = ['Pro', 'pro', 'Premium', 'premium', 'CorePlus', 'coreplus'];
      let activeEntitlement = null;
      
      for (const name of possibleEntitlementNames) {
        if (this.customerInfo.entitlements.active[name]) {
          activeEntitlement = this.customerInfo.entitlements.active[name];
          console.log(`✅ Found active entitlement: ${name}`, {
            isActive: activeEntitlement.isActive,
            productId: activeEntitlement.productIdentifier,
            expirationDate: activeEntitlement.expirationDate
          });
          break;
        }
      }
      
      // If no named entitlement found, check if there are ANY active entitlements
      if (!activeEntitlement && activeEntitlements.length > 0) {
        // Use the first active entitlement
        const firstEntitlementName = activeEntitlements[0];
        activeEntitlement = this.customerInfo.entitlements.active[firstEntitlementName];
        console.log(`🔍 Using first available entitlement: ${firstEntitlementName}`, {
          isActive: activeEntitlement.isActive,
          productId: activeEntitlement.productIdentifier
        });
      }
      
      const isActive = activeEntitlement && activeEntitlement.isActive;
      
      // In production, be extra strict about validation
      if (isProduction && isActive) {
        // Additional production checks
        const now = new Date();
        const expirationDate = activeEntitlement.expirationDate ? new Date(activeEntitlement.expirationDate) : null;
        const isNotExpired = !expirationDate || expirationDate > now;
        
        console.log('🏭 Production entitlement validation:', {
          hasActiveEntitlement: !!activeEntitlement,
          isActive: isActive,
          expirationDate: expirationDate?.toISOString(),
          isNotExpired: isNotExpired,
          willRenew: activeEntitlement?.willRenew,
          availableEntitlements: Object.keys(this.customerInfo.entitlements.active)
        });
        
        return isActive && isNotExpired;
      }
      
      console.log('📊 Entitlement check result:', {
        hasActiveEntitlement: !!activeEntitlement,
        isActive: isActive,
        availableEntitlements: Object.keys(this.customerInfo.entitlements.active),
        isProduction: isProduction
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
        console.warn('🚧 RevenueCat not initialized - skipping user ID setting');
        return { success: false, reason: 'not_initialized' };
      }

      if (!userID) {
        console.warn('No user ID provided');
        return { success: false, reason: 'no_user_id' };
      }

      console.log(`👤 Setting RevenueCat user ID: ${userID}`);
      
      // Add timeout for RevenueCat operations
      const setUserPromise = (async () => {
        // Get current customer info before login to see if we have anonymous user
        try {
          const beforeInfo = await Purchases.getCustomerInfo();
          console.log('[RC] Before login - Current user ID:', beforeInfo.originalAppUserId);
        } catch (beforeError) {
          console.warn('Could not get customer info before login:', beforeError.message);
        }
        
        // This will transfer any anonymous purchases to the real user ID
        const loginResult = await Purchases.logIn(userID);
        console.log('[RC] Login result:', {
          customerInfo: {
            originalAppUserId: loginResult.customerInfo.originalAppUserId,
            created: loginResult.created
          }
        });
        
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
        
        return { success: true };
      })();
      
      // Add timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RevenueCat user ID timeout')), 8000)
      );
      
      const result = await Promise.race([setUserPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      console.error('❌ RevenueCat user ID setting failed:', error.message);
      console.error('❌ Full error:', error);
      return { success: false, error: error.message };
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

      // Use the same flexible entitlement detection as hasActiveSubscription
      const activeEntitlements = Object.keys(this.customerInfo.entitlements.active);
      const possibleEntitlementNames = ['Pro', 'pro', 'Premium', 'premium', 'CorePlus', 'coreplus'];
      let activeEntitlement = null;
      
      for (const name of possibleEntitlementNames) {
        if (this.customerInfo.entitlements.active[name]) {
          activeEntitlement = this.customerInfo.entitlements.active[name];
          break;
        }
      }
      
      // If no named entitlement found, use the first available
      if (!activeEntitlement && activeEntitlements.length > 0) {
        const firstEntitlementName = activeEntitlements[0];
        activeEntitlement = this.customerInfo.entitlements.active[firstEntitlementName];
      }
      
      if (activeEntitlement && activeEntitlement.isActive) {
        return {
          isActive: true,
          isPremium: true,
          expirationDate: activeEntitlement.expirationDate,
          productId: activeEntitlement.productIdentifier,
          willRenew: activeEntitlement.willRenew,
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
