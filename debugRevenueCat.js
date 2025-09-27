import { revenueCatService } from './services/revenueCatService';

/**
 * Comprehensive RevenueCat Debug Function
 * Tests all aspects of RevenueCat integration
 */
export const debugRevenueCat = async () => {
  console.log('\n🔍 =========================');
  console.log('🔍 RevenueCat Debug Started');
  console.log('🔍 =========================\n');

  try {
    // Step 1: Test RevenueCat Initialization
    console.log('📋 Step 1: Testing RevenueCat Initialization...');
    const initResult = await revenueCatService.initialize();
    console.log('Init Result:', initResult);
    
    if (!initResult.success) {
      console.error('❌ RevenueCat initialization failed, stopping debug');
      return;
    }
    console.log('✅ Step 1: RevenueCat initialized successfully\n');

    // Step 2: Test Customer Info
    console.log('📋 Step 2: Testing Customer Info...');
    const customerInfo = await revenueCatService.refreshCustomerInfo();
    console.log('Customer Info:', {
      originalAppUserId: customerInfo?.originalAppUserId,
      hasActiveEntitlements: Object.keys(customerInfo?.entitlements?.active || {}).length > 0,
      activeEntitlements: Object.keys(customerInfo?.entitlements?.active || {}),
    });
    console.log('✅ Step 2: Customer info retrieved\n');

    // Step 3: Test Subscription Status
    console.log('📋 Step 3: Testing Subscription Status...');
    const subscriptionStatus = await revenueCatService.getSubscriptionStatus();
    console.log('Subscription Status:', subscriptionStatus);
    console.log('✅ Step 3: Subscription status retrieved\n');

    // Step 4: Test Active Subscription Check
    console.log('📋 Step 4: Testing Active Subscription Check...');
    const hasActive = revenueCatService.hasActiveSubscription();
    console.log('Has Active Subscription:', hasActive);
    console.log('✅ Step 4: Active subscription check completed\n');

    // Step 5: Test Product Loading
    console.log('📋 Step 5: Testing Product Loading...');
    const products = await revenueCatService.loadProducts();
    console.log('Available Products:', products.map(p => ({
      id: p.identifier,
      price: p.priceString,
      title: p.title
    })));
    console.log('✅ Step 5: Products loaded\n');

    // Step 6: Test User Subscription Service
    console.log('📋 Step 6: Testing User Subscription Service...');
    try {
      const { default: userSubscriptionService } = await import('./services/userSubscriptionService');
      
      // Test sync without parameters
      const syncResult = await userSubscriptionService.syncSubscriptionStatus();
      console.log('Sync Result:', syncResult);
      console.log('✅ Step 6: User subscription service sync completed\n');
      
    } catch (userServiceError) {
      console.error('❌ Step 6: User subscription service failed:', userServiceError);
      console.error('Error details:', userServiceError.message);
    }

    console.log('🎉 =========================');
    console.log('🎉 RevenueCat Debug Complete');
    console.log('🎉 All steps executed');
    console.log('🎉 =========================\n');

  } catch (error) {
    console.error('\n❌ =========================');
    console.error('❌ RevenueCat Debug Failed');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ =========================\n');
  }
};

// Test purchase flow (dry run)
export const debugPurchaseFlow = async (productId = 'coreplus_premium_monthly:corepluselite') => {
  console.log('\n🛒 =========================');
  console.log('🛒 Purchase Flow Debug Started');
  console.log('🛒 =========================\n');

  try {
    console.log(`📋 Testing purchase flow for: ${productId}`);
    
    // Test that products are available
    const products = await revenueCatService.loadProducts();
    const product = products.find(p => p.identifier === productId);
    
    if (!product) {
      console.error(`❌ Product ${productId} not found in available products`);
      console.log('Available products:', products.map(p => p.identifier));
      return;
    }
    
    console.log('✅ Product found:', {
      id: product.identifier,
      price: product.priceString,
      title: product.title
    });
    
    console.log('🎯 Purchase flow validation complete');
    console.log('🎯 To test actual purchase, use the app UI');

  } catch (error) {
    console.error('\n❌ =========================');
    console.error('❌ Purchase Debug Failed');
    console.error('❌ Error:', error.message);
    console.error('❌ =========================\n');
  }
};

// Usage instructions
console.log('📖 RevenueCat Debug Functions Available:');
console.log('📖 - debugRevenueCat() - Complete integration test');
console.log('📖 - debugPurchaseFlow() - Test purchase validation');
