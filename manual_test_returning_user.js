// Manual test for returning user detection
// Call this function in the app console to test

console.log('🧪 Setting up manual test for returning user detection...');

// Function to simulate the exact App.js logic
const simulateReturningUserLogic = async () => {
  console.log('\n=====================================');
  console.log('🧪 MANUAL TEST: Returning User Logic');
  console.log('=====================================');
  
  // Import AsyncStorage (this will work in the app context)
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  console.log('\n📱 Step 1: Check current AsyncStorage state');
  try {
    const hasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
    const lastLoginEmail = await AsyncStorage.getItem('lastLoginEmail');
    
    console.log('Current values:');
    console.log('  hasLoggedInBefore:', JSON.stringify(hasLoggedInBefore));
    console.log('  lastLoginEmail:', JSON.stringify(lastLoginEmail));
    console.log('  Boolean conversion:', !!hasLoggedInBefore);
    
    console.log('\n🔄 Step 2: Simulate App.js logic');
    if (hasLoggedInBefore) {
      console.log('✅ RESULT: Should show LOGIN screen (returning user)');
      console.log('   Actions that would be taken:');
      console.log('   - setShowLanding(false)');
      console.log('   - setShowLogin(true)');
      console.log('   - setIsAuthenticated(false)');
    } else {
      console.log('✅ RESULT: Should show LANDING screen (new user)');
      console.log('   Actions that would be taken:');
      console.log('   - setShowLanding(true)');
      console.log('   - setIsAuthenticated(false)');
    }
    
    console.log('\n🧪 Step 3: Simulate login to test next startup');
    console.log('Setting hasLoggedInBefore to "true"...');
    await AsyncStorage.setItem('hasLoggedInBefore', 'true');
    await AsyncStorage.setItem('lastLoginEmail', 'test@example.com');
    
    console.log('\n🔄 Step 4: Re-test logic with new values');
    const newHasLoggedInBefore = await AsyncStorage.getItem('hasLoggedInBefore');
    console.log('New hasLoggedInBefore:', JSON.stringify(newHasLoggedInBefore));
    console.log('New Boolean conversion:', !!newHasLoggedInBefore);
    
    if (newHasLoggedInBefore) {
      console.log('✅ AFTER LOGIN: Should show LOGIN screen on next app start');
    } else {
      console.log('❌ PROBLEM: Should show LOGIN but logic says LANDING');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  console.log('\n=====================================');
  console.log('🎯 To test: Close and reopen the app');
  console.log('   Expected: Go directly to LOGIN screen');
  console.log('   Current:  May be going to LANDING screen');
  console.log('=====================================\n');
};

// Export for manual testing
global.testReturningUser = simulateReturningUserLogic;

console.log('✅ Test ready! Call global.testReturningUser() to run the test');
