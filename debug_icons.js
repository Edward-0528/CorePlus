// Debug script to check icon configuration
const fs = require('fs');
const path = require('path');

console.log('🎨 ICON CONFIGURATION DEBUG');
console.log('============================');

// Check app.json configuration
try {
  const appConfig = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  
  console.log('\n📱 App Configuration:');
  console.log('- Global icon:', appConfig.expo.icon);
  console.log('- iOS icon:', appConfig.expo.ios?.icon || 'Using global');
  console.log('- Android icon:', appConfig.expo.android?.icon);
  console.log('- Android adaptive icon foreground:', appConfig.expo.android?.adaptiveIcon?.foregroundImage);
  console.log('- Android adaptive icon background:', appConfig.expo.android?.adaptiveIcon?.backgroundColor);
  
} catch (error) {
  console.error('❌ Error reading app.json:', error.message);
}

// Check if icon files exist
console.log('\n📁 Icon Files Status:');
const iconFiles = [
  './assets/icon.png',
  './assets/ios-icon.png', 
  './assets/adaptive-icon.png',
  './assets/splash-icon.png'
];

iconFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} - ${Math.round(stats.size / 1024)}KB`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check if files are readable
console.log('\n🔍 Detailed Icon Analysis:');
iconFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const buffer = fs.readFileSync(file);
      const isPNG = buffer.toString('hex', 0, 4) === '89504e47';
      console.log(`📋 ${file}:`);
      console.log(`   - Size: ${Math.round(buffer.length / 1024)}KB`);
      console.log(`   - Valid PNG: ${isPNG ? '✅' : '❌'}`);
      console.log(`   - Readable: ✅`);
    } catch (error) {
      console.log(`📋 ${file}: ❌ Read error - ${error.message}`);
    }
  }
});

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Make sure adaptive-icon.png is 1024x1024px');
console.log('2. Make sure icon.png is 1024x1024px');
console.log('3. Adaptive icon should have transparent background');
console.log('4. Clear Expo cache: expo start --clear');
console.log('5. Build fresh production build after icon changes');
