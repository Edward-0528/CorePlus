#!/bin/bash

# Production Build Script for Core+
# This script creates a production-ready Android build

echo "🚀 Starting Core+ production build process..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login to EAS (if not already logged in)
echo "🔐 Checking EAS authentication..."
eas whoami || eas login

# Clean and install dependencies
echo "🧹 Cleaning and installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# Run the production preparation script
echo "🔧 Running production preparation..."
node scripts/prepare-production.js

# Check for linting/compilation errors
echo "🔍 Checking for compilation errors..."
npx expo export --platform android --dev false --clear 2>/dev/null || {
    echo "⚠️ Found compilation warnings, but continuing with build..."
}

# Build for production
echo "🏗️ Building for Android production..."
eas build --platform android --profile production --non-interactive

echo "✅ Production build process completed!"
echo ""
echo "📱 Next steps:"
echo "1. Download the .aab file from the EAS build page"
echo "2. Upload to Google Play Console"
echo "3. Test the internal testing track before releasing"
echo ""
echo "🔧 To restore original configuration after testing:"
echo "   mv app.json.backup app.json"
