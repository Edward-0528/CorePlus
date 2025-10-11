#!/bin/bash

# Quick test script for production build search functionality
# Run this to test if the search fixes work in a production build

echo "🔧 Testing CorePlus search functionality fixes..."

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Please run this script from the CorePlus root directory"
    exit 1
fi

echo "📦 Building production APK for testing..."

# Build production APK
eas build --platform android --profile production --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo ""
    echo "📱 Install the APK on your Android device and test:"
    echo "   1. Open the food search modal"
    echo "   2. Search for common foods like 'chicken', 'pizza', 'apple'"
    echo "   3. Check if results appear and can be added to meals"
    echo ""
    echo "🔍 If search still doesn't work, check device logs:"
    echo "   adb logcat | grep -i 'search\\|gemini\\|error'"
    echo ""
    echo "🚨 Changes made to fix the search issue:"
    echo "   • Fixed console override in production (now preserves errors)"
    echo "   • Added secure config for API keys"  
    echo "   • Enhanced error handling in search services"
    echo "   • Added fallback search when primary search fails"
    echo "   • Improved logging for production debugging"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
