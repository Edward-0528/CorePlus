// Simple script to test AsyncStorage values in React Native
// Add this to App.js temporarily to debug
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testAsyncStorageValues = async () => {
  try {
    console.log('🔍 ===========================================');
    console.log('🔍 TESTING ASYNCSTORAGE VALUES');
    console.log('🔍 ===========================================');
    
    const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
    const lastLoginEmail = await AsyncStorage.getItem('lastLoginEmail');
    
    console.log('📱 Raw AsyncStorage values:');
    console.log('  - hasLoggedInBefore:', JSON.stringify(hasLoggedInBefore));
    console.log('  - hasLoggedInBefore type:', typeof hasLoggedInBefore);
    console.log('  - !!hasLoggedInBefore:', !!hasLoggedInBefore);
    console.log('  - lastLoginEmail:', JSON.stringify(lastLoginEmail));
    
    console.log('🧪 Logic test:');
    if (hasLoggedInBefore) {
      console.log('  - Result: Should show LOGIN screen (returning user)');
    } else {
      console.log('  - Result: Should show LANDING screen (new user)');
    }
    
    console.log('🔍 ===========================================');
    
    return {
      hasLoggedInBefore,
      lastLoginEmail,
      shouldShowLogin: !!hasLoggedInBefore
    };
  } catch (error) {
    console.error('❌ AsyncStorage test error:', error);
    return null;
  }
};
