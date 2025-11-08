// Quick boolean logic test
console.log('🧪 Testing AsyncStorage boolean logic:');

const testCases = [
  { desc: 'New user (null)', value: null },
  { desc: 'New user (undefined)', value: undefined },
  { desc: 'New user (empty string)', value: '' },
  { desc: 'Returning user (true string)', value: 'true' },
  { desc: 'Returning user (false string)', value: 'false' }, // POTENTIAL BUG!
  { desc: 'Returning user (1 string)', value: '1' },
  { desc: 'Returning user (0 string)', value: '0' }
];

testCases.forEach((test, index) => {
  const boolResult = !!test.value;
  const expected = test.desc.includes('Returning user') ? 'LOGIN' : 'LANDING';
  const actual = boolResult ? 'LOGIN' : 'LANDING';
  const status = expected === actual ? '✅' : '❌';
  
  console.log(`${index + 1}. ${test.desc}:`);
  console.log(`   Value: ${JSON.stringify(test.value)} → !!value: ${boolResult}`);
  console.log(`   Expected: ${expected}, Actual: ${actual} ${status}`);
});

console.log('\n🎯 Key insight: "false" string is truthy!');
console.log('   If AsyncStorage has "false", it will show LOGIN (wrong)');
console.log('   We should check for specific value "true", not just truthiness');
