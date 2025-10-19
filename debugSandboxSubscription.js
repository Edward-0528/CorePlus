// RevenueCat Sandbox Subscription Debugger
// Quick script to debug subscription issues in production builds

import { revenueCatService } from '../services/revenueCatService';
import subscriptionService from '../services/subscriptionService';

export const debugSandboxSubscription = async (userId) => {
  console.log('\n🔍 =================================');
  console.log('🔍 SANDBOX SUBSCRIPTION DEBUGGER');
  console.log('🔍 =================================\n');

  try {
    // Step 1: Check RevenueCat initialization
    console.log('📋 Step 1: Checking RevenueCat initialization...');
    console.log('Initialized:', revenueCatService.isInitialized);
    
    if (!revenueCatService.isInitialized) {
      console.log('❌ RevenueCat not initialized. Attempting to initialize...');
      const initResult = await revenueCatService.initialize();
      console.log('Init result:', initResult);
    }

    // Step 2: Force clear cache and refresh
    console.log('\n📋 Step 2: Clearing cache and refreshing...');
    await revenueCatService.forceRefreshSubscriptionStatus();

    // Step 3: Get fresh customer info
    console.log('\n📋 Step 3: Getting customer info...');
    const customerInfo = await revenueCatService.refreshCustomerInfo();
    
    if (!customerInfo) {
      console.log('❌ No customer info available');
      return null;
    }

    console.log('Customer Info Summary:', {
      userId: customerInfo.originalAppUserId,
      managementURL: customerInfo.managementURL,
      isSandbox: customerInfo.managementURL?.includes('sandbox') || customerInfo.managementURL?.includes('test'),
    });

    // Step 4: Check all entitlements
    console.log('\n📋 Step 4: Checking entitlements...');
    const allEntitlements = customerInfo.entitlements.all;
    const activeEntitlements = customerInfo.entitlements.active;
    
    console.log('All Entitlements:', Object.keys(allEntitlements));
    console.log('Active Entitlements:', Object.keys(activeEntitlements));
    
    // Log details for each active entitlement
    for (const [name, entitlement] of Object.entries(activeEntitlements)) {
      console.log(`\n🎫 Active Entitlement: ${name}`, {
        isActive: entitlement.isActive,
        productIdentifier: entitlement.productIdentifier,
        expirationDate: entitlement.expirationDate,
        willRenew: entitlement.willRenew,
        store: entitlement.store,
        isSandbox: entitlement.isSandbox
      });
    }

    // Step 5: Test hasActiveSubscription
    console.log('\n📋 Step 5: Testing hasActiveSubscription...');
    const hasActive = revenueCatService.hasActiveSubscription();
    console.log('Has Active Subscription:', hasActive);

    // Step 6: Get subscription status
    console.log('\n📋 Step 6: Getting subscription status...');
    const status = await revenueCatService.getSubscriptionStatus();
    console.log('Subscription Status:', status);

    // Step 7: Check subscription service
    console.log('\n📋 Step 7: Checking subscription service...');
    await subscriptionService.forceRefreshSubscription(userId);
    const serviceInfo = subscriptionService.getSubscriptionInfo();
    console.log('Service Info:', serviceInfo);

    // Summary
    console.log('\n🎯 =================================');
    console.log('🎯 DEBUGGING SUMMARY');
    console.log('🎯 =================================');
    console.log(`RevenueCat Has Active: ${hasActive}`);
    console.log(`RevenueCat Status: ${status.status}`);
    console.log(`Service Tier: ${serviceInfo.tier}`);
    console.log(`Active Entitlements: ${Object.keys(activeEntitlements).join(', ') || 'None'}`);
    
    if (Object.keys(activeEntitlements).length > 0 && !hasActive) {
      console.log('\n⚠️ ISSUE FOUND: Has entitlements but hasActiveSubscription returns false');
      console.log('This suggests an entitlement name mismatch or validation issue');
    }
    
    if (hasActive && serviceInfo.tier === 'free') {
      console.log('\n⚠️ ISSUE FOUND: RevenueCat shows active but service shows free');
      console.log('This suggests a sync issue between RevenueCat and the subscription service');
    }

    return {
      revenueCatActive: hasActive,
      revenueCatStatus: status,
      serviceTier: serviceInfo.tier,
      activeEntitlements: Object.keys(activeEntitlements),
      customerInfo: customerInfo
    };

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', error.message);
    return null;
  }
};

// Quick console command for production debugging
export const quickDebug = async () => {
  // Get current user from auth
  const { supabase } = require('../supabaseConfig');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log('🔍 Running quick debug for user:', user.id);
  return await debugSandboxSubscription(user.id);
};
