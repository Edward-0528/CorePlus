/**
 * RevenueCat Debugging Script
 * Run this in your production builds to test RevenueCat integration
 */

import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabaseConfig';

export const debugRevenueCat = async () => {
  const results = {
    environment: {},
    configuration: {},
    userFlow: {},
    errors: [],
    recommendations: []
  };

  try {
    // 1. Environment Check
    console.log('🔍 === RevenueCat Debug Report ===');
    
    results.environment = {
      platform: Platform.OS,
      isExpoGo: Constants.appOwnership === 'expo',
      isDev: __DEV__,
      hasRevenueCat: typeof Purchases !== 'undefined'
    };

    console.log('📱 Environment:', results.environment);

    if (results.environment.isExpoGo) {
      results.errors.push('RevenueCat does not work in Expo Go - use production build');
      results.recommendations.push('Test in production build (.aab/.ipa files)');
    }

    // 2. Configuration Check
    const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    
    results.configuration = {
      hasIosKey: !!iosKey,
      hasAndroidKey: !!androidKey,
      currentPlatformKey: Platform.OS === 'ios' ? !!iosKey : !!androidKey,
      iosKeyPreview: iosKey ? iosKey.substring(0, 8) + '...' : 'missing',
      androidKeyPreview: androidKey ? androidKey.substring(0, 8) + '...' : 'missing'
    };

    console.log('🔑 Configuration:', results.configuration);

    if (!results.configuration.currentPlatformKey) {
      results.errors.push(`Missing RevenueCat API key for ${Platform.OS}`);
      results.recommendations.push('Check your .env file has correct API keys');
    }

    // 3. Package Name Check
    const packageInfo = {
      android: 'com.anonymous.coreplus',
      ios: 'com.anonymous.coreplus' // Now matches after our fix
    };

    console.log('📦 Package Names:', packageInfo);

    // 4. Try RevenueCat Operations (only in production builds)
    if (!results.environment.isExpoGo && results.environment.hasRevenueCat) {
      try {
        console.log('🚀 Testing RevenueCat operations...');
        
        // Test configuration
        const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;
        if (apiKey) {
          await Purchases.configure({ apiKey });
          console.log('✅ RevenueCat configured successfully');
          
          // Test customer info
          const customerInfo = await Purchases.getCustomerInfo();
          results.userFlow.customerInfo = {
            originalAppUserId: customerInfo.originalAppUserId,
            hasActiveSubscriptions: Object.keys(customerInfo.entitlements.active).length > 0,
            activeEntitlements: Object.keys(customerInfo.entitlements.active),
            allPurchaseDates: customerInfo.allPurchaseDates
          };
          
          console.log('👤 Customer Info:', results.userFlow.customerInfo);
          
          // Test user ID setting
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await Purchases.logIn(user.id);
            console.log('🔗 User ID set in RevenueCat:', user.id);
            
            // Set attributes
            await Purchases.setAttributes({
              email: user.email,
              supabase_user_id: user.id,
              debug_test: 'true'
            });
            console.log('📋 User attributes set');
            
            results.userFlow.userId = user.id;
            results.userFlow.userEmail = user.email;
          }
        }
      } catch (revenueCatError) {
        results.errors.push(`RevenueCat operation failed: ${revenueCatError.message}`);
        console.error('❌ RevenueCat error:', revenueCatError);
      }
    }

    // 5. Dashboard Check Instructions
    console.log('📊 === Dashboard Check Instructions ===');
    console.log('1. Open RevenueCat Dashboard');
    console.log('2. Go to Customer Lists');
    console.log('3. Search for user ID or email');
    console.log('4. Expected package names:');
    console.log(`   - iOS: ${packageInfo.ios}`);
    console.log(`   - Android: ${packageInfo.android}`);

    // 6. Recommendations
    if (results.errors.length > 0) {
      console.log('⚠️  Issues Found:', results.errors);
      console.log('💡 Recommendations:', results.recommendations);
    } else {
      console.log('✅ All basic checks passed');
    }

    return results;

  } catch (error) {
    console.error('❌ Debug script error:', error);
    results.errors.push(`Debug script error: ${error.message}`);
    return results;
  }
};

// Test user creation flow
export const testUserCreationFlow = async (testEmail = `test+${Date.now()}@example.com`, testPassword = 'TestPass123!') => {
  console.log('🧪 === Testing User Creation Flow ===');
  
  try {
    // 1. Create test user
    console.log('1. Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Debug',
          gender: 'other'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Test signup failed:', signUpError);
      return { success: false, error: signUpError.message };
    }

    console.log('✅ Test user created:', signUpData.user?.id);

    // 2. Test RevenueCat linking (only in production builds)
    if (Constants.appOwnership !== 'expo' && typeof Purchases !== 'undefined') {
      console.log('2. Linking to RevenueCat...');
      
      try {
        await Purchases.logIn(signUpData.user.id);
        await Purchases.setAttributes({
          email: testEmail,
          supabase_user_id: signUpData.user.id,
          test_user: 'true',
          created_at: new Date().toISOString()
        });
        
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('✅ Test user linked to RevenueCat:', customerInfo.originalAppUserId);
        
        return {
          success: true,
          userId: signUpData.user.id,
          revenueCatId: customerInfo.originalAppUserId,
          testEmail
        };
      } catch (rcError) {
        console.error('❌ RevenueCat linking failed:', rcError);
        return {
          success: false,
          error: `RevenueCat linking failed: ${rcError.message}`,
          userId: signUpData.user.id
        };
      }
    } else {
      console.log('⚠️  Skipping RevenueCat test (Expo Go or missing SDK)');
      return {
        success: true,
        userId: signUpData.user.id,
        testEmail,
        note: 'RevenueCat test skipped - not in production build'
      };
    }
    
  } catch (error) {
    console.error('❌ User creation test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export for easy testing
export default {
  debugRevenueCat,
  testUserCreationFlow
};
