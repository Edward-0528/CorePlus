# Get SHA-1 fingerprint for Google Fit setup
Write-Host "Getting SHA-1 fingerprint for Google Fit setup..." -ForegroundColor Green
Write-Host ""

Write-Host "Debug Keystore SHA-1:" -ForegroundColor Yellow
Write-Host ""

try {
    $output = & keytool -list -v -keystore "android\app\debug.keystore" -alias androiddebugkey -storepass android -keypass android 2>&1
    $sha1Line = $output | Where-Object { $_ -match "SHA1:" }
    if ($sha1Line) {
        Write-Host $sha1Line -ForegroundColor Cyan
    } else {
        Write-Host "SHA-1 fingerprint not found in output" -ForegroundColor Red
        Write-Host "Full output:" -ForegroundColor Yellow
        $output | ForEach-Object { Write-Host $_ }
    }
} catch {
    Write-Host "Error getting SHA-1: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Copy the SHA-1 fingerprint above and add it to your Google Cloud Console OAuth Client ID." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://console.cloud.google.com/"
Write-Host "2. Select or create a project"
Write-Host "3. Enable Fitness API"
Write-Host "4. Create OAuth 2.0 Client ID for Android"
Write-Host "5. Use package name: com.anonymous.coreplus"
Write-Host "6. Add the SHA-1 fingerprint shown above"
Write-Host ""
Read-Host "Press Enter to continue"
