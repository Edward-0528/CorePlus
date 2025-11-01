// Simple test script to check returning user status
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testReturningUserStatus = async () => {
  console.log('🔍 TESTING RETURNING USER STATUS');
  console.log('================================');
  
  try {
    const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
    const savedEmail = await AsyncStorage.getItem('lastLoginEmail');
    
    console.log('Storage values:');
    console.log('- hasLoggedInBefore:', hasLoggedInBefore);
    console.log('- lastLoginEmail:', savedEmail);
    
    console.log('Boolean checks:');
    console.log('- !!hasLoggedInBefore:', !!hasLoggedInBefore);
    console.log('- !!savedEmail:', !!savedEmail);
    
    console.log('Expected behavior:');
    if (hasLoggedInBefore) {
      console.log('✅ Should skip landing page → go to login screen');
    } else {
      console.log('❌ Should show landing page (new user)');
    }
    
    return {
      hasLoggedInBefore: !!hasLoggedInBefore,
      savedEmail: savedEmail,
      shouldSkipLanding: !!hasLoggedInBefore
    };
    
  } catch (error) {
    console.error('❌ Error checking returning user status:', error);
    return {
      hasLoggedInBefore: false,
      savedEmail: null,
      shouldSkipLanding: false
    };
  }
};

// Call this function in your app to test
if (__DEV__) {
  // Auto-test on app load in development
  setTimeout(() => {
    testReturningUserStatus();
  }, 2000);
}
