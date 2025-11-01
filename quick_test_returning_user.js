// Quick test to verify returning user detection
// Run this in the app to manually test the scenario

import AsyncStorage from '@react-native-async-storage/async-storage';

export const quickTestReturningUser = async () => {
  console.log('🧪 QUICK TEST: Returning User Detection');
  console.log('=====================================');
  
  // Step 1: Clear any existing data to start fresh
  console.log('1. Clearing existing data...');
  await AsyncStorage.removeItem('hasLoggedInBefore');
  await AsyncStorage.removeItem('lastLoginEmail');
  
  // Step 2: Verify it's cleared
  let check1 = await AsyncStorage.getItem('hasLoggedInBefore');
  console.log('2. After clear - hasLoggedInBefore:', JSON.stringify(check1));
  console.log('   Should be null for NEW user → LANDING screen');
  
  // Step 3: Simulate a user logging in (set the flag)
  console.log('3. Simulating login...');
  await AsyncStorage.setItem('hasLoggedInBefore', 'true');
  await AsyncStorage.setItem('lastLoginEmail', 'test@example.com');
  
  // Step 4: Check what a returning user check would see
  let check2 = await AsyncStorage.getItem('hasLoggedInBefore');
  console.log('4. After login - hasLoggedInBefore:', JSON.stringify(check2));
  console.log('   Type:', typeof check2);
  console.log('   Boolean conversion:', !!check2);
  console.log('   Should be truthy for RETURNING user → LOGIN screen');
  
  // Step 5: Test the exact logic from App.js
  console.log('5. Testing App.js logic:');
  if (check2) {
    console.log('   ✅ Logic says: SHOW LOGIN SCREEN (returning user)');
  } else {
    console.log('   ❌ Logic says: SHOW LANDING SCREEN (new user)');
  }
  
  console.log('=====================================');
  console.log('🎯 EXPECTED BEHAVIOR:');
  console.log('   - First time: Landing → Login → Dashboard');
  console.log('   - Next times: Login → Dashboard (skip landing)');
  
  return {
    beforeLogin: check1,
    afterLogin: check2,
    logicResult: !!check2
  };
};
