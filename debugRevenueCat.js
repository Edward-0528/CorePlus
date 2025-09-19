// Debug script for RevenueCat entitlements
// Run this in your app to see what entitlements are actually available

import { revenueCatService } from './services/revenueCatService';

export const debugRevenueCat = async () => {
  console.log('🔍 Starting RevenueCat Debug...');
  
  try {
    // Initialize RevenueCat
    await revenueCatService.initialize();
    console.log('✅ RevenueCat initialized');

    // Get current customer info
    const customerInfo = await revenueCatService.getCustomerInfo();
    console.log('📋 Customer Info:', {
      originalAppUserId: customerInfo?.originalAppUserId,
      allEntitlements: customerInfo ? Object.keys(customerInfo.entitlements.all) : [],
      activeEntitlements: customerInfo ? Object.keys(customerInfo.entitlements.active) : [],
      allPurchasedProductIdentifiers: customerInfo?.allPurchasedProductIdentifiers || [],
      activeSubscriptions: customerInfo?.activeSubscriptions || []
    });

    // Debug individual entitlements
    if (customerInfo && customerInfo.entitlements.all) {
      console.log('🔍 All Available Entitlements:');
      Object.keys(customerInfo.entitlements.all).forEach(entitlementKey => {
        const entitlement = customerInfo.entitlements.all[entitlementKey];
        console.log(`  - ${entitlementKey}:`, {
          identifier: entitlement.identifier,
          isActive: entitlement.isActive,
          productIdentifier: entitlement.productIdentifier,
          store: entitlement.store
        });
      });
    }

    // Test premium check with current logic
    const isPremium = revenueCatService.isPremiumUser();
    console.log('💎 Is Premium (current logic):', isPremium);
    
    // Test specific Pro entitlement
    const currentCustomerInfo = revenueCatService.customerInfo;
    const proEntitlement = currentCustomerInfo?.entitlements?.active?.['Pro'];
    console.log('🎯 Pro Entitlement Details:', {
      exists: !!proEntitlement,
      isActive: proEntitlement?.isActive,
      productId: proEntitlement?.productIdentifier,
      expirationDate: proEntitlement?.expirationDate
    });

    // Get available products
    const products = await revenueCatService.getAvailableProducts();
    console.log('🛒 Available Products:', products.map(p => ({
      identifier: p.identifier,
      title: p.title,
      price: p.priceString
    })));

    return {
      customerInfo,
      isPremium,
      products
    };

  } catch (error) {
    console.error('❌ RevenueCat Debug Error:', error);
    return { error: error.message };
  }
};

// Call this function in your app after a user signs up
// Example: debugRevenueCat().then(result => console.log('Debug Result:', result));
