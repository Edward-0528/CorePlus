/**
 * SIMPLE SUBSCRIPTION DEBUG
 * Just shows: Are we subscribed? YES or NO
 */

export const simpleSubscriptionDebug = async () => {
  console.log('\n🔍 === SIMPLE SUBSCRIPTION DEBUG ===');
  
  try {
    // Import RevenueCat service
    const { revenueCatService } = await import('./services/revenueCatService');
    
    // Step 1: Check if RevenueCat is initialized
    console.log('1️⃣ RevenueCat Initialized:', revenueCatService.isInitialized);
    
    // Step 2: Get customer info directly from RevenueCat
    console.log('2️⃣ Getting customer info from RevenueCat...');
    const customerInfo = await revenueCatService.refreshCustomerInfo();
    
    if (!customerInfo) {
      console.log('❌ NO CUSTOMER INFO - This is the problem!');
      return { subscribed: false, issue: 'No customer info' };
    }
    
    // Step 3: Show what RevenueCat actually returns
    console.log('3️⃣ RAW RevenueCat Data:');
    console.log('   Customer ID:', customerInfo.originalAppUserId);
    console.log('   All Entitlements:', Object.keys(customerInfo.entitlements.all || {}));
    console.log('   Active Entitlements:', Object.keys(customerInfo.entitlements.active || {}));
    console.log('   Purchase Dates:', Object.keys(customerInfo.allPurchaseDates || {}));
    
    // Step 4: Simple check - ANY active entitlement = subscribed
    const hasAnyActiveEntitlement = Object.keys(customerInfo.entitlements.active || {}).length > 0;
    console.log('4️⃣ Has ANY active entitlement:', hasAnyActiveEntitlement);
    
    // Step 5: Check our app's detection
    const appThinks = revenueCatService.hasActiveSubscription();
    console.log('5️⃣ App thinks subscribed:', appThinks);
    
    // Final result
    const result = {
      subscribed: hasAnyActiveEntitlement,
      revenueCatCustomerId: customerInfo.originalAppUserId,
      activeEntitlements: Object.keys(customerInfo.entitlements.active || {}),
      appDetection: appThinks,
      match: hasAnyActiveEntitlement === appThinks
    };
    
    console.log('\n✅ FINAL RESULT:', result);
    console.log(`📱 SUBSCRIPTION STATUS: ${result.subscribed ? 'YES - SUBSCRIBED' : 'NO - NOT SUBSCRIBED'}`);
    
    if (!result.match) {
      console.log('⚠️ MISMATCH: RevenueCat says one thing, app detects another!');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { subscribed: false, error: error.message };
  }
};

// Quick test function you can run in any screen
export const quickSubscriptionTest = () => {
  simpleSubscriptionDebug().then(result => {
    alert(`Subscription Status: ${result.subscribed ? 'YES' : 'NO'}\n\nCustomer ID: ${result.revenueCatCustomerId}\nActive: ${result.activeEntitlements?.join(', ') || 'None'}`);
  }).catch(error => {
    alert(`Error: ${error.message}`);
  });
};
