@echo off
echo Getting SHA-1 fingerprint for Google Fit setup...
echo.

echo Debug Keystore SHA-1:
echo.
keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android | findstr SHA1:

echo.
echo Copy the SHA-1 fingerprint above and add it to your Google Cloud Console OAuth Client ID.
echo.
echo Next steps:
echo 1. Go to https://console.cloud.google.com/
echo 2. Select or create a project
echo 3. Enable Fitness API
echo 4. Create OAuth 2.0 Client ID for Android
echo 5. Use package name: com.anonymous.coreplus
echo 6. Add the SHA-1 fingerprint shown above
echo.
pause
