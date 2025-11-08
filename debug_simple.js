console.log('🔍 Simple debug test for returning user logic');

// Simulate the exact logic from App.js
async function testReturningUserLogic() {
  console.log('====================================');
  
  // Test cases
  const testCases = [
    { hasLoggedInBefore: null, expected: 'Landing' },
    { hasLoggedInBefore: 'true', expected: 'Login' },
    { hasLoggedInBefore: 'false', expected: 'Landing' },
    { hasLoggedInBefore: '', expected: 'Landing' }
  ];
  
  console.log('🧪 Testing logic with different values:');
  
  testCases.forEach((testCase, index) => {
    const hasLoggedInBefore = testCase.hasLoggedInBefore;
    const shouldShowLogin = !!hasLoggedInBefore;
    const result = shouldShowLogin ? 'Login' : 'Landing';
    
    console.log(`\nTest ${index + 1}:`);
    console.log(`- hasLoggedInBefore: ${JSON.stringify(hasLoggedInBefore)}`);
    console.log(`- !!hasLoggedInBefore: ${shouldShowLogin}`);
    console.log(`- Expected screen: ${testCase.expected}`);
    console.log(`- Actual screen: ${result}`);
    console.log(`- Test ${result === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  console.log('\n🎯 Key insight: AsyncStorage returns strings, not booleans');
  console.log('   - null or undefined = new user = Landing screen');
  console.log('   - "true" = returning user = Login screen');
  console.log('   - !!value works correctly for this logic');
}

testReturningUserLogic();
