# 🔐 SECURITY CONFIGURATION GUIDE

## ⚠️ CRITICAL SECURITY NOTICE
**NEVER commit API keys, tokens, or credentials to version control!**

## Environment Variables Setup

### Development (.env file)
Create a `.env` file in your project root with:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Keys
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
EXPO_PUBLIC_RAPIDAPI_KEY=your-rapidapi-key
EXPO_PUBLIC_SPOONACULAR_API_KEY=your-spoonacular-key
EXPO_PUBLIC_USDA_API_KEY=your-usda-key

# RevenueCat (Subscription Management)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your-ios-key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your-android-key
```

### Production Builds (EAS)
For production builds, set environment variables in EAS:

```bash
# Set production environment variables
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
# ... repeat for all variables
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded API keys in source code
- [ ] All sensitive data uses environment variables
- [ ] Production secrets configured in EAS
- [ ] Google services files (.json/.plist) excluded from git

## Security Best Practices

1. **Environment Variables Only**: All sensitive data must use `process.env.EXPO_PUBLIC_*`
2. **No Fallback Values**: Never use hardcoded fallbacks for production
3. **Validate Configuration**: Always check if environment variables exist
4. **Separate Environments**: Use different keys for development/staging/production

## Files That Must Stay Private

- `.env` (all variants)
- `google-services.json`
- `GoogleService-Info.plist` 
- Any files containing API keys or tokens
