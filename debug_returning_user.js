// Simple debug script to test returning user detection
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugReturningUser = async () => {
  console.log('🐛 DEBUG: Returning User Detection');
  console.log('====================================');
  
  try {
    // Read current values
    const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
    const lastLoginEmail = await AsyncStorage.getItem('lastLoginEmail');
    
    console.log('📱 Current AsyncStorage values:');
    console.log('- hasLoggedInBefore (raw):', hasLoggedInBefore);
    console.log('- hasLoggedInBefore (type):', typeof hasLoggedInBefore);
    console.log('- hasLoggedInBefore (boolean):', !!hasLoggedInBefore);
    console.log('- lastLoginEmail:', lastLoginEmail);
    
    // Test setting values manually
    console.log('\n🧪 Testing manual set:');
    await AsyncStorage.setItem('hasLoggedInBefore', 'true');
    await AsyncStorage.setItem('lastLoginEmail', 'test@example.com');
    
    // Read them back
    const testRead1 = await AsyncStorage.getItem('hasLoggedInBefore');
    const testRead2 = await AsyncStorage.getItem('lastLoginEmail');
    
    console.log('- After manual set - hasLoggedInBefore:', testRead1);
    console.log('- After manual set - lastLoginEmail:', testRead2);
    console.log('- Boolean check:', !!testRead1);
    
    return {
      originalHasLoggedIn: hasLoggedInBefore,
      originalEmail: lastLoginEmail,
      shouldShowLogin: !!hasLoggedInBefore
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};

// Call this in your app to debug
if (__DEV__) {
  console.log('🚀 Debug script loaded. Call debugReturningUser() to test.');
}
