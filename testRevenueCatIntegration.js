import { revenueCatService } from './services/revenueCatService';

/**
 * Simple RevenueCat Test - Run this in your debug screen
 * This will help us see exactly what's happening with product loading
 */
export const testRevenueCatIntegration = async () => {
  console.log('\n🧪 =========================');
  console.log('🧪 Testing RevenueCat Integration');
  console.log('🧪 =========================\n');

  try {
    // Step 1: Test initialization
    console.log('📋 Step 1: Testing RevenueCat initialization...');
    const initResult = await revenueCatService.initialize();
    console.log('Init result:', initResult);
    
    if (!initResult.success) {
      console.error('❌ RevenueCat failed to initialize:', initResult.error);
      return { success: false, step: 'initialization', error: initResult.error };
    }

    // Step 2: Test product loading
    console.log('\n📋 Step 2: Testing product loading...');
    const products = await revenueCatService.loadProducts();
    console.log('Products loaded:', products);
    console.log('Product count:', products?.length || 0);
    
    if (!products || products.length === 0) {
      console.error('❌ No products loaded from RevenueCat');
      return { success: false, step: 'product_loading', error: 'No products found' };
    }

    // Step 3: Check specific product
    console.log('\n📋 Step 3: Looking for specific product...');
    const monthlyProduct = products.find(p => p.identifier === 'coreplus_premium_monthly:corepluselite');
    console.log('Monthly product found:', !!monthlyProduct);
    
    if (monthlyProduct) {
      console.log('✅ Monthly product details:', {
        identifier: monthlyProduct.identifier,
        price: monthlyProduct.price,
        priceString: monthlyProduct.priceString,
        title: monthlyProduct.title,
        description: monthlyProduct.description,
        currencyCode: monthlyProduct.currencyCode
      });
    } else {
      console.error('❌ Monthly product not found!');
      console.log('Available product IDs:', products.map(p => p.identifier));
      return { 
        success: false, 
        step: 'product_verification', 
        error: 'Monthly product not found',
        availableProducts: products.map(p => p.identifier)
      };
    }

    // Step 4: Test subscription context integration
    console.log('\n📋 Step 4: Testing SubscriptionContext integration...');
    try {
      const { useSubscription } = await import('./contexts/SubscriptionContext');
      console.log('✅ SubscriptionContext import successful');
    } catch (contextError) {
      console.error('❌ SubscriptionContext import failed:', contextError);
      return { success: false, step: 'context_import', error: contextError.message };
    }

    console.log('\n🎉 =========================');
    console.log('🎉 All tests passed!');
    console.log('🎉 RevenueCat integration working');
    console.log('🎉 =========================\n');

    return { 
      success: true, 
      productsFound: products.length,
      monthlyProductAvailable: !!monthlyProduct,
      productDetails: monthlyProduct
    };

  } catch (error) {
    console.error('\n❌ =========================');
    console.error('❌ Test failed with error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ =========================\n');
    
    return { success: false, step: 'unknown', error: error.message };
  }
};

// Quick function to test from debug screen
export const quickProductTest = async () => {
  console.log('🔍 Quick product test...');
  
  try {
    await revenueCatService.initialize();
    const products = await revenueCatService.loadProducts();
    
    console.log('Products found:', products?.length || 0);
    
    if (products?.length > 0) {
      products.forEach((product, index) => {
        console.log(`Product ${index + 1}:`, {
          id: product.identifier,
          price: product.priceString,
          title: product.title
        });
      });
    }
    
    return products;
  } catch (error) {
    console.error('Quick test failed:', error);
    return null;
  }
};
