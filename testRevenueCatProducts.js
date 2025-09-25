/**
 * RevenueCat Product Testing Script
 * Test the exact product IDs from your RevenueCat dashboard
 */

import { revenueCatService } from './services/revenueCatService';

export const testProductIds = async () => {
  console.log('🧪 Testing RevenueCat product IDs...');
  
  try {
    // Initialize RevenueCat
    const initResult = await revenueCatService.initialize();
    if (!initResult.success) {
      console.error('❌ Failed to initialize RevenueCat:', initResult.error);
      return;
    }
    
    console.log('✅ RevenueCat initialized successfully');
    
    // Test loading products with exact dashboard IDs
    const products = await revenueCatService.loadProducts();
    
    console.log('📦 Found products:', products.length);
    products.forEach(product => {
      console.log('- Product:', {
        identifier: product.identifier,
        price: product.priceString,
        title: product.title,
        description: product.description
      });
    });
    
    if (products.length === 0) {
      console.warn('⚠️ No products found! Check:');
      console.warn('1. Product IDs match RevenueCat dashboard exactly');
      console.warn('2. Products are published in RevenueCat');
      console.warn('3. App bundle ID matches RevenueCat configuration');
    }
    
    // Test the specific product from your dashboard
    const monthlyProduct = products.find(p => p.identifier === 'coreplus_premium_monthly:corepluselite');
    if (monthlyProduct) {
      console.log('✅ Monthly product found:', monthlyProduct.priceString);
    } else {
      console.error('❌ Monthly product not found with ID: coreplus_premium_monthly:corepluselite');
    }
    
  } catch (error) {
    console.error('❌ Product test failed:', error);
  }
};

export const testPurchaseFlow = async () => {
  console.log('🛒 Testing purchase flow...');
  
  try {
    // Test purchase with exact product ID
    const result = await revenueCatService.purchaseProduct('coreplus_premium_monthly:corepluselite');
    
    if (result.success) {
      console.log('✅ Purchase successful!');
      console.log('Product ID:', result.productIdentifier);
      console.log('Has active subscription:', revenueCatService.hasActiveSubscription());
    } else if (result.cancelled) {
      console.log('ℹ️ Purchase was cancelled by user');
    } else {
      console.error('❌ Purchase failed:', result.error);
      console.error('Error code:', result.code);
    }
    
  } catch (error) {
    console.error('❌ Purchase test failed:', error);
  }
};

// Quick test function to run from debug screen
export const quickTest = async () => {
  console.log('\n🚀 Starting RevenueCat Quick Test...\n');
  
  await testProductIds();
  
  console.log('\n📊 Current subscription status:');
  const status = await revenueCatService.getSubscriptionStatus();
  console.log(status);
  
  console.log('\n👤 Current customer info:');
  try {
    const customerInfo = await revenueCatService.refreshCustomerInfo();
    if (customerInfo) {
      console.log('User ID:', customerInfo.originalAppUserId);
      console.log('Active entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('All purchases:', Object.keys(customerInfo.allPurchaseDates || {}));
    }
  } catch (error) {
    console.error('Failed to get customer info:', error);
  }
  
  console.log('\n✅ RevenueCat test complete!');
};
