// Production-safe configuration using EAS environment variables
// This replaces hardcoded values with secure environment variables

export const getConfigValue = (key, required = true) => {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}. Please configure it in EAS secrets.`);
  }
  
  return value;
};

// Export configuration with validation
export const config = {
  supabase: {
    url: getConfigValue('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: getConfigValue('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },
  apis: {
    gemini: getConfigValue('EXPO_PUBLIC_GEMINI_API_KEY'),
    rapidApi: getConfigValue('EXPO_PUBLIC_RAPIDAPI_KEY'),
    spoonacular: getConfigValue('EXPO_PUBLIC_SPOONACULAR_API_KEY'),
    usda: getConfigValue('EXPO_PUBLIC_USDA_API_KEY'),
  },
  revenueCat: {
    ios: getConfigValue('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'),
    android: getConfigValue('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'),
  }
};

// Validate all configuration on app start (development only)
if (__DEV__) {
  console.log('🔧 Configuration Status:');
  console.log('  - Supabase URL:', !!config.supabase.url);
  console.log('  - Supabase Key:', !!config.supabase.anonKey);
  console.log('  - All APIs configured:', Object.values(config.apis).every(Boolean));
  console.log('  - RevenueCat configured:', !!config.revenueCat.ios && !!config.revenueCat.android);
}
