#!/bin/bash
# Pre-build validation script for Google Play Store

echo "🔍 Validating Core+ for Google Play Store deployment..."

# Check required files
echo "📁 Checking required assets..."
if [ ! -f "./assets/icon.png" ]; then
    echo "❌ Missing app icon (./assets/icon.png)"
    exit 1
fi

if [ ! -f "./assets/adaptive-icon.png" ]; then
    echo "❌ Missing adaptive icon (./assets/adaptive-icon.png)"
    exit 1
fi

echo "✅ Assets found"

# Validate app.json
echo "📋 Validating app.json configuration..."
node -e "
const config = require('./app.json');
const android = config.expo.android;

// Check required fields
if (!android.package) {
    console.log('❌ Missing android.package in app.json');
    process.exit(1);
}

if (!android.versionCode) {
    console.log('❌ Missing android.versionCode in app.json');
    process.exit(1);
}

if (!config.expo.version) {
    console.log('❌ Missing version in app.json');
    process.exit(1);
}

console.log('✅ app.json configuration valid');
console.log('📦 Package:', android.package);
console.log('🔢 Version:', config.expo.version, '(' + android.versionCode + ')');
"

# Check EAS configuration
echo "🏗️ Validating EAS configuration..."
if [ ! -f "./eas.json" ]; then
    echo "❌ Missing eas.json file"
    exit 1
fi

node -e "
const eas = require('./eas.json');
if (!eas.build || !eas.build.production) {
    console.log('❌ Missing production build configuration in eas.json');
    process.exit(1);
}
console.log('✅ EAS configuration valid');
"

echo ""
echo "🎉 Core+ is ready for Google Play Store deployment!"
echo ""
echo "Next steps:"
echo "1. Run: npm run build:android"
echo "2. Complete Google Play Console setup"
echo "3. Upload AAB to Internal testing track"
echo ""
